<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\RentDue;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_expected_structure(): void
    {
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)
            ->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'stats' => [
                    'houses', 'units', 'tenants', 'collected_rents', 'unpaid_rents',
                    'monthly_revenue', 'annual_revenue', 'free_units', 'occupied_units',
                    'occupancy_rate', 'late_dues', 'pending_dues',
                    'monthly_revenue_series', 'payments_by_month',
                ],
            ]);
    }

    public function test_analytics_returns_profits_and_occupancy(): void
    {
        $user = User::factory()->gestionnaire()->create();
        $tenant = Tenant::factory()->create(['user_id' => $user->id]);
        $unit = Unit::factory()->create([
            'house_id' => $user->houses()->create([
                'name' => 'Test', 'address' => '1 Rue', 'user_id' => $user->id,
            ])->id,
        ]);

        Contract::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'start_date' => now()->subMonths(2)->toDateString(),
            'end_date' => now()->addMonths(10)->toDateString(),
            'duration_months' => 12,
            'monthly_rent' => 200000,
            'deposit' => 400000,
            'status' => Contract::STATUS_ACTIVE,
        ]);

        $this->actingAs($user)
            ->getJson('/api/analytics?months=3')
            ->assertOk()
            ->assertJsonStructure([
                'analytics' => [
                    'revenues', 'expenses', 'profits', 'occupancy_rate',
                    'late_tenants', 'monthly_profits',
                ],
            ]);
    }

    public function test_analytics_excel_export(): void
    {
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)
            ->getJson('/api/analytics/export/excel')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}
