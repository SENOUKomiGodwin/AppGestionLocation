<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Planificateur (cron)
|--------------------------------------------------------------------------
|
| Génération quotidienne des échéances manquantes + mise à jour des statuts.
| Ajoutez la ligne suivante au cron de votre serveur :
|
|   * * * * * cd /chemin/vers/backend && php artisan schedule:run >> /dev/null 2>&1
|
*/

Schedule::command('rents:generate --months-ahead=3')
    ->dailyAt('02:00')
    ->withoutOverlapping();

// Rappels d'échéance tous les matins
Schedule::command('rents:generate --notify --months-ahead=0')
    ->dailyAt('08:00')
    ->withoutOverlapping();
