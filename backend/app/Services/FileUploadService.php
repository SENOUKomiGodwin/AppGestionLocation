<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class FileUploadService
{
    /**
     * Enregistre une image (photo) dans le disque "public" et retourne son chemin.
     */
    public static function image(UploadedFile $file, string $folder = 'uploads', ?string $oldPath = null): string
    {
        $name = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();

        $path = $file->storeAs($folder, $name, 'public');

        if ($oldPath) {
            self::delete($oldPath);
        }

        return $path;
    }

    /**
     * Enregistre un fichier (PDF) et retourne son chemin.
     */
    public static function file(UploadedFile $file, string $folder = 'documents'): string
    {
        $name = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();

        return $file->storeAs($folder, $name, 'public');
    }

    /** Supprime un fichier stocké en public. */
    public static function delete(?string $path): void
    {
        if ($path && \Storage::disk('public')->exists($path)) {
            \Storage::disk('public')->delete($path);
        }
    }

    /** URL publique complète d'un fichier stocké. */
    public static function url(?string $path): ?string
    {
        return $path ? \Storage::disk('public')->url($path) : null;
    }
}
