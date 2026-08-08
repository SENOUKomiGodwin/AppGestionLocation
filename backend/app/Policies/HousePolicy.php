<?php

namespace App\Policies;

use App\Models\House;
use App\Models\User;

class HousePolicy
{
    /** Tous les rôles connectés peuvent consulter. */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, House $house): bool
    {
        return $user->seesAllData() || $house->user_id === $user->id;
    }

    /** Seuls les gestionnaires et super-admins peuvent créer/modifier/supprimer. */
    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isGestionnaire();
    }

    public function update(User $user, House $house): bool
    {
        return $this->create($user) && ($user->seesAllData() || $house->user_id === $user->id);
    }

    public function delete(User $user, House $house): bool
    {
        return $this->update($user, $house);
    }
}
