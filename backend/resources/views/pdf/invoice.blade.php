@extends('pdf.layout')

@section('content')
    <h2>Facture de loyer — {{ $due->period }}</h2>

    <div class="info-block">
        <h3>Facturé à</h3>
        <p><strong>{{ $due->tenant->full_name }}</strong></p>
        @if($due->tenant->phone) <p>Tél : {{ $due->tenant->phone }}</p> @endif
        @if($due->tenant->email) <p>Email : {{ $due->tenant->email }}</p> @endif
    </div>

    <div class="info-block right">
        <h3>Détails</h3>
        <p>N° facture : FAC-{{ $due->period }}-{{ $due->id }}</p>
        <p>Date d'échéance : {{ $due->due_date->format('d/m/Y') }}</p>
        <p>Statut : {{ $due->status_label }}</p>
    </div>
    <div class="clearfix"></div>

    <table class="table">
        <thead>
            <tr>
                <th>Désignation</th>
                <th>Période</th>
                <th>Montant</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    Loyer — {{ $due->unit->house->name }}, logement {{ $due->unit->number }}
                    ({{ $due->unit->type_label }})
                </td>
                <td>{{ $due->period }}</td>
                <td class="amount">{{ number_format($due->amount, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</td>
            </tr>
        </tbody>
    </table>

    @if($due->paid_amount > 0)
        <table class="table">
            <tr>
                <th>Montant déjà réglé</th>
                <td>{{ number_format($due->paid_amount, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</td>
            </tr>
            <tr>
                <th>Solde restant</th>
                <td class="amount">{{ number_format($due->balance, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</td>
            </tr>
        </table>
    @endif

    <div class="total-box">
        <div class="label">Total à payer</div>
        <div class="value">{{ number_format($due->balance, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</div>
    </div>

    <p class="muted" style="margin-top: 24px;">
        Merci de régler votre loyer avant la date d'échéance. En cas de retard, des pénalités
        peuvent s'appliquer conformément aux conditions du contrat de bail.
    </p>
@endsection
