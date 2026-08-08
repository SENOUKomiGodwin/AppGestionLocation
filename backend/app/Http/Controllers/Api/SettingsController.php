<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Tous les paramètres de l'utilisateur (avec valeurs par défaut).
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'settings' => Setting::allFor($request->user()),
        ]);
    }

    /**
     * Met à jour les paramètres (partiel ou complet).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'company_address' => ['nullable', 'string', 'max:500'],
            'company_phone' => ['nullable', 'string', 'max:50'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'currency' => ['nullable', 'string', 'size:3'],
            'language' => ['nullable', 'string', 'in:fr,en'],
            'payment_due_reminder_days' => ['nullable', 'integer', 'min:0', 'max:30'],
            'late_payment_reminder_days' => ['nullable', 'integer', 'min:0', 'max:60'],
        ]);

        $user = $request->user();

        foreach ($validated as $key => $value) {
            Setting::set($key, $value, $user);
        }

        AuditService::log('settings_updated', null, array_keys($validated));

        return response()->json([
            'message' => 'Paramètres enregistrés.',
            'settings' => Setting::allFor($user),
        ]);
    }

    /**
     * Upload du logo de l'entreprise.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpeg,png,jpg,svg,webp', 'max:5120'],
        ]);

        $user = $request->user();
        $old = Setting::get('logo', null, $user);

        $path = FileUploadService::image($request->file('logo'), 'settings', $old);
        Setting::set('logo', $path, $user);

        AuditService::log('logo_updated', null, ['logo' => $path]);

        return response()->json([
            'message' => 'Logo mis à jour.',
            'settings' => Setting::allFor($user),
        ]);
    }
}
