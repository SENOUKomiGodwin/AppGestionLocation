<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    /** @use HasFactory<\Database\Factories\SettingFactory> */
    use HasFactory;

    protected $fillable = ['user_id', 'key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    public const DEFAULTS = [
        'company_name' => 'ImmoManager',
        'company_address' => '',
        'company_phone' => '',
        'company_email' => '',
        'logo' => null,
        'currency' => 'EUR',
        'language' => 'fr',
        'payment_due_reminder_days' => 3,
        'late_payment_reminder_days' => 5,
    ];

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    /**
     * Récupère la valeur d'un paramètre (d'abord celui du propriétaire,
     * puis le global, puis la valeur par défaut).
     */
    public static function get(string $key, $default = null, ?User $user = null)
    {
        $user = $user ?? auth()->user();

        if ($user !== null) {
            $ownerSetting = self::query()
                ->where('user_id', $user->id)
                ->where('key', $key)
                ->value('value');

            if ($ownerSetting !== null) {
                return $ownerSetting;
            }
        }

        $global = self::query()
            ->whereNull('user_id')
            ->where('key', $key)
            ->value('value');

        return $global ?? $default ?? self::DEFAULTS[$key] ?? null;
    }

    /**
     * Enregistre une valeur (propriétaire si connecté, sinon global).
     */
    public static function set(string $key, $value, ?User $user = null): void
    {
        $user = $user ?? auth()->user();

        self::query()->updateOrCreate(
            ['user_id' => $user?->id, 'key' => $key],
            ['value' => $value]
        );
    }

    /** Ensemble complet des paramètres pour un utilisateur. */
    public static function allFor(?User $user = null): array
    {
        $result = self::DEFAULTS;

        foreach (self::query()->whereNull('user_id')->get() as $setting) {
            $result[$setting->key] = $setting->value;
        }

        if ($user !== null) {
            foreach (self::query()->where('user_id', $user->id)->get() as $setting) {
                $result[$setting->key] = $setting->value;
            }
        }

        return $result;
    }
}
