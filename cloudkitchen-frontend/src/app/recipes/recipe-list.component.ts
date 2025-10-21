// src/app/recipes/recipe-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Recipe, RecipeService } from './recipe.service';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="m-0">Recipes</h2>
        <a class="btn btn-success" routerLink="/recipes/new">Add Recipe</a>
      </div>

      <div *ngIf="loading" class="alert alert-info">Loading recipes…</div>
      <div *ngIf="error" class="alert alert-danger">{{error}}</div>
      <div *ngIf="!loading && !error && recipes.length === 0" class="alert alert-warning">
        No recipes found.
      </div>

      <div *ngIf="!loading && !error && recipes.length > 0" class="table-responsive">
        <table class="table table-striped table-bordered align-middle">
          <thead class="table-light">
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Chef</th>
              <th>Meal</th>
              <th>Cuisine</th>
              <th>Difficulty</th>
              <th>Prep (min)</th>
              <th>Servings</th>
              <th style="width:220px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of recipes; trackBy: trackById">
              <td>{{ r.recipeId }}</td>
              <td>{{ r.title }}</td>
              <td>{{ r.chef }}</td>
              <td>{{ r.mealType }}</td>
              <td>{{ r.cuisineType }}</td>
              <td>{{ r.difficulty }}</td>
              <td>{{ r.prepTime }}</td>
              <td>{{ r.servings }}</td>
              <td class="d-flex flex-wrap gap-2">
                <a class="btn btn-sm btn-outline-secondary" [routerLink]="['/recipes', r.recipeId]">View</a>
                <a class="btn btn-sm btn-outline-primary" [routerLink]="['/recipes', r.recipeId, 'edit']">Edit</a>
                <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(r)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RecipeListComponent implements OnInit {
  recipes: Recipe[] = [];
  loading = false;
  error = '';

  constructor(private api: RecipeService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = '';
    this.api.getAll().subscribe({
      next: list => { this.recipes = list; this.loading = false; },
      error: err => { console.error(err); this.error = 'Failed to load recipes.'; this.loading = false; }
    });
  }

  trackById = (_: number, r: Recipe) => r.recipeId;

  confirmDelete(r: Recipe) {
    if (!confirm(`Delete recipe "${r.title}"?`)) return;
    this.api.remove(r.recipeId).subscribe({
      next: () => this.refresh(),
      error: err => { console.error(err); alert('Delete failed'); }
    });
  }
}
