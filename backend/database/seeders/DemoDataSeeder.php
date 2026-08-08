<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Expense;
use App\Models\House;
use App\Models\Payment;
use App\Models\RentDue;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\Unit;
use App\Models\User;
use App\Services\RentDueService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Génère un jeu de données réaliste : maisons, logements, locataires,
     * contrats actifs, échéances sur 12 mois, paiements et dépenses.
     */
    public function run(): void
    {
        $owner = User::where('email', 'gestionnaire@immomanager.app')->first() ?? User::factory()->gestionnaire()->create();
        $currency = Setting::get('currency', 'EUR');

        $houses = [
            [
                'name' => 'Résidence Azur',
                'address' => '12 Boulevard de la Corniche',
                'city' => 'Abidjan',
                'description' => 'Immeuble moderne de 8 logements avec vue sur mer.',
                'units' => [
                    ['number' => 'A1', 'type' => 'appartement', 'bedrooms' => 2, 'surface' => 75, 'rent_amount' => 250000, 'deposit' => 500000],
                    ['number' => 'A2', 'type' => 'appartement', 'bedrooms' => 2, 'surface' => 75, 'rent_amount' => 250000, 'deposit' => 500000],
                    ['number' => 'A3', 'type' => 'appartement', 'bedrooms' => 3, 'surface' => 95, 'rent_amount' => 300000, 'deposit' => 600000],
                    ['number' => 'B1', 'type' => 'studio', 'bedrooms' => 0, 'surface' => 35, 'rent_amount' => 150000, 'deposit' => 300000],
                    ['number' => 'B2', 'type' => 'studio', 'bedrooms' => 0, 'surface' => 38, 'rent_amount' => 160000, 'deposit' => 320000],
                    ['number' => 'C1', 'type' => 'appartement', 'bedrooms' => 4, 'surface' => 120, 'rent_amount' => 400000, 'deposit' => 800000],
                    ['number' => 'C2', 'type' => 'appartement', 'bedrooms' => 1, 'surface' => 55, 'rent_amount' => 200000, 'deposit' => 400000],
                ],
            ],
            [
                'name' => 'Villa Les Palmiers',
                'address' => '45 Rue des Jardins',
                'city' => 'Cocody',
                'description' => 'Villa familiale avec jardin et piscine.',
                'units' => [
                    ['number' => 'V1', 'type' => 'maison', 'bedrooms' => 4, 'surface' => 220, 'rent_amount' => 600000, 'deposit' => 1200000],
                    ['number' => 'D1', 'type' => 'bureau', 'bedrooms' => 0, 'surface' => 40, 'rent_amount' => 180000, 'deposit' => 360000],
                ],
            ],
            [
                'name' => 'Immeuble Saphir',
                'address' => '8 Avenue de la République',
                'city' => 'Plateau',
                'description' => 'Immeuble de bureaux et commerces en plein centre-ville.',
                'units' => [
                    ['number' => 'S1', 'type' => 'commercial', 'bedrooms' => 0, 'surface' => 60, 'rent_amount' => 350000, 'deposit' => 700000],
                    ['number' => 'S2', 'type' => 'bureau', 'bedrooms' => 0, 'surface' => 30, 'rent_amount' => 150000, 'deposit' => 300000],
                    ['number' => 'S3', 'type' => 'bureau', 'bedrooms' => 0, 'surface' => 45, 'rent_amount' => 220000, 'deposit' => 440000],
                ],
            ],
        ];

        $tenantsData = [
            ['first_name' => 'Koffi', 'last_name' => 'Konan', 'profession' => 'Ingénieur', 'nationality' => 'Ivoirienne'],
            ['first_name' => 'Aminata', 'last_name' => 'Traoré', 'profession' => 'Médecin', 'nationality' => 'Malienne'],
            ['first_name' => 'Marc', 'last_name' => 'Lefèvre', 'profession' => 'Consultant', 'nationality' => 'Française'],
            ['first_name' => 'Fatou', 'last_name' => 'Diop', 'profession' => 'Enseignante', 'nationality' => 'Sénégalaise'],
            ['first_name' => 'Jean', 'last_name' => 'Kouassi', 'profession' => 'Commerçant', 'nationality' => 'Ivoirienne'],
            ['first_name' => 'Grace', 'last_name' => 'N\'Guessan', 'profession' => 'Architecte', 'nationality' => 'Ivoirienne'],
            ['first_name' => 'Sofia', 'last_name' => 'Benali', 'profession' => 'Avocate', 'nationality' => 'Marocaine'],
            ['first_name' => 'Emmanuel', 'last_name' => 'Okafor', 'profession' => 'Ingénieur', 'nationality' => 'Nigériane'],
            ['first_name' => 'Awa', 'last_name' => 'Cissé', 'profession' => 'Comptable', 'nationality' => 'Ivoirienne'],
            ['first_name' => 'David', 'last_name' => 'Mensah', 'profession' => 'Entrepreneur', 'nationality' => 'Ghanéenne'],
            ['first_name' => 'Clarisse', 'last_name' => 'Yao', 'profession' => 'Infirmière', 'nationality' => 'Ivoirienne'],
            ['first_name' => 'Ibrahim', 'last_name' => 'Diallo', 'profession' => 'Étudiant', 'nationality' => 'Guinéenne'],
        ];

        $tenants = [];
        foreach ($tenantsData as $data) {
            $tenants[] = Tenant::factory()->create(array_merge($data, ['user_id' => $owner->id]));
        }

        $dueService = new RentDueService();
        $tenantIndex = 0;

        foreach ($houses as $houseData) {
            $house = House::create([
                'user_id' => $owner->id,
                'name' => $houseData['name'],
                'address' => $houseData['address'],
                'city' => $houseData['city'],
                'description' => $houseData['description'],
                'number_of_units' => count($houseData['units']),
            ]);

            foreach ($houseData['units'] as $i => $unitData) {
                $unit = Unit::create(array_merge($unitData, ['house_id' => $house->id]));

                // 80% des logements sont occupés
                if ($tenantIndex < count($tenants) && fake()->boolean(80)) {
                    $tenant = $tenants[$tenantIndex++];
                    $start = Carbon::now()->startOfMonth()->subMonths(fake()->numberBetween(1, 20));

                    $contract = Contract::create([
                        'tenant_id' => $tenant->id,
                        'unit_id' => $unit->id,
                        'start_date' => $start->format('Y-m-d'),
                        'end_date' => $start->copy()->addMonths(12)->format('Y-m-d'),
                        'duration_months' => 12,
                        'monthly_rent' => $unitData['rent_amount'],
                        'deposit' => $unitData['deposit'],
                        'billing_day' => $unitData['number'][0] === 'A' ? 1 : 5,
                        'status' => Contract::STATUS_ACTIVE,
                    ]);

                    $unit->update(['status' => Unit::STATUS_OCCUPE]);

                    // Échéances depuis le début du contrat
                    for ($month = $start; $month->lte(Carbon::now()->startOfMonth()); $month->addMonth()) {
                        $due = $dueService->generateDueForContract($contract, $month->copy());
                        if ($due === null) {
                            continue;
                        }

                        // Règle de paiement réaliste : ~85% payé à temps, 8% partiel, 7% en retard
                        $roll = fake()->numberBetween(1, 100);
                        if ($month->lt(Carbon::now()->startOfMonth()) || $roll <= 75) {
                            if ($roll <= 85) {
                                $payment = Payment::create([
                                    'rent_due_id' => $due->id,
                                    'contract_id' => $contract->id,
                                    'tenant_id' => $tenant->id,
                                    'amount' => $due->amount,
                                    'method' => fake()->randomElement(['virement', 'especes', 'virement', 'cheque']),
                                    'reference' => strtoupper(fake()->bothify('PAY-####')),
                                    'payment_date' => $due->due_date->copy()->addDays(fake()->numberBetween(-2, 5)),
                                    'recorded_by' => $owner->id,
                                ]);
                                $due->update([
                                    'paid_amount' => $due->amount,
                                    'status' => RentDue::STATUS_PAID,
                                    'payment_date' => $payment->payment_date,
                                ]);
                            } elseif ($roll <= 93) {
                                $payment = Payment::create([
                                    'rent_due_id' => $due->id,
                                    'contract_id' => $contract->id,
                                    'tenant_id' => $tenant->id,
                                    'amount' => round($due->amount / 2, 2),
                                    'method' => 'especes',
                                    'payment_date' => $due->due_date->copy()->addDays(3),
                                    'recorded_by' => $owner->id,
                                ]);
                                $due->update([
                                    'paid_amount' => $payment->amount,
                                    'status' => RentDue::STATUS_PARTIAL,
                                    'payment_date' => $payment->payment_date,
                                ]);
                            } else {
                                $due->update(['status' => RentDue::STATUS_LATE]);
                            }
                        }
                    }
                } elseif (fake()->boolean(30)) {
                    $unit->update(['status' => Unit::STATUS_RENOVATION]);
                }
            }
        }

        // Quelques locataires supplémentaires sans logement (en attente)
        for ($i = 0; $i < 3; $i++) {
            Tenant::factory()->create(['user_id' => $owner->id, 'is_active' => true]);
        }

        // Dépenses sur 12 mois
        $categories = ['reparation', 'eau', 'electricite', 'entretien', 'securite'];
        $houses = House::where('user_id', $owner->id)->get();

        for ($i = 11; $i >= 0; $i--) {
            $month = Carbon::now()->startOfMonth()->subMonths($i);

            foreach ($houses as $house) {
                foreach (fake()->randomElements($categories, fake()->numberBetween(1, 3)) as $category) {
                    Expense::create([
                        'user_id' => $owner->id,
                        'house_id' => $house->id,
                        'category' => $category,
                        'amount' => fake()->randomElement([15000, 25000, 40000, 60000, 90000, 150000]),
                        'description' => ucfirst(fake()->words(4, true)).'.',
                        'expense_date' => $month->copy()->addDays(fake()->numberBetween(0, 25))->format('Y-m-d'),
                    ]);
                }
            }
        }

        $this->command?->info('✅ Données de démonstration créées.');
    }
}
