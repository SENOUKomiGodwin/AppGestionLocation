<?php

namespace Database\Factories;

use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Contract>
 */
class ContractFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-2 years', '-1 month');

        return [
            'tenant_id' => Tenant::factory(),
            'unit_id' => Unit::factory(),
            'start_date' => $start->format('Y-m-d'),
            'end_date' => (clone $start)->modify('+12 months')->format('Y-m-d'),
            'duration_months' => 12,
            'monthly_rent' => fake()->randomElement([150000, 180000, 220000, 250000, 300000]),
            'deposit' => fake()->randomElement([300000, 400000, 500000]),
            'billing_day' => fake()->numberBetween(1, 10),
            'status' => 'active',
            'pdf_path' => null,
            'renewal_of_id' => null,
        ];
    }
}
