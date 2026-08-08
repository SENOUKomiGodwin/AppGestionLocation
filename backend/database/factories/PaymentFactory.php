<?php

namespace Database\Factories;

use App\Models\RentDue;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        $due = RentDue::factory()->create();

        return [
            'rent_due_id' => $due->id,
            'contract_id' => $due->contract_id,
            'tenant_id' => $due->tenant_id,
            'amount' => $due->amount,
            'method' => fake()->randomElement(['especes', 'virement', 'carte', 'cheque']),
            'reference' => fake()->bothify('REF-####-????'),
            'payment_date' => now()->subDays(random_int(0, 20)),
            'notes' => null,
            'receipt_path' => null,
            'recorded_by' => null,
        ];
    }
}
