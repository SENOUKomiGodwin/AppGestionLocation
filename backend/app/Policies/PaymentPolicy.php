<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->seesAllData()
            || $payment->tenant_id !== null
            && $payment->tenant?->user_id === $user->id;
    }

    /** Le comptable peut enregistrer les paiements. */
    public function create(User $user): bool
    {
        return in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_GESTIONNAIRE, User::ROLE_COMPTABLE], true);
    }

    public function update(User $user, Payment $payment): bool
    {
        return $this->create($user) && $this->view($user, $payment);
    }
}
