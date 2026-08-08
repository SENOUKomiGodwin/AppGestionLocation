<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class House extends Model
{
    /** @use HasFactory<\Database\Factories\HouseFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'address',
        'city',
        'description',
        'photo',
        'number_of_units',
    ];

    protected $casts = [
        'number_of_units' => 'integer',
    ];

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    /** Propriétaire (multi-propriétaires SaaS). */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Logements contenus dans cette maison. */
    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    /** Locataires via les logements (through). */
    public function tenants(): HasManyThrough
    {
        return $this->hasManyThrough(
            Tenant::class,
            Unit::class,
            'house_id',
            'id',
            'id',
            'tenant_id'
        );
    }

    /* ------------------------------------------------------------------
     | Scopes
     | ------------------------------------------------------------------ */

    /**
     * Filtre par propriétaire : les super-admins voient tout,
     * les autres utilisateurs uniquement leurs biens.
     */
    public function scopeOwnedBy($query, ?User $user)
    {
        if ($user === null) {
            return $query;
        }

        return $user->seesAllData() ? $query : $query->where('houses.user_id', $user->id);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    /** Nombre de logements occupés. */
    public function occupiedUnitsCount(): int
    {
        return $this->units()->where('status', 'occupe')->count();
    }

    /** Nombre de logements libres. */
    public function freeUnitsCount(): int
    {
        return $this->units()->where('status', 'libre')->count();
    }

    /** Loyer mensuel potentiel total (tous logements confondus). */
    public function potentialMonthlyRent(): float
    {
        return (float) $this->units()->sum('rent_amount');
    }
}
