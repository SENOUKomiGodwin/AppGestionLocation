<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use App\Services\RentDueService;
use Illuminate\Console\Command;

class GenerateRentDues extends Command
{
    protected $signature = 'rents:generate
        {--months-ahead=3 : Nombre de mois à générer en avance}
        {--notify : Envoie les rappels d\'échéance aux propriétaires}';

    protected $description = 'Génère les échéances de loyer manquantes et actualise les statuts';

    public function handle(RentDueService $service): int
    {
        $this->info('Génération des échéances de loyer...');

        $result = $service->run((int) $this->option('months-ahead'));

        $this->info("  ✓ {$result['created']} échéance(s) créée(s)");
        $this->info("  ✓ {$result['refreshed']} statut(s) actualisé(s)");

        if ($this->option('notify')) {
            $this->info('Envoi des rappels...');
            // Rappel des échéances à venir (3 prochains jours) et des retards
            \App\Models\RentDue::query()
                ->whereBetween('due_date', [now()->startOfDay(), now()->addDays(3)->endOfDay()])
                ->where('status', '!=', \App\Models\RentDue::STATUS_PAID)
                ->get()
                ->each(fn ($due) => NotificationService::remindDue($due));

            \App\Models\RentDue::query()
                ->where('status', \App\Models\RentDue::STATUS_LATE)
                ->get()
                ->each(fn ($due) => NotificationService::notifyLate($due));
        }

        $this->info('Terminé ✅');

        return self::SUCCESS;
    }
}
