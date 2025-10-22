import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeService, Recipe } from './recipe.service';

@Component({
  selector: 'app-recipe-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- I show the recipe details once it's loaded -->
    <div class="container my-4" *ngIf="recipe; else loading">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="m-0">{{ recipe.title }}</h3>
        <div class="d-flex gap-2">
          <a class="btn btn-warning" [routerLink]="['/recipes', recipe.recipeId, 'edit']">Edit</a>
          <a class="btn btn-secondary" routerLink="/recipes">Back</a>
        </div>
      </div>

      <div class="row g-3">
        <!-- I show recipe info in a card -->
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <div><strong>Chef:</strong> {{ recipe.chef }}</div>
              <div><strong>Meal:</strong> {{ recipe.mealType }}</div>
              <div><strong>Cuisine:</strong> {{ recipe.cuisineType }}</div>
              <div><strong>Difficulty:</strong> {{ recipe.difficulty }}</div>
              <div><strong>Prep Time:</strong> {{ recipe.prepTime }} mins</div>
              <div><strong>Servings:</strong> {{ recipe.servings }}</div>
              <div class="text-muted small mt-2">ID: {{ recipe.recipeId }}</div>
            </div>
          </div>
        </div>

        <!-- I display ingredients and instructions side by side -->
        <div class="col-md-6">
          <div class="card mb-3">
            <div class="card-header fw-semibold">Ingredients</div>
            <div class="card-body">
              <ul class="mb-0"><li *ngFor="let i of recipe.ingredients">{{ i }}</li></ul>
            </div>
          </div>
          <div class="card">
            <div class="card-header fw-semibold">Instructions</div>
            <div class="card-body">
              <ol class="mb-0"><li *ngFor="let s of recipe.instructions">{{ s }}</li></ol>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- I show a fallback while the recipe is loading -->
    <ng-template #loading>
      <div class="container my-4">
        <div class="alert alert-light">Loading recipe…</div>
      </div>
    </ng-template>
  `
})
export class RecipeViewComponent implements OnInit {
  recipe?: Recipe; // I store the recipe details here

  constructor(private route: ActivatedRoute, private api: RecipeService) {}

  ngOnInit(): void {
    // I extract the recipe ID from the route and fetch its data
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.api.get(id).subscribe(r => this.recipe = r);
  }
}
