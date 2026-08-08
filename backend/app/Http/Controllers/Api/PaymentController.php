<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\RentDue;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Services\PdfService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentController extends Controller
{
    public function __construct(private readonly PdfService $pdfService)
    {
    }

    /**
     * Liste paginée des paiements (filtres : période, méthode, locataire).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Payment::class);

        $user = $request->user();

        $payments = Payment::query()
            ->with(['tenant', 'rentDue', 'recordedBy'])
            ->when($user !== null && ! $user->seesAllData(), fn ($q) => $q->whereHas(
                'tenant',
                fn ($t) => $t->where('user_id', $user->id)
            ))
            ->when($request->filled('period'), fn ($q) => $q->whereHas('rentDue', fn ($d) => $d->forPeriod($request->string('period'))))
            ->when($request->filled('method'), fn ($q) => $q->where('method', $request->string('method')))
            ->when($request->filled('tenant_id'), fn ($q) => $q->where('tenant_id', $request->integer('tenant_id')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('payment_date', '>=', $request->string('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('payment_date', '<=', $request->string('to')))
            ->when($request->filled('sort'), fn ($q) => $q->orderBy(
                $request->string('sort'),
                $request->string('direction', 'asc') === 'desc' ? 'desc' : 'asc'
            ), fn ($q) => $q->latest())
            ->paginate($request->integer('per_page', 15));

        return PaymentResource::collection($payments);
    }

    public function show(Request $request, Payment $payment): PaymentResource
    {
        $this->authorize('view', $payment);

        $payment->load(['tenant', 'rentDue', 'recordedBy', 'contract.unit.house']);

        return new PaymentResource($payment);
    }

    /**
     * Enregistre un paiement (complet ou partiel) sur une échéance.
     * Met à jour le statut de l'échéance et génère le reçu PDF.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Payment::class);

        $validated = $request->validate([
            'rent_due_id' => ['required', 'exists:rent_dues,id'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', 'in:especes,virement,carte,cheque'],
            'reference' => ['nullable', 'string', 'max:255'],
            'payment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $due = RentDue::findOrFail($validated['rent_due_id']);

        // Empêche de dépasser le solde de l'échéance
        $maxAmount = round($due->balance, 2);
        if ($validated['amount'] > $maxAmount) {
            return response()->json([
                'message' => 'Le montant dépasse le solde restant.',
                'errors' => ['amount' => ["Le solde restant est de {$maxAmount}."]],
            ], 422);
        }

        $payment = Payment::create([
            'rent_due_id' => $due->id,
            'contract_id' => $due->contract_id,
            'tenant_id' => $due->tenant_id,
            'amount' => $validated['amount'],
            'method' => $validated['method'],
            'reference' => $validated['reference'] ?? null,
            'payment_date' => $validated['payment_date'] ?? now()->toDateString(),
            'notes' => $validated['notes'] ?? null,
            'recorded_by' => $request->user()->id,
        ]);

        // Mise à jour de l'échéance
        $due->paid_amount = round($due->paid_amount + $payment->amount, 2);

        if ($due->paid_amount >= $due->amount) {
            $due->status = RentDue::STATUS_PAID;
            $due->payment_date = now();
        } else {
            $due->status = RentDue::STATUS_PARTIAL;
            $due->payment_date = now();
        }

        $due->save();

        // Génère le reçu PDF avec QR code
        try {
            $path = $this->pdfService->generateReceipt($payment);
            $payment->update(['receipt_path' => $path]);
        } catch (\Throwable $e) {
            report($e);
        }

        AuditService::log('payment', $due, [
            'amount' => $payment->amount,
            'method' => $payment->method,
            'period' => $due->period,
        ]);

        // Notification au propriétaire
        NotificationService::toDatabase(
            $request->user(),
            'Paiement enregistré',
            "Paiement de ".number_format($payment->amount, 2, ',', ' ').' enregistré pour '.$due->tenant?->full_name.' ('.$due->period.').',
            ['url' => "/payments?period={$due->period}", 'icon' => 'check']
        );

        return response()->json([
            'message' => $due->status === RentDue::STATUS_PAID
                ? 'Paiement complet enregistré.'
                : 'Paiement partiel enregistré. Solde restant : '.number_format($due->balance, 2, ',', ' ').'.',
            'payment' => new PaymentResource($payment->load(['tenant', 'rentDue'])),
            'due' => $due,
        ], 201);
    }
}
