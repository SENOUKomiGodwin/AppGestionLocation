<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Services\AuditService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TenantController extends Controller
{
    /**
     * Liste paginée des locataires (filtres : recherche, statut).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Tenant::class);

        $tenants = Tenant::query()
            ->with(['activeContract.unit.house'])
            ->ownedBy($request->user())
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->string('search');
                $q->where(function ($query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('id_number', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('active'), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->when($request->filled('sort'), fn ($q) => $q->orderBy(
                $request->string('sort'),
                $request->string('direction', 'asc') === 'desc' ? 'desc' : 'asc'
            ), fn ($q) => $q->latest())
            ->paginate($request->integer('per_page', 15));

        return TenantResource::collection($tenants);
    }

    public function show(Request $request, Tenant $tenant): TenantResource
    {
        $this->authorize('view', $tenant);

        $tenant->load([
            'contracts.unit.house',
            'contracts.rentDues',
            'activeContract.unit.house',
        ]);

        return new TenantResource($tenant);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Tenant::class);

        $validated = $request->validate($this->rules());

        $tenant = Tenant::create([
            'user_id' => $request->user()->id,
            ...$this->extract($validated),
        ]);

        if ($request->hasFile('photo')) {
            $tenant->update(['photo' => FileUploadService::image($request->file('photo'), 'tenants')]);
        }

        if ($request->hasFile('id_photo')) {
            $tenant->update(['id_photo' => FileUploadService::image($request->file('id_photo'), 'tenants/cni')]);
        }

        AuditService::log('created', $tenant, ['name' => $tenant->full_name]);

        return response()->json([
            'message' => 'Locataire créé.',
            'tenant' => new TenantResource($tenant),
        ], 201);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('update', $tenant);

        $validated = $request->validate($this->rules(true));

        $tenant->update($this->extract($validated));

        if ($request->hasFile('photo')) {
            $tenant->update(['photo' => FileUploadService::image($request->file('photo'), 'tenants', $tenant->photo)]);
        }

        if ($request->hasFile('id_photo')) {
            $tenant->update(['id_photo' => FileUploadService::image($request->file('id_photo'), 'tenants/cni', $tenant->id_photo)]);
        }

        AuditService::log('updated', $tenant, $validated);

        return response()->json([
            'message' => 'Locataire mis à jour.',
            'tenant' => new TenantResource($tenant),
        ]);
    }

    public function destroy(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('delete', $tenant);

        $name = $tenant->full_name;
        $tenant->delete();

        AuditService::log('deleted', null, ['tenant' => $name]);

        return response()->json(['message' => 'Locataire supprimé.']);
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    private function rules(bool $update = false): array
    {
        $rules = [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'id_photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'profession' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date', 'before:today'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'id_number' => ['nullable', 'string', 'max:255'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];

        return $update
            ? collect($rules)->map(fn ($r) => array_merge(['sometimes'], $r))->all()
            : $rules;
    }

    private function extract(array $validated): array
    {
        return collect($validated)
            ->except(['photo', 'id_photo'])
            ->merge([
                'is_active' => $validated['is_active'] ?? true,
            ])
            ->all();
    }
}
