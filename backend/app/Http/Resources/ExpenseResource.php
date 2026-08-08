<?php

namespace App\Http\Resources;

use App\Services\FileUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'house_id' => $this->house_id,
            'house' => new HouseResource($this->whenLoaded('house')),
            'category' => $this->category,
            'category_label' => $this->category_label,
            'amount' => $this->amount,
            'description' => $this->description,
            'expense_date' => $this->expense_date?->format('Y-m-d'),
            'receipt_url' => FileUploadService::url($this->receipt_path),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
