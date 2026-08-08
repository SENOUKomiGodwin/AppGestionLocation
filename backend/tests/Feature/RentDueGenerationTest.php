<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\RentDue;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Services\RentDueService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentDueGenerationTest extends TestCase
{
    use RefreshDatabase;

    private function makeActiveContract(): Contract
    {
        $user = User::factory()->gestionnaire()->create();
        $tenant = Tenant::factory()->create(['user_id' => $user->id]);
        $unit = Unit::factory()->create([
            'house_id' => $user->houses()->create([
                'name' => 'Test', 'address' => '1 Rue', 'user_id' => $user->id,
            ])->id,
        ]);

        return Contract::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'start_date' => now()->startOfMonth()->subMonths(2)->toDateString(),
            'end_date' => now()->startOfMonth()->addMonths(10)->toDateString(),
            'duration_months' => 12,
            'monthly_rent' => 200000,
            'deposit' => 400000,
            'status' => Contract::STATUS_ACTIVE,
        ]);
    }

    public function test_service_generates_dues_for_contract(): void
    {
        $contract = $this->makeActiveContract();
        $service = new RentDueService();

        $due = $service->generateDueForContract($contract, Carbon::now()->startOfMonth());

        $this->assertNotNull($due);
        $this->assertEquals($contract->monthly_rent, $due->amount);
        $this->assertEquals($contract->tenant_id, $due->tenant_id);
    }

    public function test_service_does_not_duplicate_dues(): void
    {
        $contract = $this->makeActiveContract();
        $service = new RentDueService();
        $month = Carbon::now()->startOfMonth();

        $service->generateDueForContract($contract, $month);
        $duplicate = $service->generateDueForContract($contract, $month);

        $this->assertNull($duplicate);
        $this->assertCount(1, $contract->rentDues);
    }

    public function test_late_due_status_is_refreshed(): void
    {
        $contract = $this->makeActiveContract();
        $due = RentDue::create([
            'contract_id' => $contract->id,
            'unit_id' => $contract->unit_id,
            'tenant_id' => $contract->tenant_id,
            'period' => now()->subMonth()->format('Y-m'),
            'due_date' => now()->subMonth()->startOfMonth()->addDays(5),
            'amount' => $contract->monthly_rent,
            'paid_amount' => 0,
            'status' => RentDue::STATUS_PENDING,
        ]);

        $due->refreshStatus();

        $this->assertEquals(RentDue::STATUS_LATE, $due->fresh()->status);
    }

    public function test_generate_endpoint_returns_counts(): void
    {
        $this->makeActiveContract();
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)
            ->postJson('/api/rent-dues/generate')
            ->assertOk()
            ->assertJsonStructure(['created', 'refreshed']);
    }
}
