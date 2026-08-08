<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\AuditService;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    /**
     * Liste paginée des dépenses (filtres : catégorie, maison, période).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Expense::class);

        $expenses = Expense::query()
            ->with(['house'])
            ->ownedBy($request->user())
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')))
            ->when($request->filled('house_id'), fn ($q) => $q->where('house_id', $request->integer('house_id')))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('expense_date', '>=', $request->string('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('expense_date', '<=', $request->string('to')))
            ->when($request->filled('sort'), fn ($q) => $q->orderBy(
                $request->string('sort'),
                $request->string('direction', 'asc') === 'desc' ? 'desc' : 'asc'
            ), fn ($q) => $q->latest('expense_date'))
            ->paginate($request->integer('per_page', 15));

        return ExpenseResource::collection($expenses);
    }

    public function show(Request $request, Expense $expense): ExpenseResource
    {
        $this->authorize('view', $expense);

        return new ExpenseResource($expense->load('house'));
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Expense::class);

        $validated = $request->validate([
            'house_id' => ['nullable', 'exists:houses,id'],
            'category' => ['required', 'in:reparation,eau,electricite,entretien,securite,autre'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'expense_date' => ['required', 'date'],
            'receipt' => ['nullable', 'image', 'mimes:jpeg,png,jpg,pdf,webp', 'max:5120'],
        ]);

        $expense = Expense::create([
            'user_id' => $request->user()->id,
            'house_id' => $validated['house_id'] ?? null,
            'category' => $validated['category'],
            'amount' => $validated['amount'],
            'description' => $validated['description'] ?? null,
            'expense_date' => $validated['expense_date'],
        ]);

        if ($request->hasFile('receipt')) {
            $expense->update([
                'receipt_path' => FileUploadService::file($request->file('receipt'), 'expenses'),
            ]);
        }

        AuditService::log('created', $expense, ['amount' => $expense->amount]);

        return response()->json([
            'message' => 'Dépense enregistrée.',
            'expense' => new ExpenseResource($expense->load('house')),
        ], 201);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('update', $expense);

        $validated = $request->validate([
            'house_id' => ['nullable', 'exists:houses,id'],
            'category' => ['sometimes', 'in:reparation,eau,electricite,entretien,securite,autre'],
            'amount' => ['sometimes', 'numeric', 'gt:0'],
            'description' => ['nullable', 'string', 'max:2000'],
            'expense_date' => ['sometimes', 'date'],
            'receipt' => ['nullable', 'image', 'mimes:jpeg,png,jpg,pdf,webp', 'max:5120'],
        ]);

        $expense->update($request->only(['house_id', 'category', 'amount', 'description', 'expense_date']));

        if ($request->hasFile('receipt')) {
            $expense->update([
                'receipt_path' => FileUploadService::file($request->file('receipt'), 'expenses'),
            ]);
        }

        AuditService::log('updated', $expense, $validated);

        return response()->json([
            'message' => 'Dépense mise à jour.',
            'expense' => new ExpenseResource($expense->load('house')),
        ]);
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $this->authorize('delete', $expense);

        $expense->delete();

        AuditService::log('deleted', null, ['expense' => $expense->id]);

        return response()->json(['message' => 'Dépense supprimée.']);
    }
}
