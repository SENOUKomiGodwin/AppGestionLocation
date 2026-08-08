<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\RentDue;
use App\Services\PdfService;

class InvoiceController extends Controller
{
    public function __construct(private readonly PdfService $pdfService)
    {
    }

    /** Télécharge la facture PDF d'une échéance. */
    public function invoice(RentDue $rentDue)
    {
        abort_unless(
            $this->canAccessDue($rentDue),
            403,
            'Accès refusé.'
        );

        return $this->pdfService->invoice($rentDue);
    }

    /** Télécharge le reçu PDF d'un paiement (avec QR code). */
    public function receipt(Payment $payment)
    {
        abort_unless(
            auth()->user()?->seesAllData()
                || $payment->tenant?->user_id === auth()->id(),
            403,
            'Accès refusé.'
        );

        return $this->pdfService->receipt($payment);
    }

    private function canAccessDue(RentDue $due): bool
    {
        $user = auth()->user();

        return $user !== null
            && ($user->seesAllData() || $due->tenant?->user_id === $user->id);
    }
}
