<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    /**
     * Enregistre une action dans le journal d'audit.
     *
     * @param  string  $action  created | updated | deleted | payment | login | ...
     * @param  Model|null  $model  modèle concerné (optionnel)
     * @param  array|null  $changes  données modifiées (optionnel)
     */
    public static function log(string $action, ?Model $model = null, ?array $changes = null, ?User $user = null): void
    {
        $user = $user ?? auth()->user();

        AuditLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model?->getKey(),
            'changes' => $changes,
            'ip_address' => request()->ip(),
        ]);
    }
}
