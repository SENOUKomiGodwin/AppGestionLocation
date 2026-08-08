<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Models\RentDue;
use App\Models\Tenant;
use App\Models\Unit;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Services\PdfService;
use App\Services\RentDueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ContractController extends Controller
{
    public function __construct(
        private readonly PdfService $pdfService,
        private readonly RentDueService $rentDueService,
    ) {
    }

    /**
     * Liste paginée des contrats.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Contract::class);

        $user = $request->user();

        $contracts = Contract::query()
            ->with(['tenant', 'unit.house'])
            ->when($user !== null && ! $user->seesAllData(), fn ($q) => $q->whereHas(
                'unit.house',
                fn ($h) => $h->where('user_id', $user->id)
            ))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('tenant_id'), fn ($q) => $q->where('tenant_id', $request->integer('tenant_id')))
            ->when($request->filled('unit_id'), fn ($q) => $q->where('unit_id', $request->integer('unit_id')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->whereHas('tenant', function ($t) use ($search) {
                    $t->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('sort'), fn ($q) => $q->orderBy(
                $request->string('sort'),
                $request->string('direction', 'asc') === 'desc' ? 'desc' : 'asc'
            ), fn ($q) => $q->latest())
            ->paginate($request->integer('per_page', 15));

        return ContractResource::collection($contracts);
    }

    public function show(Request $request, Contract $contract): ContractResource
    {
        $this->authorize('view', $contract);

        $contract->load(['tenant', 'unit.house', 'rentDues.payments', 'renewals.tenant', 'renewalOf']);

        return new ContractResource($contract);
    }

    /**
     * Création d'un contrat : vérifie qu'aucun contrat actif n'existe sur
     * le logement, met le logement "occupé", génère le PDF et les échéances.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Contract::class);

        $validated = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'duration_months' => ['nullable', 'integer', 'min:1', 'max:120'],
            'monthly_rent' => ['required', 'numeric', 'min:0'],
            'deposit' => ['nullable', 'numeric', 'min:0'],
            'billing_day' => ['nullable', 'integer', 'between:1,28'],
            'status' => ['nullable', 'in:active,expire,resilie,renouvele'],
        ]);

        $unit = Unit::findOrFail($validated['unit_id']);
        $tenant = Tenant::findOrFail($validated['tenant_id']);

        // Un logement ne peut avoir qu'un seul locataire actif
        if ($unit->activeContract()->exists()) {
            return response()->json([
                'message' => 'Ce logement a déjà un contrat actif.',
                'errors' => ['unit_id' => ['Un logement ne peut avoir qu\'un seul locataire actif.']],
            ], 422);
        }

        $contract = Contract::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'duration_months' => $validated['duration_months'] ?? \Carbon\Carbon::parse($validated['start_date'])->diffInMonths(\Carbon\Carbon::parse($validated['end_date'])),
            'monthly_rent' => $validated['monthly_rent'],
            'deposit' => $validated['deposit'] ?? 0,
            'billing_day' => $validated['billing_day'] ?? 1,
            'status' => $validated['status'] ?? Contract::STATUS_ACTIVE,
        ]);

        // Le logement devient occupé
        $unit->update(['status' => Unit::STATUS_OCCUPE]);
        $tenant->update(['is_active' => true]);

        // Génère le PDF du contrat
        try {
            $this->pdfService->generateContract($contract);
        } catch (\Throwable $e) {
            report($e);
        }

        // Génère les échéances dès le premier mois
        $this->rentDueService->generateDueForContract(
            $contract,
            \Carbon\Carbon::parse($contract->start_date)->startOfMonth()
        );

        AuditService::log('created', $contract, ['tenant' => $tenant->full_name, 'unit' => $unit->number]);

        return response()->json([
            'message' => 'Contrat créé. Le PDF et les échéances ont été générés.',
            'contract' => new ContractResource($contract->load(['tenant', 'unit.house'])),
        ], 201);
    }

    public function update(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('update', $contract);

        $validated = $request->validate([
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after:start_date'],
            'duration_months' => ['nullable', 'integer', 'min:1', 'max:120'],
            'monthly_rent' => ['sometimes', 'numeric', 'min:0'],
            'deposit' => ['nullable', 'numeric', 'min:0'],
            'billing_day' => ['nullable', 'integer', 'between:1,28'],
            'status' => ['sometimes', 'in:active,expire,resilie,renouvele'],
        ]);

        $contract->update($validated);

        // Si le contrat est résilié ou expiré, le logement redevient libre
        if (in_array($contract->status, [Contract::STATUS_EXPIRE, Contract::STATUS_RESILIE], true)) {
            $contract->unit?->update(['status' => Unit::STATUS_LIBRE]);
        }

        AuditService::log('updated', $contract, $validated);

        return response()->json([
            'message' => 'Contrat mis à jour.',
            'contract' => new ContractResource($contract->load(['tenant', 'unit.house'])),
        ]);
    }

    /**
     * Téléchargement du PDF du contrat (régénéré si absent).
     */
    public function download(Request $request, Contract $contract): BinaryFileResponse
    {
        $this->authorize('view', $contract);

        if (! $contract->pdf_path) {
            $this->pdfService->generateContract($contract);
        }

        $path = \Storage::disk('public')->path($contract->pdf_path);

        return response()->download($path, 'contrat-'.$contract->id.'.pdf', [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * Renouvellement du contrat : l'ancien passe en "renouvelé",
     * un nouveau contrat est créé en le référençant (historique conservé).
     */
    public function renew(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('update', $contract);

        $validated = $request->validate([
            'new_end_date' => ['nullable', 'date', 'after:today'],
            'duration_months' => ['nullable', 'integer', 'min:1', 'max:120'],
        ]);

        $months = $validated['duration_months'] ?? $contract->duration_months;
        $newStart = $contract->end_date->copy()->addDay();
        $newEnd = $validated['new_end_date'] ?? $newStart->copy()->addMonths($months)->subDay();

        $contract->update(['status' => Contract::STATUS_RENOUVELE]);

        $newContract = Contract::create([
            'tenant_id' => $contract->tenant_id,
            'unit_id' => $contract->unit_id,
            'start_date' => $newStart->format('Y-m-d'),
            'end_date' => $newEnd->format('Y-m-d'),
            'duration_months' => $months,
            'monthly_rent' => $contract->monthly_rent,
            'deposit' => $contract->deposit,
            'billing_day' => $contract->billing_day,
            'status' => Contract::STATUS_ACTIVE,
            'renewal_of_id' => $contract->id,
        ]);

        try {
            $this->pdfService->generateContract($newContract);
        } catch (\Throwable $e) {
            report($e);
        }

        $this->rentDueService->generateDueForContract(
            $newContract,
            \Carbon\Carbon::parse($newContract->start_date)->startOfMonth()
        );

        AuditService::log('renewed', $newContract, ['from' => $contract->id]);

        return response()->json([
            'message' => 'Contrat renouvelé avec succès.',
            'contract' => new ContractResource($newContract->load(['tenant', 'unit.house', 'renewalOf'])),
        ], 201);
    }

    public function destroy(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('delete', $contract);

        $contract->delete();

        // Le logement redevient libre si aucun autre contrat actif
        if ($contract->unit && ! $contract->unit->activeContract()->exists()) {
            $contract->unit->update(['status' => Unit::STATUS_LIBRE]);
        }

        AuditService::log('deleted', null, ['contract' => $contract->id]);

        return response()->json(['message' => 'Contrat supprimé.']);
    }
}
