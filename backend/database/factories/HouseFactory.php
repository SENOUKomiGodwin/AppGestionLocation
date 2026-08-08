<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\House>
 */
class HouseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Villa Les Palmiers', 'Résidence Azur', 'Immeuble Saphir', 'Villa Bel Horizon', 'Résidence du Parc']),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'description' => fake()->sentence(10),
            'photo' => null,
            'number_of_units' => fake()->numberBetween(2, 10),
        ];
    }
}
