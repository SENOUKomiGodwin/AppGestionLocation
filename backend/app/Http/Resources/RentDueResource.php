<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RentDueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'unit_id' => $this->unit_id,
            'tenant_id' => $this->tenant_id,
            'tenant' => new TenantResource($this->whenLoaded('tenant')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'period' => $this->period,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'amount' => $this->amount,
            'paid_amount' => $this->paid_amount,
            'balance' => $this->balance,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'payment_date' => $this->payment_date?->toISOString(),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
