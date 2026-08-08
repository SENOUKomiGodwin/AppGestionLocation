<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\HouseController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RentDueController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/* ------------------------------------------------------------------
 | Routes publiques (authentification)
 | ------------------------------------------------------------------ */

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

/* ------------------------------------------------------------------
 | Routes authentifiées (Sanctum)
 | ------------------------------------------------------------------ */

Route::middleware('auth:sanctum')->group(function () {

    /* --- Authentification / profil --- */
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/email/verify', [AuthController::class, 'verifyEmail']);
        Route::post('/email/resend', [AuthController::class, 'resendVerification']);
    });

    /* --- Tableau de bord --- */
    Route::get('/dashboard', [DashboardController::class, 'index']);

    /* --- Maisons --- */
    Route::apiResource('houses', HouseController::class);
    Route::get('houses/{house}/units', [UnitController::class, 'forHouse']);

    /* --- Logements --- */
    Route::apiResource('units', UnitController::class);

    /* --- Locataires --- */
    Route::apiResource('tenants', TenantController::class);

    /* --- Contrats --- */
    Route::apiResource('contracts', ContractController::class);
    Route::get('contracts/{contract}/download', [ContractController::class, 'download']);
    Route::post('contracts/{contract}/renew', [ContractController::class, 'renew']);

    /* --- Échéances de loyer --- */
    Route::get('rent-dues', [RentDueController::class, 'index']);
    Route::post('rent-dues/generate', [RentDueController::class, 'generate']);
    Route::get('rent-dues/{rentDue}', [RentDueController::class, 'show']);

    /* --- Paiements --- */
    Route::apiResource('payments', PaymentController::class)->only(['index', 'store', 'show']);

    /* --- Factures & reçus --- */
    Route::get('invoices/{rentDue}', [InvoiceController::class, 'invoice']);
    Route::get('receipts/{payment}', [InvoiceController::class, 'receipt']);

    /* --- Dépenses --- */
    Route::apiResource('expenses', ExpenseController::class);

    /* --- Statistiques / Analytics --- */
    Route::get('analytics', [AnalyticsController::class, 'index']);
    Route::get('analytics/export/pdf', [AnalyticsController::class, 'exportPdf']);
    Route::get('analytics/export/excel', [AnalyticsController::class, 'exportExcel']);

    /* --- Recherche --- */
    Route::get('search', [SearchController::class, 'index']);

    /* --- Paramètres (super-admin + gestionnaire) --- */
    Route::middleware('role:super-admin,gestionnaire')->group(function () {
        Route::get('settings', [SettingsController::class, 'index']);
        Route::put('settings', [SettingsController::class, 'update']);
        Route::post('settings/logo', [SettingsController::class, 'uploadLogo']);
    });

    /* --- Notifications --- */
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);

    /* --- Journal d'audit (super-admin) --- */
    Route::middleware('role:super-admin')->group(function () {
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::apiResource('users', UserController::class);
    });
});
