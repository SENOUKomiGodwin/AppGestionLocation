<?php

namespace App\Http\Resources;

use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HouseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'city' => $this->city,
            'description' => $this->description,
            'photo' => FileUploadService::url($this->photo),
            'number_of_units' => $this->number_of_units,
            'occupied_units' => $this->relationLoaded('units')
                ? $this->units->where('status', 'occupe')->count()
                : null,
            'free_units' => $this->relationLoaded('units')
                ? $this->units->where('status', 'libre')->count()
                : null,
            'created_at' => $this->created_at?->toISOString(),
            'units' => UnitResource::collection($this->whenLoaded('units')),
        ];
    }
}
