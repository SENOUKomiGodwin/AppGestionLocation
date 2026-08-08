<?php

namespace App\Http\Resources;

use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'initials' => $this->initials,
            'photo' => FileUploadService::url($this->photo),
            'phone' => $this->phone,
            'email' => $this->email,
            'profession' => $this->profession,
            'birth_date' => $this->birth_date?->format('Y-m-d'),
            'nationality' => $this->nationality,
            'id_number' => $this->id_number,
            'id_photo' => FileUploadService::url($this->id_photo),
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'active_contract' => new ContractResource($this->whenLoaded('activeContract')),
            'contracts' => ContractResource::collection($this->whenLoaded('contracts')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
