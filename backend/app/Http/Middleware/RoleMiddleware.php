<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Vérifie que l'utilisateur connecté possède l'un des rôles requis.
     *
     * Exemple : ->middleware('role:super-admin,gestionnaire')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        // Le super-admin a toujours accès à tout.
        if ($user->isSuperAdmin() || in_array($user->role, $roles, true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Accès refusé : vous n\'avez pas les permissions nécessaires.',
        ], 403);
    }
}
