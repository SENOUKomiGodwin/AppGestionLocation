<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Contrats de bail liant un locataire à un logement.
     * Un logement ne peut avoir qu'un seul contrat actif.
     */
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedSmallInteger('duration_months')->default(12);
            $table->decimal('monthly_rent', 12, 2)->default(0);
            $table->decimal('deposit', 12, 2)->default(0);
            $table->unsignedTinyInteger('billing_day')->default(1); // jour d'échéance
            $table->enum('status', ['active', 'expire', 'resilie', 'renouvele'])->default('active');
            $table->string('pdf_path')->nullable();
            // Référence au contrat d'origine lors d'un renouvellement (historique)
            $table->foreignId('renewal_of_id')->nullable()->constrained('contracts')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
