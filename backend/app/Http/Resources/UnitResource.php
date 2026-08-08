<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'house_id' => $this->house_id,
            'house' => new HouseResource($this->whenLoaded('house')),
            'number' => $this->number,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'bedrooms' => $this->bedrooms,
            'surface' => $this->surface,
            'rent_amount' => $this->rent_amount,
            'deposit' => $this->deposit,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'display_name' => $this->display_name,
            'current_tenant' => new TenantResource($this->whenLoaded('currentTenant')),
            'active_contract' => new ContractResource($this->whenLoaded('activeContract')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
