<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UnitResource;
use App\Models\House;
use App\Models\Unit;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UnitController extends Controller
{
    /**
     * Liste paginée des logements (filtres : maison, statut, type, recherche).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Unit::class);

        $user = $request->user();

        $units = Unit::query()
            ->with(['house', 'currentTenant', 'activeContract.tenant'])
            ->when($user !== null && ! $user->seesAllData(), fn ($q) => $q->whereHas(
                'house',
                fn ($h) => $h->where('user_id', $user->id)
            ))
            ->when($request->filled('house_id'), fn ($q) => $q->where('house_id', $request->integer('house_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($query) use ($search) {
                    $query->where('number', 'like', "%{$search}%")
                        ->orWhereHas('house', fn ($h) => $h->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('sort'), fn ($q) => $q->orderBy(
                $request->string('sort'),
                $request->string('direction', 'asc') === 'desc' ? 'desc' : 'asc'
            ), fn ($q) => $q->latest())
            ->paginate($request->integer('per_page', 15));

        return UnitResource::collection($units);
    }

    /** Logements d'une maison précise. */
    public function forHouse(Request $request, House $house): AnonymousResourceCollection
    {
        $this->authorize('view', $house);

        $units = $house->units()
            ->with(['currentTenant', 'activeContract.tenant'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->get();

        return UnitResource::collection($units);
    }

    public function show(Request $request, Unit $unit): UnitResource
    {
        $this->authorize('view', $unit);

        $unit->load(['house', 'currentTenant', 'activeContract.tenant', 'contracts.tenant']);

        return new UnitResource($unit);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Unit::class);

        $validated = $request->validate([
            'house_id' => ['required', 'exists:houses,id'],
            'number' => ['required', 'string', 'max:50'],
            'type' => ['required', 'in:appartement,maison,studio,commercial,bureau'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'surface' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'rent_amount' => ['required', 'numeric', 'min:0'],
            'deposit' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:libre,occupe,renovation'],
        ]);

        $unit = Unit::create([
            'house_id' => $validated['house_id'],
            'number' => $validated['number'],
            'type' => $validated['type'],
            'bedrooms' => $validated['bedrooms'] ?? 0,
            'surface' => $validated['surface'] ?? 0,
            'rent_amount' => $validated['rent_amount'],
            'deposit' => $validated['deposit'] ?? 0,
            'status' => $validated['status'] ?? Unit::STATUS_LIBRE,
        ]);

        // Synchronise le compteur de logements de la maison
        $unit->house->update(['number_of_units' => $unit->house->units()->count()]);

        AuditService::log('created', $unit, ['number' => $unit->number]);

        return response()->json([
            'message' => 'Logement créé.',
            'unit' => new UnitResource($unit->load('house')),
        ], 201);
    }

    public function update(Request $request, Unit $unit): JsonResponse
    {
        $this->authorize('update', $unit);

        $validated = $request->validate([
            'house_id' => ['sometimes', 'exists:houses,id'],
            'number' => ['sometimes', 'string', 'max:50'],
            'type' => ['sometimes', 'in:appartement,maison,studio,commercial,bureau'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'surface' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'rent_amount' => ['sometimes', 'numeric', 'min:0'],
            'deposit' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:libre,occupe,renovation'],
        ]);

        $unit->update($validated);

        $unit->house->update(['number_of_units' => $unit->house->units()->count()]);

        AuditService::log('updated', $unit, $validated);

        return response()->json([
            'message' => 'Logement mis à jour.',
            'unit' => new UnitResource($unit->load('house')),
        ]);
    }

    public function destroy(Request $request, Unit $unit): JsonResponse
    {
        $this->authorize('delete', $unit);

        $house = $unit->house;
        $number = $unit->number;
        $unit->delete();

        if ($house) {
            $house->update(['number_of_units' => $house->units()->count()]);
        }

        AuditService::log('deleted', null, ['unit' => $number]);

        return response()->json(['message' => 'Logement supprimé.']);
    }
}
