<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentFactory> */
    use HasFactory;

    public const METHODS = ['especes', 'virement', 'carte', 'cheque'];

    protected $fillable = [
        'rent_due_id',
        'contract_id',
        'tenant_id',
        'amount',
        'method',
        'reference',
        'payment_date',
        'notes',
        'receipt_path',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'float',
        'payment_date' => 'date',
    ];

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    public function rentDue(): BelongsTo
    {
        return $this->belongsTo(RentDue::class);
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** Utilisateur ayant enregistré le paiement. */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    public function getMethodLabelAttribute(): string
    {
        return match ($this->method) {
            'especes' => 'Espèces',
            'virement' => 'Virement',
            'carte' => 'Carte',
            'cheque' => 'Chèque',
            default => $this->method,
        };
    }

    /** Référence lisible du reçu, ex : REC-2026-0001. */
    public function getReceiptNumberAttribute(): string
    {
        return 'REC-'.($this->created_at?->format('Y') ?? date('Y')).'-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT);
    }
}
