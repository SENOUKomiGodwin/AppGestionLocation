<?php

namespace Database\Factories;

use App\Models\House;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Unit>
 */
class UnitFactory extends Factory
{
    public function definition(): array
    {
        return [
            'house_id' => House::factory(),
            'number' => (string) fake()->unique()->numberBetween(1, 40),
            'type' => fake()->randomElement(['appartement', 'appartement', 'studio', 'maison', 'commercial']),
            'bedrooms' => fake()->numberBetween(0, 4),
            'surface' => fake()->numberBetween(20, 180),
            'rent_amount' => fake()->randomElement([150000, 180000, 220000, 250000, 300000, 350000]),
            'deposit' => fake()->randomElement([300000, 400000, 500000]),
            'status' => fake()->randomElement(['libre', 'occupe', 'occupe', 'renovation']),
        ];
    }
}
