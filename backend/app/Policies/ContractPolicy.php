<?php

namespace App\Policies;

use App\Models\Contract;
use App\Models\User;

class ContractPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Contract $contract): bool
    {
        return $user->seesAllData()
            || $contract->unit?->house?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isGestionnaire();
    }

    public function update(User $user, Contract $contract): bool
    {
        return $this->create($user) && $this->view($user, $contract);
    }

    public function delete(User $user, Contract $contract): bool
    {
        return $this->update($user, $contract);
    }
}
