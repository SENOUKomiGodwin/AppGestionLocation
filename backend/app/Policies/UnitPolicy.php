<?php

namespace App\Policies;

use App\Models\Unit;
use App\Models\User;

class UnitPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Unit $unit): bool
    {
        return $user->seesAllData() || $unit->house?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isGestionnaire();
    }

    public function update(User $user, Unit $unit): bool
    {
        return $this->create($user) && $this->view($user, $unit);
    }

    public function delete(User $user, Unit $unit): bool
    {
        return $this->update($user, $unit);
    }
}
