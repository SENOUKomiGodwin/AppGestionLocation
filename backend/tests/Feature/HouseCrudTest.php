<?php

namespace Tests\Feature;

use App\Models\House;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HouseCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_gestionnaire_can_create_house(): void
    {
        $user = User::factory()->gestionnaire()->create();

        $this->actingAs($user)->postJson('/api/houses', [
            'name' => 'Villa Test',
            'address' => '12 Rue des Fleurs',
            'city' => 'Abidjan',
            'description' => 'Une belle villa',
        ])->assertStatus(201)
            ->assertJsonPath('house.name', 'Villa Test');

        $this->assertDatabaseHas('houses', ['name' => 'Villa Test']);
    }

    public function test_comptable_cannot_create_house(): void
    {
        $user = User::factory()->comptable()->create();

        $this->actingAs($user)->postJson('/api/houses', [
            'name' => 'Villa Test',
            'address' => '12 Rue des Fleurs',
        ])->assertStatus(403);
    }

    public function test_owner_only_sees_own_houses(): void
    {
        $owner = User::factory()->gestionnaire()->create();
        $other = User::factory()->gestionnaire()->create();

        House::factory()->create(['user_id' => $owner->id, 'name' => 'Ma Maison']);
        House::factory()->create(['user_id' => $other->id, 'name' => 'Autre Maison']);

        $response = $this->actingAs($owner)->getJson('/api/houses');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Ma Maison', $response->json('data.0.name'));
    }

    public function test_super_admin_sees_all_houses(): void
    {
        $admin = User::factory()->superAdmin()->create();
        House::factory()->count(3)->create(['user_id' => User::factory()->create()->id]);

        $this->actingAs($admin)
            ->getJson('/api/houses')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_house_can_be_updated_and_deleted(): void
    {
        $user = User::factory()->gestionnaire()->create();
        $house = House::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->putJson("/api/houses/{$house->id}", ['name' => 'Nouveau Nom'])
            ->assertOk()
            ->assertJsonPath('house.name', 'Nouveau Nom');

        $this->actingAs($user)
            ->deleteJson("/api/houses/{$house->id}")
            ->assertOk();

        $this->assertDatabaseMissing('houses', ['id' => $house->id]);
    }

    public function test_user_cannot_modify_another_users_house(): void
    {
        $owner = User::factory()->gestionnaire()->create();
        $intruder = User::factory()->gestionnaire()->create();
        $house = House::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($intruder)
            ->putJson("/api/houses/{$house->id}", ['name' => 'Vol'])
            ->assertStatus(403);
    }
}
