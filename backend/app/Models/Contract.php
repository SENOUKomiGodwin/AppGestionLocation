<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contract extends Model
{
    /** @use HasFactory<\Database\Factories\ContractFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_EXPIRE = 'expire';
    public const STATUS_RESILIE = 'resilie';
    public const STATUS_RENOUVELE = 'renouvele';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_EXPIRE,
        self::STATUS_RESILIE,
        self::STATUS_RENOUVELE,
    ];

    protected $fillable = [
        'tenant_id',
        'unit_id',
        'start_date',
        'end_date',
        'duration_months',
        'monthly_rent',
        'deposit',
        'billing_day',
        'status',
        'pdf_path',
        'renewal_of_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'duration_months' => 'integer',
        'monthly_rent' => 'float',
        'deposit' => 'float',
        'billing_day' => 'integer',
    ];

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function rentDues(): HasMany
    {
        return $this->hasMany(RentDue::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** Contrat d'origine lors d'un renouvellement. */
    public function renewalOf(): BelongsTo
    {
        return $this->belongsTo(self::class, 'renewal_of_id');
    }

    /** Contrats issus du renouvellement de celui-ci (historique). */
    public function renewals(): HasMany
    {
        return $this->hasMany(self::class, 'renewal_of_id');
    }

    /* ------------------------------------------------------------------
     | Scopes
     | ------------------------------------------------------------------ */

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Actif',
            self::STATUS_EXPIRE => 'Expiré',
            self::STATUS_RESILIE => 'Résilié',
            self::STATUS_RENOUVELE => 'Renouvelé',
            default => $this->status,
        };
    }

    /** Solde total impayé sur ce contrat (somme des soldes des échéances). */
    public function getTotalBalanceAttribute(): float
    {
        return (float) $this->rentDues()
            ->where('status', '!=', 'paid')
            ->get()
            ->sum(fn (RentDue $due) => $due->balance);
    }
}
