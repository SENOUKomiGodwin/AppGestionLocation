<?php

namespace Database\Factories;

use App\Models\Contract;
use App\Models\RentDue;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RentDue>
 */
class RentDueFactory extends Factory
{
    public function definition(): array
    {
        $contract = Contract::factory()->create();

        return [
            'contract_id' => $contract->id,
            'unit_id' => $contract->unit_id,
            'tenant_id' => $contract->tenant_id,
            'period' => now()->format('Y-m'),
            'due_date' => now()->startOfMonth()->addDays(4),
            'amount' => $contract->monthly_rent,
            'paid_amount' => 0,
            'status' => RentDue::STATUS_PENDING,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'paid_amount' => $attributes['amount'],
            'status' => RentDue::STATUS_PAID,
            'payment_date' => now()->subDays(random_int(0, 20)),
        ]);
    }

    public function partial(): static
    {
        return $this->state(fn (array $attributes) => [
            'paid_amount' => round($attributes['amount'] / 2, 2),
            'status' => RentDue::STATUS_PARTIAL,
        ]);
    }

    public function late(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RentDue::STATUS_LATE,
            'due_date' => now()->subMonth(),
        ]);
    }
}
