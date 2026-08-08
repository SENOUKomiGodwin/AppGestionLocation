<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Payment;
use App\Models\RentDue;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    private function makeDue(float $amount = 250000): RentDue
    {
        $user = User::factory()->gestionnaire()->create();
        $tenant = Tenant::factory()->create(['user_id' => $user->id]);
        $unit = Unit::factory()->create(['house_id' => $user->houses()->create([
            'name' => 'Test', 'address' => '1 Rue', 'user_id' => $user->id,
        ])->id]);
        $contract = Contract::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $unit->id,
            'start_date' => now()->subMonths(2)->toDateString(),
            'end_date' => now()->addMonths(10)->toDateString(),
            'duration_months' => 12,
            'monthly_rent' => $amount,
            'deposit' => $amount * 2,
            'status' => Contract::STATUS_ACTIVE,
        ]);

        return RentDue::create([
            'contract_id' => $contract->id,
            'unit_id' => $unit->id,
            'tenant_id' => $tenant->id,
            'period' => now()->format('Y-m'),
            'due_date' => now()->startOfMonth()->addDays(5),
            'amount' => $amount,
            'paid_amount' => 0,
            'status' => RentDue::STATUS_PENDING,
        ]);
    }

    public function test_partial_payment_updates_due_status(): void
    {
        $due = $this->makeDue();
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)->postJson('/api/payments', [
            'rent_due_id' => $due->id,
            'amount' => 100000,
            'method' => 'especes',
        ])->assertStatus(201)
            ->assertJsonPath('due.status', RentDue::STATUS_PARTIAL);

        $this->assertDatabaseHas('rent_dues', [
            'id' => $due->id,
            'paid_amount' => 100000,
            'status' => RentDue::STATUS_PARTIAL,
        ]);
    }

    public function test_full_payment_marks_due_as_paid(): void
    {
        $due = $this->makeDue();
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)->postJson('/api/payments', [
            'rent_due_id' => $due->id,
            'amount' => $due->amount,
            'method' => 'virement',
            'reference' => 'REF-001',
        ])->assertStatus(201)
            ->assertJsonPath('due.status', RentDue::STATUS_PAID);

        $this->assertDatabaseHas('payments', [
            'rent_due_id' => $due->id,
            'amount' => $due->amount,
            'reference' => 'REF-001',
        ]);
    }

    public function test_overpayment_is_rejected(): void
    {
        $due = $this->makeDue();
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)->postJson('/api/payments', [
            'rent_due_id' => $due->id,
            'amount' => $due->amount + 1000,
            'method' => 'especes',
        ])->assertStatus(422);
    }

    public function test_comptable_can_record_payment(): void
    {
        $due = $this->makeDue();
        $comptable = User::factory()->comptable()->create();

        $this->actingAs($comptable)->postJson('/api/payments', [
            'rent_due_id' => $due->id,
            'amount' => $due->amount,
            'method' => 'cheque',
        ])->assertStatus(201);
    }

    public function test_payment_requires_valid_method(): void
    {
        $due = $this->makeDue();
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)->postJson('/api/payments', [
            'rent_due_id' => $due->id,
            'amount' => 50000,
            'method' => 'bitcoin',
        ])->assertStatus(422);
    }

    public function test_payment_creates_receipt_pdf(): void
    {
        $due = $this->makeDue();
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)->postJson('/api/payments', [
            'rent_due_id' => $due->id,
            'amount' => $due->amount,
            'method' => 'virement',
        ])->assertStatus(201);

        $payment = Payment::first();
        $this->assertNotNull($payment);
        $this->assertNotNull($payment->receipt_path);
        $this->assertStringContainsString('recu-', $payment->receipt_path);
    }
}
