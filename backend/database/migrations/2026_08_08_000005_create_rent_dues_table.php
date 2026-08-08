<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Échéances de loyer générées automatiquement chaque mois.
     */
    public function up(): void
    {
        Schema::create('rent_dues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('period', 7); // YYYY-MM
            $table->date('due_date');
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'partial', 'late'])->default('pending');
            $table->timestamp('payment_date')->nullable();
            $table->timestamps();

            // Une seule échéance par contrat et par mois
            $table->unique(['contract_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rent_dues');
    }
};
