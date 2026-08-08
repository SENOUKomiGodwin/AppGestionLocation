<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #1f2937;
            line-height: 1.5;
            margin: 0;
        }
        .header {
            border-bottom: 3px solid #6366f1;
            padding-bottom: 16px;
            margin-bottom: 24px;
            overflow: hidden;
        }
        .header .brand {
            float: left;
        }
        .header .brand h1 {
            margin: 0;
            font-size: 22px;
            color: #111827;
        }
        .header .brand p {
            margin: 2px 0 0;
            color: #6b7280;
            font-size: 11px;
        }
        .header .meta {
            float: right;
            text-align: right;
            font-size: 11px;
            color: #6b7280;
        }
        h2 {
            font-size: 18px;
            color: #111827;
            margin: 0 0 16px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .table th, .table td {
            border: 1px solid #e5e7eb;
            padding: 8px 10px;
            text-align: left;
            font-size: 12px;
        }
        .table th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .info-block {
            width: 48%;
            float: left;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 14px;
            margin-bottom: 20px;
        }
        .info-block.right { float: right; }
        .info-block h3 {
            margin: 0 0 8px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6366f1;
        }
        .info-block p { margin: 2px 0; font-size: 11px; color: #374151; }
        .amount { color: #111827; font-weight: 700; }
        .total-box {
            background: #eef2ff;
            border-radius: 8px;
            padding: 14px 18px;
            text-align: right;
            margin-top: 10px;
            overflow: hidden;
        }
        .total-box .label { font-size: 12px; color: #4f46e5; }
        .total-box .value { font-size: 22px; font-weight: 700; color: #4338ca; }
        .footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            right: 0;
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
        }
        .qr {
            float: right;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
        }
        .qr img { width: 110px; height: 110px; }
        .clearfix { clear: both; }
        .muted { color: #6b7280; }
        .badge-active { color: #059669; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">
            <h1>{{ $settings['company_name'] ?? 'ImmoManager' }}</h1>
            @if(!empty($settings['company_address']))
                <p>{{ $settings['company_address'] }}</p>
            @endif
            @if(!empty($settings['company_phone']))
                <p>Tél : {{ $settings['company_phone'] }}</p>
            @endif
            @if(!empty($settings['company_email']))
                <p>{{ $settings['company_email'] }}</p>
            @endif
        </div>
        <div class="meta">
            <p><strong>ImmoManager</strong> — Gestion locative</p>
            <p>{{ now()->format('d/m/Y') }}</p>
        </div>
    </div>

    @yield('content')

    <div class="footer">
        Document généré par ImmoManager — {{ $settings['company_name'] ?? '' }}
    </div>
</body>
</html>
