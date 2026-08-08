<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| Lien de réinitialisation du mot de passe
|--------------------------------------------------------------------------
|
| Laravel génère le lien "password.reset" lors de l'envoi de l'email.
| On redirige vers la page de réinitialisation du frontend React,
| qui appelle ensuite l'API /api/auth/reset-password avec le token.
|
*/
Route::get('/password/reset/{token}', function (string $token) {
    $email = request()->query('email');

    return redirect(env('FRONTEND_URL', 'http://localhost:5173').'/reset-password?token='.$token.($email ? '&email='.urlencode($email) : ''));
})->name('password.reset');
