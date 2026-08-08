<?php

namespace App\Http\Resources;

use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rent_due_id' => $this->rent_due_id,
            'contract_id' => $this->contract_id,
            'tenant_id' => $this->tenant_id,
            'tenant' => new TenantResource($this->whenLoaded('tenant')),
            'amount' => $this->amount,
            'method' => $this->method,
            'method_label' => $this->method_label,
            'reference' => $this->reference,
            'payment_date' => $this->payment_date?->format('Y-m-d'),
            'notes' => $this->notes,
            'receipt_number' => $this->receipt_number,
            'receipt_url' => FileUploadService::url($this->receipt_path),
            'recorded_by' => $this->whenLoaded('recordedBy', fn () => $this->recordedBy?->name),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
