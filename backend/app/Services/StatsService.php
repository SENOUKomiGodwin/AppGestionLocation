<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\House;
use App\Models\RentDue;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatsService
{
    /** Les super-admins voient tout ; les autres voient leurs données. */
    private function housesQuery(?User $user)
    {
        return House::query()->ownedBy($user);
    }

    /**
     * Statistiques du tableau de bord.
     */
    public function dashboard(?User $user): array
    {
        $user = $user ?? auth()->user();
        $now = Carbon::now();

        $houseIds = $this->housesQuery($user)->pluck('id');

        $unitQuery = Unit::query();
        if ($user !== null && ! $user->seesAllData()) {
            $unitQuery->whereIn('house_id', $houseIds);
        }

        $tenantIds = Tenant::query()->ownedBy($user)->pluck('id');

        $dueQuery = RentDue::query();
        if ($user !== null && ! $user->seesAllData()) {
            $dueQuery->whereIn('tenant_id', $tenantIds);
        }

        $monthStart = $now->copy()->startOfMonth();
        $yearStart = $now->copy()->startOfYear();

        $monthlyCollected = (clone $dueQuery)->where('payment_date', '>=', $monthStart)->sum('paid_amount');
        $annualCollected = (clone $dueQuery)->where('payment_date', '>=', $yearStart)->sum('paid_amount');

        // Taux d'occupation
        $totalUnits = (clone $unitQuery)->count();
        $occupiedUnits = (clone $unitQuery)->where('status', Unit::STATUS_OCCUPE)->count();

        return [
            'houses' => $houseIds->count(),
            'units' => $totalUnits,
            'tenants' => $tenantIds->count(),
            'collected_rents' => round((clone $dueQuery)->sum('paid_amount'), 2),
            'unpaid_rents' => round((clone $dueQuery)->unpaid()->sum(DB::raw('amount - paid_amount')), 2),
            'monthly_revenue' => round($monthlyCollected, 2),
            'annual_revenue' => round($annualCollected, 2),
            'free_units' => (clone $unitQuery)->where('status', Unit::STATUS_LIBRE)->count(),
            'occupied_units' => $occupiedUnits,
            'occupancy_rate' => $totalUnits > 0 ? round(($occupiedUnits / $totalUnits) * 100, 1) : 0,
            'late_dues' => (clone $dueQuery)->late()->count(),
            'pending_dues' => (clone $dueQuery)->where('status', RentDue::STATUS_PENDING)->count(),
            'monthly_revenue_series' => $this->monthlyRevenueSeries($dueQuery, 12),
            'payments_by_month' => $this->paymentsByMonth($dueQuery, 12),
        ];
    }

    /**
     * Revenus encaissés par mois (12 derniers mois) pour le graphique.
     */
    protected function monthlyRevenueSeries($dueQuery, int $months): array
    {
        $series = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $month = Carbon::now()->startOfMonth()->subMonths($i);
            $series[] = [
                'period' => $month->format('Y-m'),
                'label' => $month->translatedFormat('M Y'),
                'total' => round((clone $dueQuery)
                    ->where('payment_date', '>=', $month->copy())
                    ->where('payment_date', '<', $month->copy()->addMonth())
                    ->sum('paid_amount'), 2),
            ];
        }

        return $series;
    }

    /**
     * Montants dus par mois pour le graphique des paiements.
     */
    protected function paymentsByMonth($dueQuery, int $months): array
    {
        $series = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $month = Carbon::now()->startOfMonth()->subMonths($i);
            $series[] = [
                'period' => $month->format('Y-m'),
                'label' => $month->translatedFormat('M Y'),
                'expected' => round((clone $dueQuery)->where('period', $month->format('Y-m'))->sum('amount'), 2),
                'paid' => round((clone $dueQuery)->where('period', $month->format('Y-m'))->sum('paid_amount'), 2),
            ];
        }

        return $series;
    }

    /**
     * Statistiques complètes de la page Analytics.
     */
    public function analytics(?User $user, int $months = 12): array
    {
        $user = $user ?? auth()->user();
        $now = Carbon::now();
        $start = $now->copy()->startOfMonth()->subMonths($months - 1);

        $tenantIds = Tenant::query()->ownedBy($user)->pluck('id');
        $houseIds = $this->housesQuery($user)->pluck('id');

        $dueQuery = RentDue::query();
        $expenseQuery = Expense::query();

        if ($user !== null && ! $user->seesAllData()) {
            $dueQuery->whereIn('tenant_id', $tenantIds);
            $expenseQuery->whereIn('house_id', $houseIds);
        }

        $revenues = round((clone $dueQuery)->where('payment_date', '>=', $start)->sum('paid_amount'), 2);
        $expected = round((clone $dueQuery)->where('period', '>=', $start->format('Y-m'))->sum('amount'), 2);
        $expenses = round((clone $expenseQuery)->where('expense_date', '>=', $start)->sum('amount'), 2);

        // Répartition des dépenses par catégorie
        $expensesByCategory = (clone $expenseQuery)
            ->where('expense_date', '>=', $start)
            ->select('category', DB::raw('SUM(amount) as total'))
            ->groupBy('category')
            ->pluck('total', 'category')
            ->map(fn ($total) => round((float) $total, 2))
            ->toArray();

        $totalUnits = Unit::query()
            ->when($user !== null && ! $user->seesAllData(), fn ($q) => $q->whereIn('house_id', $houseIds))
            ->count();

        $occupiedUnits = Unit::query()
            ->where('status', Unit::STATUS_OCCUPE)
            ->when($user !== null && ! $user->seesAllData(), fn ($q) => $q->whereIn('house_id', $houseIds))
            ->count();

        // Locataires en retard (échéances en retard non soldées)
        $lateTenants = Tenant::query()
            ->ownedBy($user)
            ->whereHas('rentDues', fn ($q) => $q->late()->where('paid_amount', '<', DB::raw('amount')))
            ->with(['rentDues' => fn ($q) => $q->late()->orderBy('due_date')])
            ->get()
            ->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->full_name,
                'photo' => $tenant->photo,
                'phone' => $tenant->phone,
                'email' => $tenant->email,
                'total_due' => round($tenant->rentDues->sum(fn ($d) => $d->balance), 2),
                'dues' => $tenant->rentDues->map(fn ($d) => [
                    'period' => $d->period,
                    'due_date' => $d->due_date->format('Y-m-d'),
                    'balance' => round($d->balance, 2),
                ])->values(),
            ])
            ->values()
            ->toArray();

        return [
            'period' => [
                'from' => $start->format('Y-m-d'),
                'to' => $now->format('Y-m-d'),
                'months' => $months,
            ],
            'revenues' => $revenues,
            'expenses' => $expenses,
            'profits' => round($revenues - $expenses, 2),
            'expected_revenues' => $expected,
            'collection_rate' => $expected > 0 ? round(($revenues / $expected) * 100, 1) : 0,
            'occupancy_rate' => $totalUnits > 0 ? round(($occupiedUnits / $totalUnits) * 100, 1) : 0,
            'occupied_units' => $occupiedUnits,
            'total_units' => $totalUnits,
            'expenses_by_category' => $expensesByCategory,
            'late_tenants' => $lateTenants,
            'revenue_series' => $this->monthlyRevenueSeries($dueQuery, $months),
            'expense_series' => $this->monthlyExpenseSeries($expenseQuery, $months, $start),
            'monthly_profits' => $this->monthlyProfits($dueQuery, $expenseQuery, $months, $start),
        ];
    }

    protected function monthlyExpenseSeries($expenseQuery, int $months, Carbon $start): array
    {
        $series = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $month = $start->copy()->addMonths($i);
            $series[] = [
                'period' => $month->format('Y-m'),
                'label' => $month->translatedFormat('M Y'),
                'total' => round((clone $expenseQuery)
                    ->where('expense_date', '>=', $month->copy())
                    ->where('expense_date', '<', $month->copy()->addMonth())
                    ->sum('amount'), 2),
            ];
        }

        return $series;
    }

    protected function monthlyProfits($dueQuery, $expenseQuery, int $months, Carbon $start): array
    {
        $revenues = $this->monthlyRevenueSeries($dueQuery, $months);
        $expenses = $this->monthlyExpenseSeries($expenseQuery, $months, $start);

        return collect($revenues)->map(function ($rev, $i) use ($expenses) {
            return [
                'period' => $rev['period'],
                'label' => $rev['label'],
                'revenue' => $rev['total'],
                'expense' => $expenses[$i]['total'],
                'profit' => round($rev['total'] - $expenses[$i]['total'], 2),
            ];
        })->values()->toArray();
    }
}
