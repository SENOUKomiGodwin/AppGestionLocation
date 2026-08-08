<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Logements contenus dans une maison.
     */
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('house_id')->constrained()->cascadeOnDelete();
            $table->string('number');
            $table->string('type')->default('appartement'); // appartement | maison | studio | commercial | bureau
            $table->unsignedTinyInteger('bedrooms')->default(0);
            $table->decimal('surface', 10, 2)->default(0); // m²
            $table->decimal('rent_amount', 12, 2)->default(0);
            $table->decimal('deposit', 12, 2)->default(0); // caution
            $table->enum('status', ['libre', 'occupe', 'renovation'])->default('libre');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
