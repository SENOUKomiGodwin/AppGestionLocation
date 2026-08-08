<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HouseResource;
use App\Models\House;
use App\Services\AuditService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HouseController extends Controller
{
    /**
     * Liste paginée des maisons (avec filtres).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', House::class);

        $houses = House::query()
            ->withCount('units')
            ->with(['units'])
            ->ownedBy($request->user())
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('city'), fn ($q) => $q->where('city', $request->string('city')))
            ->when($request->filled('sort'), fn ($q) => $q->orderBy(
                $request->string('sort'),
                $request->string('direction', 'asc') === 'desc' ? 'desc' : 'asc'
            ), fn ($q) => $q->latest())
            ->paginate($request->integer('per_page', 15));

        return HouseResource::collection($houses);
    }

    /**
     * Détail d'une maison.
     */
    public function show(Request $request, House $house): HouseResource
    {
        $this->authorize('view', $house);

        $house->load(['units', 'units.activeContract.tenant', 'units.currentTenant']);

        return new HouseResource($house);
    }

    /**
     * Création d'une maison (+ photo optionnelle).
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', House::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'number_of_units' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ]);

        $house = House::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'address' => $validated['address'],
            'city' => $validated['city'] ?? null,
            'description' => $validated['description'] ?? null,
            'number_of_units' => $validated['number_of_units'] ?? 0,
        ]);

        if ($request->hasFile('photo')) {
            $house->update(['photo' => FileUploadService::image($request->file('photo'), 'houses')]);
        }

        AuditService::log('created', $house, ['name' => $house->name]);

        return response()->json([
            'message' => 'Maison créée avec succès.',
            'house' => new HouseResource($house->load('units')),
        ], 201);
    }

    /**
     * Mise à jour d'une maison.
     */
    public function update(Request $request, House $house): JsonResponse
    {
        $this->authorize('update', $house);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'number_of_units' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ]);

        $changes = $request->only(['name', 'address', 'city', 'description', 'number_of_units']);

        $house->update($changes);

        if ($request->hasFile('photo')) {
            $house->update(['photo' => FileUploadService::image($request->file('photo'), 'houses', $house->photo)]);
        }

        AuditService::log('updated', $house, $changes);

        return response()->json([
            'message' => 'Maison mise à jour.',
            'house' => new HouseResource($house->load('units')),
        ]);
    }

    /**
     * Suppression d'une maison (et de ses logements).
     */
    public function destroy(Request $request, House $house): JsonResponse
    {
        $this->authorize('delete', $house);

        $name = $house->name;
        $house->delete();

        AuditService::log('deleted', null, ['house' => $name]);

        return response()->json(['message' => 'Maison supprimée.']);
    }
}
