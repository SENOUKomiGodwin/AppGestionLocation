<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StatsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function __construct(private readonly StatsService $statsService)
    {
    }

    /**
     * Statistiques complètes (revenus, dépenses, bénéfices, occupation, retards).
     */
    public function index(Request $request): JsonResponse
    {
        $months = (int) $request->integer('months', 12);

        return response()->json([
            'analytics' => $this->statsService->analytics($request->user(), $months),
        ]);
    }

    /**
     * Export PDF des statistiques.
     */
    public function exportPdf(Request $request)
    {
        $months = (int) $request->integer('months', 12);
        $data = $this->statsService->analytics($request->user(), $months);

        $pdf = Pdf::loadView('pdf.analytics', [
            'analytics' => $data,
            'settings' => \App\Models\Setting::allFor($request->user()),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('rapport-analytics-'.now()->format('Y-m-d').'.pdf');
    }

    /**
     * Export Excel (CSV compatible Excel avec BOM UTF-8).
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $months = (int) $request->integer('months', 12);
        $data = $this->statsService->analytics($request->user(), $months);

        $filename = 'rapport-analytics-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');

            // BOM UTF-8 pour Excel
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, ['ImmoManager — Rapport analytique']);
            fputcsv($out, ['Période', $data['period']['from'], '→', $data['period']['to']]);
            fputcsv($out, []);

            fputcsv($out, ['Indicateur', 'Valeur']);
            fputcsv($out, ['Revenus encaissés', $data['revenues']]);
            fputcsv($out, ['Dépenses', $data['expenses']]);
            fputcsv($out, ['Bénéfices', $data['profits']]);
            fputcsv($out, ['Taux de recouvrement (%)', $data['collection_rate']]);
            fputcsv($out, ['Taux d\'occupation (%)', $data['occupancy_rate']]);
            fputcsv($out, ['Logements occupés', $data['occupied_units']]);
            fputcsv($out, ['Logements totaux', $data['total_units']]);
            fputcsv($out, []);

            fputcsv($out, ['Mois', 'Revenus', 'Dépenses', 'Bénéfices']);
            foreach ($data['monthly_profits'] as $row) {
                fputcsv($out, [$row['label'], $row['revenue'], $row['expense'], $row['profit']]);
            }

            fputcsv($out, []);
            fputcsv($out, ['Locataires en retard']);
            fputcsv($out, ['Nom', 'Total dû']);
            foreach ($data['late_tenants'] as $tenant) {
                fputcsv($out, [$tenant['name'], $tenant['total_due']]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
