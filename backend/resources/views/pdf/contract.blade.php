@extends('pdf.layout')

@section('content')
    <h2>Contrat de bail</h2>

    <div class="info-block">
        <h3>Bailleur</h3>
        <p><strong>{{ $settings['company_name'] ?? 'ImmoManager' }}</strong></p>
        @if(!empty($settings['company_address']))
            <p>{{ $settings['company_address'] }}</p>
        @endif
        @if(!empty($settings['company_phone']))
            <p>Tél : {{ $settings['company_phone'] }}</p>
        @endif
    </div>

    <div class="info-block right">
        <h3>Locataire</h3>
        <p><strong>{{ $contract->tenant->full_name }}</strong></p>
        @if($contract->tenant->phone) <p>Tél : {{ $contract->tenant->phone }}</p> @endif
        @if($contract->tenant->email) <p>Email : {{ $contract->tenant->email }}</p> @endif
        @if($contract->tenant->id_number) <p>CNI/Passeport : {{ $contract->tenant->id_number }}</p> @endif
        @if($contract->tenant->nationality) <p>Nationalité : {{ $contract->tenant->nationality }}</p> @endif
    </div>
    <div class="clearfix"></div>

    <table class="table">
        <tr>
            <th>Bien loué</th>
            <td>{{ $contract->unit->house->name }} — Logement {{ $contract->unit->number }}
                ({{ $contract->unit->type_label }})</td>
        </tr>
        <tr>
            <th>Adresse</th>
            <td>{{ $contract->unit->house->address }}{{ $contract->unit->house->city ? ', '.$contract->unit->house->city : '' }}</td>
        </tr>
        <tr>
            <th>Surface</th>
            <td>{{ number_format($contract->unit->surface, 2, ',', ' ') }} m²</td>
        </tr>
        <tr>
            <th>Chambres</th>
            <td>{{ $contract->unit->bedrooms }}</td>
        </tr>
        <tr>
            <th>Date d'entrée</th>
            <td>{{ $contract->start_date->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <th>Date de sortie</th>
            <td>{{ $contract->end_date->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <th>Durée du bail</th>
            <td>{{ $contract->duration_months }} mois</td>
        </tr>
        <tr>
            <th>Loyer mensuel</th>
            <td class="amount">{{ number_format($contract->monthly_rent, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</td>
        </tr>
        <tr>
            <th>Caution</th>
            <td>{{ number_format($contract->deposit, 2, ',', ' ') }} {{ $settings['currency'] ?? 'EUR' }}</td>
        </tr>
        <tr>
            <th>Jour d'échéance</th>
            <td>Le {{ $contract->billing_day }} de chaque mois</td>
        </tr>
        <tr>
            <th>Statut</th>
            <td class="badge-active">{{ $contract->status_label }}</td>
        </tr>
    </table>

    <p>
        Le présent contrat est conclu entre le bailleur et le locataire ci-dessus désignés,
        pour la location du logement décrit, aux conditions énoncées dans le présent document.
        Le locataire s'engage à régler le loyer mensuel à la date d'échéance convenue.
    </p>

    <div class="clearfix"></div>
    <div style="margin-top: 40px; overflow: hidden;">
        <div style="float: left; width: 45%;">
            <p class="muted">Fait le {{ now()->format('d/m/Y') }}</p>
            <p><strong>Signature du bailleur</strong></p>
            <div style="height: 60px;"></div>
            <p>____________________________</p>
        </div>
        <div style="float: right; width: 45%; text-align: right;">
            <p><strong>Signature du locataire</strong></p>
            <div style="height: 60px;"></div>
            <p>____________________________</p>
        </div>
    </div>
@endsection
