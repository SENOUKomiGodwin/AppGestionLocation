<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RentDueResource;
use App\Models\RentDue;
use App\Services\AuditService;
use App\Services\RentDueService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RentDueController extends Controller
{
    public function __construct(private readonly RentDueService $rentDueService)
    {
    }

    /**
     * Liste paginée des échéances (filtres : période, statut, locataire, logement).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $dues = RentDue::query()
            ->with(['tenant', 'unit.house', 'payments'])
            ->when($user !== null && ! $user->seesAllData(), fn ($q) => $q->whereHas(
                'tenant',
                fn ($t) => $t->where('user_id', $user->id)
            ))
            ->when($request->filled('period'), fn ($q) => $q->forPeriod($request->string('period')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('tenant_id'), fn ($q) => $q->where('tenant_id', $request->integer('tenant_id')))
            ->when($request->filled('unit_id'), fn ($q) => $q->where('unit_id', $request->integer('unit_id')))
            ->when($request->filled('late'), fn ($q) => $q->late())
            ->when($request->filled('sort'), fn ($q) => $q->orderBy(
                $request->string('sort'),
                $request->string('direction', 'asc') === 'desc' ? 'desc' : 'asc'
            ), fn ($q) => $q->orderByDesc('due_date'))
            ->paginate($request->integer('per_page', 15));

        return RentDueResource::collection($dues);
    }

    public function show(Request $request, RentDue $rentDue): RentDueResource
    {
        $rentDue->load(['tenant', 'unit.house', 'payments.recordedBy', 'contract']);

        return new RentDueResource($rentDue);
    }

    /**
     * Génère les échéances manquantes + actualise les statuts (retards...).
     */
    public function generate(Request $request): JsonResponse
    {
        // Seuls gestionnaires et super-admins peuvent lancer la génération
        abort_unless(
            $request->user()->isSuperAdmin() || $request->user()->isGestionnaire(),
            403,
            'Accès refusé.'
        );

        $monthsAhead = (int) $request->integer('months_ahead', 3);

        $result = $this->rentDueService->run($monthsAhead);

        AuditService::log('rent_dues_generated', null, $result);

        return response()->json([
            'message' => "{$result['created']} échéance(s) créée(s), {$result['refreshed']} statut(s) actualisé(s).",
            ...$result,
        ]);
    }
}
