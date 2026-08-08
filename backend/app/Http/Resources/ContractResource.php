<?php

namespace App\Http\Resources;

use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'tenant' => new TenantResource($this->whenLoaded('tenant')),
            'unit_id' => $this->unit_id,
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'duration_months' => $this->duration_months,
            'monthly_rent' => $this->monthly_rent,
            'deposit' => $this->deposit,
            'billing_day' => $this->billing_day,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'pdf_url' => FileUploadService::url($this->pdf_path),
            'renewal_of_id' => $this->renewal_of_id,
            'total_balance' => $this->total_balance,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
