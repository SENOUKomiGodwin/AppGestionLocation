<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Unit extends Model
{
    /** @use HasFactory<\Database\Factories\UnitFactory> */
    use HasFactory;

    public const STATUS_LIBRE = 'libre';
    public const STATUS_OCCUPE = 'occupe';
    public const STATUS_RENOVATION = 'renovation';

    public const STATUSES = [
        self::STATUS_LIBRE,
        self::STATUS_OCCUPE,
        self::STATUS_RENOVATION,
    ];

    protected $fillable = [
        'house_id',
        'number',
        'type',
        'bedrooms',
        'surface',
        'rent_amount',
        'deposit',
        'status',
    ];

    protected $casts = [
        'bedrooms' => 'integer',
        'surface' => 'float',
        'rent_amount' => 'float',
        'deposit' => 'float',
    ];

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    /** Contrat actif (un seul logement / locataire actif). */
    public function activeContract(): HasOne
    {
        return $this->hasOne(Contract::class)->where('status', Contract::STATUS_ACTIVE)->latestOfMany();
    }

    public function rentDues(): HasMany
    {
        return $this->hasMany(RentDue::class);
    }

    /** Locataire actuel via le contrat actif. */
    public function currentTenant()
    {
        return $this->hasOneThrough(
            Tenant::class,
            Contract::class,
            'unit_id',
            'id',
            'id',
            'tenant_id'
        )->where('contracts.status', Contract::STATUS_ACTIVE);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    public function isOccupied(): bool
    {
        return $this->status === self::STATUS_OCCUPE;
    }

    public function isFree(): bool
    {
        return $this->status === self::STATUS_LIBRE;
    }

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'appartement' => 'Appartement',
            'maison' => 'Maison',
            'studio' => 'Studio',
            'commercial' => 'Local commercial',
            'bureau' => 'Bureau',
            default => ucfirst($this->type),
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_LIBRE => 'Libre',
            self::STATUS_OCCUPE => 'Occupé',
            self::STATUS_RENOVATION => 'En rénovation',
            default => $this->status,
        };
    }

    /** Format du logement, ex : "Appt 3 — 2 ch." */
    public function getDisplayNameAttribute(): string
    {
        return "{$this->house?->name} · {$this->number}";
    }
}
