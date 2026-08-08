<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly StatsService $statsService)
    {
    }

    /**
     * Statistiques agrégées pour le tableau de bord.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'stats' => $this->statsService->dashboard($request->user()),
        ]);
    }
}
