<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\RentDue;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Architecture de notifications multi-canaux.
 *
 * Le canal "database" est actif ; les canaux WhatsApp, SMS, Email et Push
 * sont prêts à être branchés sur les fournisseurs de votre choix
 * (Twilio, Vonage, Firebase Cloud Messaging, etc.).
 */
class NotificationService
{
    public const CHANNEL_DATABASE = 'database';
    public const CHANNEL_EMAIL = 'email';
    public const CHANNEL_WHATSAPP = 'whatsapp';
    public const CHANNEL_SMS = 'sms';
    public const CHANNEL_PUSH = 'push';

    /**
     * Envoie une notification à un utilisateur sur les canaux demandés.
     *
     * @param  string[]  $channels
     */
    public static function send(User $user, string $title, string $body, array $data = [], array $channels = [self::CHANNEL_DATABASE]): void
    {
        foreach ($channels as $channel) {
            match ($channel) {
                self::CHANNEL_DATABASE => self::toDatabase($user, $title, $body, $data),
                self::CHANNEL_EMAIL => self::toEmail($user, $title, $body, $data),
                self::CHANNEL_WHATSAPP => self::toWhatsApp($user, $title, $body, $data),
                self::CHANNEL_SMS => self::toSms($user, $title, $body, $data),
                self::CHANNEL_PUSH => self::toPush($user, $title, $body, $data),
                default => null,
            };
        }
    }

    /** Canal base de données (affiché dans l'application). */
    public static function toDatabase(User $user, string $title, string $body, array $data = []): void
    {
        $user->notifications()->create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'type' => 'App\Notifications\GeneralNotification',
            'data' => json_encode([
                'title' => $title,
                'body' => $body,
                'url' => $data['url'] ?? null,
                'icon' => $data['icon'] ?? 'bell',
            ]),
        ]);
    }

    /** Canal email — brancher un Mailable ici (Mail::to($user)->send(...)). */
    public static function toEmail(User $user, string $title, string $body, array $data = []): void
    {
        Log::info("[NotificationService][email] A $user->email : $title — $body");
        // TODO: Mail::to($user)->send(new GeneralNotificationMail($title, $body, $data));
    }

    /** Canal WhatsApp — brancher un fournisseur type Twilio ici. */
    public static function toWhatsApp(User $user, string $title, string $body, array $data = []): void
    {
        Log::info("[NotificationService][whatsapp] A $user->phone : $title — $body");
        // TODO: Twilio WhatsApp API
    }

    /** Canal SMS — brancher un fournisseur type Vonage/Twilio ici. */
    public static function toSms(User $user, string $title, string $body, array $data = []): void
    {
        Log::info("[NotificationService][sms] A $user->phone : $title — $body");
        // TODO: Vonage SMS API
    }

    /** Canal push — brancher Firebase Cloud Messaging ici. */
    public static function toPush(User $user, string $title, string $body, array $data = []): void
    {
        Log::info("[NotificationService][push] A $user->id : $title — $body");
        // TODO: FCM / Web Push
    }

    /* ------------------------------------------------------------------
     | Notifications métier
     | ------------------------------------------------------------------ */

    /** Rappel d'échéance avant la date de paiement. */
    public static function remindDue(RentDue $due): void
    {
        $user = $due->contract?->unit?->house?->owner;
        if ($user === null) {
            return;
        }

        self::send(
            $user,
            'Échéance de loyer à venir',
            "Loyer de {$due->tenant?->full_name} pour {$due->period} : ".number_format($due->amount, 2, ',', ' ').' '.Setting::get('currency', 'EUR', $user),
            ['url' => "/payments?period={$due->period}", 'icon' => 'calendar'],
            [self::CHANNEL_DATABASE, self::CHANNEL_EMAIL]
        );
    }

    /** Notification de retard de paiement. */
    public static function notifyLate(RentDue $due): void
    {
        $user = $due->contract?->unit?->house?->owner;
        if ($user === null) {
            return;
        }

        self::send(
            $user,
            'Loyer en retard',
            "Le loyer de {$due->tenant?->full_name} pour {$due->period} est en retard (solde : ".number_format($due->balance, 2, ',', ' ').' '.Setting::get('currency', 'EUR', $user).')',
            ['url' => "/payments?period={$due->period}", 'icon' => 'alert'],
            [self::CHANNEL_DATABASE, self::CHANNEL_EMAIL]
        );
    }

    /** Rappel de fin de bail proche. */
    public static function remindContractEnd(Contract $contract): void
    {
        $user = $contract->unit?->house?->owner;
        if ($user === null) {
            return;
        }

        self::send(
            $user,
            'Fin de bail proche',
            "Le contrat de {$contract->tenant?->full_name} expire le ".$contract->end_date->format('d/m/Y').'.',
            ['url' => "/contracts/{$contract->id}", 'icon' => 'document'],
            [self::CHANNEL_DATABASE, self::CHANNEL_EMAIL]
        );
    }
}
