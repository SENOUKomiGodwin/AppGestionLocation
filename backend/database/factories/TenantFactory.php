<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tenant>
 */
class TenantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'photo' => null,
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'profession' => fake()->randomElement(['Ingénieur', 'Enseignant', 'Commerçant', 'Médecin', 'Consultant', 'Fonctionnaire']),
            'birth_date' => fake()->dateTimeBetween('-60 years', '-20 years')->format('Y-m-d'),
            'nationality' => fake()->randomElement(['Ivoirienne', 'Française', 'Sénégalaise', 'Camerounaise', 'Marocaine']),
            'id_number' => fake()->numerify('######-#######-##'),
            'id_photo' => null,
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => fake()->phoneNumber(),
            'notes' => null,
            'is_active' => true,
        ];
    }
}
