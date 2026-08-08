<?php

namespace App\Policies;

use App\Models\Expense;
use App\Models\User;

class ExpensePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Expense $expense): bool
    {
        return $user->seesAllData() || $expense->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [User::ROLE_SUPER_ADMIN, User::ROLE_GESTIONNAIRE, User::ROLE_COMPTABLE], true);
    }

    public function update(User $user, Expense $expense): bool
    {
        return $this->create($user) && $this->view($user, $expense);
    }

    public function delete(User $user, Expense $expense): bool
    {
        return $this->update($user, $expense);
    }
}
