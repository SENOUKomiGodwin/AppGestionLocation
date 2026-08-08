<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable;

    /** Rôles disponibles dans l'application. */
    public const ROLE_SUPER_ADMIN = 'super-admin';
    public const ROLE_GESTIONNAIRE = 'gestionnaire';
    public const ROLE_COMPTABLE = 'comptable';

    public const ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_GESTIONNAIRE,
        self::ROLE_COMPTABLE,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'photo',
        'company_name',
        'locale',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    public function houses(): HasMany
    {
        return $this->hasMany(House::class);
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isGestionnaire(): bool
    {
        return $this->role === self::ROLE_GESTIONNAIRE;
    }

    public function isComptable(): bool
    {
        return $this->role === self::ROLE_COMPTABLE;
    }

    /** Le super-admin voit toutes les données ; les autres voient les leurs. */
    public function seesAllData(): bool
    {
        return $this->isSuperAdmin();
    }

    /** Rôle lisible en français. */
    public function getRoleLabelAttribute(): string
    {
        return match ($this->role) {
            self::ROLE_SUPER_ADMIN => 'Super Admin',
            self::ROLE_GESTIONNAIRE => 'Gestionnaire',
            self::ROLE_COMPTABLE => 'Comptable',
            default => $this->role,
        };
    }
}
