<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #1f2937; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .sub { color: #6b7280; font-size: 11px; margin-bottom: 20px; }
        .cards { width: 100%; margin-bottom: 20px; }
        .card {
            width: 23%; float: left; margin-right: 2%;
            border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;
            text-align: center;
        }
        .card .v { font-size: 18px; font-weight: 700; color: #111827; }
        .card .l { font-size: 10px; color: #6b7280; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; font-size: 11px; }
        th { background: #f9fafb; }
        .pos { color: #059669; font-weight: 600; }
        .neg { color: #dc2626; font-weight: 600; }
        .section { font-size: 13px; font-weight: 700; margin: 16px 0 8px; color: #374151; }
    </style>
</head>
<body>
    <h1>{{ $settings['company_name'] ?? 'ImmoManager' }} — Rapport analytique</h1>
    <p class="sub">Période : {{ $analytics['period']['from'] }} → {{ $analytics['period']['to'] }}
        · Généré le {{ now()->format('d/m/Y H:i') }}</p>

    <div class="cards">
        <div class="card"><div class="v">{{ number_format($analytics['revenues'], 0, ',', ' ') }} {{ $settings['currency'] ?? 'FCFA' }}</div><div class="l">Revenus</div></div>
        <div class="card"><div class="v">{{ number_format($analytics['expenses'], 0, ',', ' ') }} {{ $settings['currency'] ?? 'FCFA' }}</div><div class="l">Dépenses</div></div>
        <div class="card"><div class="v {{ $analytics['profits'] >= 0 ? 'pos' : 'neg' }}">{{ number_format($analytics['profits'], 0, ',', ' ') }} {{ $settings['currency'] ?? 'FCFA' }}</div><div class="l">Bénéfices</div></div>
        <div class="card"><div class="v">{{ $analytics['occupancy_rate'] }} %</div><div class="l">Taux d'occupation</div></div>
    </div>

    <div style="clear: both;"></div>

    <div class="section">Revenus / Dépenses / Bénéfices par mois</div>
    <table>
        <thead>
            <tr><th>Mois</th><th>Revenus</th><th>Dépenses</th><th>Bénéfices</th></tr>
        </thead>
        <tbody>
            @foreach($analytics['monthly_profits'] as $row)
                <tr>
                    <td>{{ $row['label'] }}</td>
                    <td>{{ number_format($row['revenue'], 0, ',', ' ') }}</td>
                    <td>{{ number_format($row['expense'], 0, ',', ' ') }}</td>
                    <td class="{{ $row['profit'] >= 0 ? 'pos' : 'neg' }}">{{ number_format($row['profit'], 0, ',', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="section">Dépenses par catégorie</div>
    <table>
        <thead><tr><th>Catégorie</th><th>Montant</th></tr></thead>
        <tbody>
            @forelse($analytics['expenses_by_category'] as $category => $total)
                <tr><td>{{ ucfirst($category) }}</td><td>{{ number_format($total, 0, ',', ' ') }}</td></tr>
            @empty
                <tr><td colspan="2">Aucune dépense sur la période.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section">Locataires en retard</div>
    <table>
        <thead><tr><th>Locataire</th><th>Total dû</th></tr></thead>
        <tbody>
            @forelse($analytics['late_tenants'] as $tenant)
                <tr><td>{{ $tenant['name'] }}</td><td>{{ number_format($tenant['total_due'], 0, ',', ' ') }}</td></tr>
            @empty
                <tr><td colspan="2">Aucun locataire en retard.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
