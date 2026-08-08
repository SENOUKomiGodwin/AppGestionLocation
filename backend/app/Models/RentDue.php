<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RentDue extends Model
{
    /** @use HasFactory<\Database\Factories\RentDueFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_LATE = 'late';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PAID,
        self::STATUS_PARTIAL,
        self::STATUS_LATE,
    ];

    protected $fillable = [
        'contract_id',
        'unit_id',
        'tenant_id',
        'period',
        'due_date',
        'amount',
        'paid_amount',
        'status',
        'payment_date',
    ];

    protected $casts = [
        'due_date' => 'date',
        'amount' => 'float',
        'paid_amount' => 'float',
        'payment_date' => 'datetime',
    ];

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** Paiements enregistrés sur cette échéance. */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /* ------------------------------------------------------------------
     | Scopes
     | ------------------------------------------------------------------ */

    public function scopeForPeriod($query, string $period)
    {
        return $query->where('period', $period);
    }

    public function scopeUnpaid($query)
    {
        return $query->whereIn('status', [self::STATUS_PENDING, self::STATUS_LATE]);
    }

    public function scopeLate($query)
    {
        return $query->where('status', self::STATUS_LATE);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    /** Solde restant dû. */
    public function getBalanceAttribute(): float
    {
        return round($this->amount - $this->paid_amount, 2);
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PAID => 'Payé',
            self::STATUS_PARTIAL => 'Partiellement payé',
            self::STATUS_LATE => 'En retard',
            default => 'Non payé',
        };
    }

    /** Marque l'échéance comme "en retard" si la date limite est dépassée. */
    public function refreshStatus(): void
    {
        if ($this->status === self::STATUS_PAID) {
            return;
        }

        if ($this->paid_amount > 0 && $this->paid_amount < $this->amount) {
            $this->status = self::STATUS_PARTIAL;
        } elseif ($this->due_date->isPast()) {
            $this->status = self::STATUS_LATE;
        } else {
            $this->status = self::STATUS_PENDING;
        }

        $this->save();
    }
}
