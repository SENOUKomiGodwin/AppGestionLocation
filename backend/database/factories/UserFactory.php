<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password = null;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => User::ROLE_GESTIONNAIRE,
            'phone' => fake()->phoneNumber(),
            'company_name' => fake()->company(),
            'locale' => 'fr',
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => User::ROLE_SUPER_ADMIN,
            'name' => 'Super Admin',
            'email' => 'admin@immomanager.app',
        ]);
    }

    public function gestionnaire(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => User::ROLE_GESTIONNAIRE,
        ]);
    }

    public function comptable(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => User::ROLE_COMPTABLE,
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
