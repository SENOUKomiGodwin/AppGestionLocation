<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HouseResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\TenantResource;
use App\Http\Resources\UnitResource;
use App\Models\House;
use App\Models\Payment;
use App\Models\RentDue;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Recherche instantanée sur les maisons, locataires, logements et paiements.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:255'],
            'types' => ['nullable', 'array'],
            'types.*' => ['in:houses,tenants,units,payments'],
        ]);

        $q = $request->string('q');
        $user = $request->user();
        $types = $request->input('types', ['houses', 'tenants', 'units', 'payments']);
        $limit = $request->integer('limit', 8);

        $results = [];

        if (in_array('houses', $types, true)) {
            $houses = House::query()
                ->ownedBy($user)
                ->where(function ($query) use ($q) {
                    $query->where('name', 'like', "%{$q}%")
                        ->orWhere('address', 'like', "%{$q}%")
                        ->orWhere('city', 'like', "%{$q}%");
                })
                ->limit($limit)
                ->get();

            $results['houses'] = HouseResource::collection($houses);
        }

        if (in_array('tenants', $types, true)) {
            $tenants = Tenant::query()
                ->ownedBy($user)
                ->where(function ($query) use ($q) {
                    $query->where('first_name', 'like', "%{$q}%")
                        ->orWhere('last_name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('phone', 'like', "%{$q}%")
                        ->orWhere('id_number', 'like', "%{$q}%");
                })
                ->with('activeContract.unit.house')
                ->limit($limit)
                ->get();

            $results['tenants'] = TenantResource::collection($tenants);
        }

        if (in_array('units', $types, true)) {
            $units = Unit::query()
                ->with(['house', 'currentTenant'])
                ->when($user !== null && ! $user->seesAllData(), fn ($query) => $query->whereHas(
                    'house',
                    fn ($h) => $h->where('user_id', $user->id)
                ))
                ->where(function ($query) use ($q) {
                    $query->where('number', 'like', "%{$q}%")
                        ->orWhereHas('house', fn ($h) => $h->where('name', 'like', "%{$q}%"));
                })
                ->limit($limit)
                ->get();

            $results['units'] = UnitResource::collection($units);
        }

        if (in_array('payments', $types, true)) {
            $payments = Payment::query()
                ->with(['tenant', 'rentDue'])
                ->when($user !== null && ! $user->seesAllData(), fn ($query) => $query->whereHas(
                    'tenant',
                    fn ($t) => $t->where('user_id', $user->id)
                ))
                ->where(function ($query) use ($q) {
                    $query->where('reference', 'like', "%{$q}%")
                        ->orWhereHas('tenant', function ($t) use ($q) {
                            $t->where('first_name', 'like', "%{$q}%")
                                ->orWhere('last_name', 'like', "%{$q}%");
                        });
                })
                ->limit($limit)
                ->get();

            $results['payments'] = PaymentResource::collection($payments);
        }

        return response()->json([
            'query' => (string) $q,
            'results' => $results,
        ]);
    }
}
