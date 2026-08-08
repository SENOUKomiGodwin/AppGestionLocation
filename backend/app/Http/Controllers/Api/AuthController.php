<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;

class AuthController extends Controller
{
    /* ------------------------------------------------------------------
     | Inscription
     | ------------------------------------------------------------------ */

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'company_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'company_name' => $validated['company_name'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'role' => User::ROLE_GESTIONNAIRE,
            'locale' => 'fr',
        ]);

        event(new Registered($user));

        AuditService::log('register', $user);

        $this->sendVerificationCode($user);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /* ------------------------------------------------------------------
     | Connexion / déconnexion
     | ------------------------------------------------------------------ */

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Identifiants incorrects.',
                'errors' => ['email' => ['Email ou mot de passe incorrect.']],
            ], 422);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Ce compte a été désactivé.'], 403);
        }

        AuditService::log('login', $user);

        $token = $user->createToken($validated['device_name'] ?? 'auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie.',
            'user' => new UserResource($user),
            'token' => $token,
            'email_verified' => (bool) $user->email_verified_at,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Révoque le token courant (ou tous les tokens si "all" est passé)
        if ($request->boolean('all')) {
            $request->user()->tokens()->delete();
        } else {
            $request->user()->currentAccessToken()?->delete();
        }

        AuditService::log('logout');

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    /** Profil de l'utilisateur connecté. */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => new UserResource($user),
            'settings' => \App\Models\Setting::allFor($user),
        ]);
    }

    /* ------------------------------------------------------------------
     | Mot de passe oublié
     | ------------------------------------------------------------------ */

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        // Toujours renvoyer le même message (sécurité : pas de divulgation)
        return response()->json([
            'message' => 'Si cette adresse existe, un lien de réinitialisation a été envoyé.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));

                // Révoque tous les tokens existants
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Réinitialisation impossible. Token invalide ou expiré.',
                'errors' => ['email' => [__($status)]],
            ], 422);
        }

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    /* ------------------------------------------------------------------
     | Vérification email
     | ------------------------------------------------------------------ */

    /** Vérifie l'email via le code (6 chiffres) envoyé par email. */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string', 'size:6']]);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email déjà vérifié.']);
        }

        // Code stocké en base via password_reset_tokens (clé dédiée)
        $stored = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->where('token', 'verify:'.$request->code)
            ->first();

        if ($stored === null) {
            return response()->json([
                'message' => 'Code de vérification invalide.',
                'errors' => ['code' => ['Code invalide ou expiré.']],
            ], 422);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->delete();

        return response()->json(['message' => 'Email vérifié avec succès.']);
    }

    /** Renvoie (ou envoie pour la première fois) le code de vérification. */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email déjà vérifié.']);
        }

        $this->sendVerificationCode($user);

        return response()->json(['message' => 'Code de vérification envoyé.']);
    }

    /**
     * Génère un code à 6 chiffres, le stocke et l'envoie par email.
     */
    private function sendVerificationCode(User $user): void
    {
        $code = (string) random_int(100000, 999999);

        \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->updateOrInsert(
                ['email' => $user->email],
                ['token' => 'verify:'.$code, 'created_at' => now()]
            );

        // Envoyer le code par email (mailer de log en dev)
        \Illuminate\Support\Facades\Mail::raw(
            "Votre code de vérification ImmoManager est : {$code}",
            function ($message) use ($user) {
                $message->to($user->email)
                    ->subject('Vérification de votre email — ImmoManager');
            }
        );
    }
}
