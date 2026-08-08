<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    /**
     * Crée les comptes par rôle + les paramètres globaux.
     *
     * Comptes par défaut :
     *   admin@immomanager.app / password     (Super Admin)
     *   gestionnaire@immomanager.app / password (Gestionnaire)
     *   comptable@immomanager.app / password  (Comptable)
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'admin@immomanager.app',
                'role' => User::ROLE_SUPER_ADMIN,
                'company_name' => 'ImmoManager',
            ],
            [
                'name' => 'Jean Gestion',
                'email' => 'gestionnaire@immomanager.app',
                'role' => User::ROLE_GESTIONNAIRE,
                'company_name' => 'Agence Horizon',
            ],
            [
                'name' => 'Marie Compta',
                'email' => 'comptable@immomanager.app',
                'role' => User::ROLE_COMPTABLE,
                'company_name' => 'Agence Horizon',
            ],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    'role' => $data['role'],
                    'company_name' => $data['company_name'],
                    'phone' => '+225 07 00 00 00 00',
                    'email_verified_at' => now(),
                    'is_active' => true,
                ]
            );
        }

        // Paramètres globaux par défaut
        foreach (Setting::DEFAULTS as $key => $value) {
            Setting::updateOrCreate(
                ['user_id' => null, 'key' => $key],
                ['value' => $value]
            );
        }
    }
}
