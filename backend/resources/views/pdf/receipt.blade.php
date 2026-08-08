@extends('pdf.layout')

@section('content')
    <h2>Reçu de paiement</h2>

    <div class="qr">
        {!! $qrCode !!}
        <p>Scannez pour vérifier</p>
    </div>

    <div class="info-block">
        <h3>Reçu n° {{ $payment->receiptNumber }}</h3>
        <p>Date : {{ $payment->payment_date->format('d/m/Y') }}</p>
        <p>Mode de paiement : {{ $payment->method_label }}</p>
        @if($payment->reference) <p>Référence : {{ $payment->reference }}</p> @endif
    </div>
    <div class="clearfix"></div>

    <table class="table">
        <tr>
            <th>Locataire</th>
            <td>{{ $payment->tenant->full_name }}</td>
        </tr>
        <tr>
            <th>Bien</th>
            <td>{{ $payment->unit ? $payment->unit->house->name.' — logement '.$payment->unit->number : '-' }}</td>
        </tr>
        <tr>
            <th>Période concernée</th>
            <td>{{ $payment->rentDue?->period }}</td>
        </tr>
        <tr>
            <th>Montant reçu</th>
            <td class="amount">{{ number_format($payment->amount, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</td>
        </tr>
        <tr>
            <th>Solde restant sur la période</th>
            <td>{{ number_format($payment->rentDue?->balance ?? 0, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</td>
        </tr>
    </table>

    <div class="total-box">
        <div class="label">Montant encaissé</div>
        <div class="value">{{ number_format($payment->amount, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</div>
    </div>

    <p class="muted" style="margin-top: 24px;">
        Reçu délivré par {{ $settings['company_name'] ?? 'ImmoManager' }}. Ce document fait foi
        de paiement pour la période et le montant indiqués.
    </p>
@endsection
