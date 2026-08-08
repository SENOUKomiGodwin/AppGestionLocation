<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Tenant $tenant): bool
    {
        return $user->seesAllData() || $tenant->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isGestionnaire();
    }

    public function update(User $user, Tenant $tenant): bool
    {
        return $this->create($user) && $this->view($user, $tenant);
    }

    public function delete(User $user, Tenant $tenant): bool
    {
        return $this->update($user, $tenant);
    }
}
