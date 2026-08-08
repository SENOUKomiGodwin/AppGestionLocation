<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Payment;
use App\Models\RentDue;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfService
{
    /**
     * Génère le PDF d'un contrat de bail, l'enregistre et met à jour le modèle.
     */
    public function generateContract(Contract $contract): string
    {
        $filename = 'contrat-'.$contract->id.'-'.Str::slug($contract->tenant?->full_name).'.pdf';

        $pdf = Pdf::loadView('pdf.contract', [
            'contract' => $contract,
            'settings' => Setting::allFor($contract->unit?->house?->owner),
        ])->setPaper('a4');

        $path = 'documents/contrats/'.$filename;
        Storage::disk('public')->put($path, $pdf->output());

        $contract->update(['pdf_path' => $path]);

        return $path;
    }

    /**
     * Génère une facture PDF pour une échéance (téléchargement direct).
     */
    public function invoice(RentDue $due, bool $download = true)
    {
        $filename = 'facture-'.$due->period.'-'.$due->id.'.pdf';

        $pdf = Pdf::loadView('pdf.invoice', [
            'due' => $due,
            'settings' => Setting::allFor($due->contract?->unit?->house?->owner),
        ])->setPaper('a4');

        return $download
            ? $pdf->download($filename)
            : $pdf->stream($filename);
    }

    /**
     * Génère un reçu PDF avec QR code pour un paiement (téléchargement direct).
     */
    public function receipt(Payment $payment, bool $download = true)
    {
        $filename = 'recu-'.$payment->receiptNumber.'.pdf';

        $pdf = Pdf::loadView('pdf.receipt', [
            'payment' => $payment,
            'settings' => Setting::allFor($payment->contract?->unit?->house?->owner),
            'qrCode' => $this->qrCodeDataUri($payment),
        ])->setPaper('a4');

        return $download
            ? $pdf->download($filename)
            : $pdf->stream($filename);
    }

    /**
     * Génère le reçu PDF, l'enregistre sur disque et retourne son chemin.
     */
    public function generateReceipt(Payment $payment): string
    {
        $filename = 'recu-'.$payment->receiptNumber.'.pdf';

        $pdf = Pdf::loadView('pdf.receipt', [
            'payment' => $payment,
            'settings' => Setting::allFor($payment->contract?->unit?->house?->owner),
            'qrCode' => $this->qrCodeDataUri($payment),
        ])->setPaper('a4');

        $path = 'documents/recus/'.$filename;
        Storage::disk('public')->put($path, $pdf->output());

        return $path;
    }

    /**
     * QR code du reçu en data URI (PNG) pour intégration dans le PDF.
     * Contient un lien de vérification du paiement.
     */
    protected function qrCodeDataUri(Payment $payment): string
    {
        $content = url("/verify/receipt/{$payment->receiptNumber}");

        try {
            $qrCode = new QrCode(
                data: $content,
                encoding: new Encoding('UTF-8'),
                errorCorrectionLevel: ErrorCorrectionLevel::High,
                size: 140,
                margin: 1,
            );

            $png = (new PngWriter())->write($qrCode)->getString();

            return 'data:image/png;base64,'.base64_encode($png);
        } catch (\Throwable) {
            return '';
        }
    }
}
