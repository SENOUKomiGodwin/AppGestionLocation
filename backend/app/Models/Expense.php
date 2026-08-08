<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    /** @use HasFactory<\Database\Factories\ExpenseFactory> */
    use HasFactory;

    public const CATEGORIES = ['reparation', 'eau', 'electricite', 'entretien', 'securite', 'autre'];

    protected $fillable = [
        'user_id',
        'house_id',
        'category',
        'amount',
        'description',
        'expense_date',
        'receipt_path',
    ];

    protected $casts = [
        'amount' => 'float',
        'expense_date' => 'date',
    ];

    /* ------------------------------------------------------------------
     | Relations
     | ------------------------------------------------------------------ */

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(House::class);
    }

    /* ------------------------------------------------------------------
     | Scopes
     | ------------------------------------------------------------------ */

    public function scopeOwnedBy($query, ?User $user)
    {
        if ($user === null) {
            return $query;
        }

        return $user->seesAllData() ? $query : $query->where('expenses.user_id', $user->id);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            'reparation' => 'Réparations',
            'eau' => 'Eau',
            'electricite' => 'Électricité',
            'entretien' => 'Entretien',
            'securite' => 'Sécurité',
            default => 'Autre',
        };
    }
}
