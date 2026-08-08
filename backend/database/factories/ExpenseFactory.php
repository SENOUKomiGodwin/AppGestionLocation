<?php

namespace Database\Factories;

use App\Models\House;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Expense>
 */
class ExpenseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'house_id' => House::factory(),
            'category' => fake()->randomElement(['reparation', 'eau', 'electricite', 'entretien', 'securite']),
            'amount' => fake()->randomElement([15000, 25000, 40000, 75000, 120000]),
            'description' => fake()->sentence(6),
            'expense_date' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'receipt_path' => null,
        ];
    }
}
