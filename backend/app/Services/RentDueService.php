<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\RentDue;
use Carbon\Carbon;

class RentDueService
{
    /**
     * Génère l'échéance d'un contrat pour un mois donné (si absente).
     */
    public function generateDueForContract(Contract $contract, Carbon $month): ?RentDue
    {
        // Échéance déjà existante pour cette période
        if ($contract->rentDues()->forPeriod($month->format('Y-m'))->exists()) {
            return null;
        }

        $billingDay = min(max((int) $contract->billing_day, 1), 28);

        return RentDue::create([
            'contract_id' => $contract->id,
            'unit_id' => $contract->unit_id,
            'tenant_id' => $contract->tenant_id,
            'period' => $month->format('Y-m'),
            'due_date' => $month->copy()->day($billingDay),
            'amount' => $contract->monthly_rent,
            'paid_amount' => 0,
            'status' => RentDue::STATUS_PENDING,
        ]);
    }

    /**
     * Génère les échéances manquantes pour tous les contrats actifs.
     * Par défaut : les 3 prochains mois + tous les mois passés manquants.
     *
     * @return int nombre d'échéances créées
     */
    public function generateMonthly(int $monthsAhead = 3): int
    {
        $created = 0;

        Contract::active()->each(function (Contract $contract) use ($monthsAhead, &$created) {
            // Mois de début du contrat (loyer dû à partir de ce mois)
            $start = Carbon::parse($contract->start_date)->startOfMonth();
            $end = Carbon::now()->startOfMonth()->addMonths($monthsAhead);

            // Rétroactif uniquement si le contrat est actif
            for ($month = $start; $month->lte($end); $month->addMonth()) {
                if ($this->generateDueForContract($contract, $month->copy())) {
                    $created++;
                }
            }
        });

        return $created;
    }

    /**
     * Met à jour le statut de toutes les échéances (retard, partiel, payé).
     */
    public function refreshStatuses(): int
    {
        $updated = 0;

        RentDue::where('status', '!=', RentDue::STATUS_PAID)->each(function (RentDue $due) use (&$updated) {
            $due->refreshStatus();
            $updated++;
        });

        return $updated;
    }

    /**
     * Génère + actualise les statuts en une passe.
     */
    public function run(int $monthsAhead = 3): array
    {
        return [
            'created' => $this->generateMonthly($monthsAhead),
            'refreshed' => $this->refreshStatuses(),
        ];
    }
}
