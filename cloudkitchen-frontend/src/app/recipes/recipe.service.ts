// src/app/recipes/recipe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

// I define enums and the structure of a Recipe object
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  recipeId: string;
  userId?: string;
  title: string;
  chef: string;
  ingredients: string[];     // I store ingredients as a string array
  instructions: string[];    // I store step-by-step instructions
  mealType: MealType;
  cuisineType: string;
  prepTime: number;
  difficulty: Difficulty;
  servings: number;
  createdDate: string;
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  // I set my backend API base URL with my student ID
  private base = '/api/recipes-33905320';

  constructor(private http: HttpClient) {}

  // I get all recipes and handle different response shapes
  getAll(): Observable<Recipe[]> {
    return this.http.get<any>(this.base, { withCredentials: true }).pipe(
      map(res => {
        if (Array.isArray(res)) return res as Recipe[];
        if (res && Array.isArray(res.recipes)) return res.recipes as Recipe[];
        return [];
      })
    );
  }

  // I fetch a single recipe by ID
  get(id: string) {
    return this.http
      .get<{ ok: boolean; recipe: Recipe }>(
        `${this.base}/${encodeURIComponent(id)}`,
        { withCredentials: true }
      )
      .pipe(map(r => r.recipe));
  }

  // I create a new recipe on the server
  create(payload: Partial<Recipe>) {
    return this.http.post<{ ok: boolean; recipe: Recipe }>(
      this.base,
      payload,
      { withCredentials: true }
    );
  }

  // I update an existing recipe
  update(id: string, payload: Partial<Recipe>) {
    return this.http.put<{ ok: boolean; recipe: Recipe }>(
      `${this.base}/${encodeURIComponent(id)}`,
      payload,
      { withCredentials: true }
    );
  }

  // I delete a recipe by ID
  remove(id: string) {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/${encodeURIComponent(id)}`,
      { withCredentials: true }
    );
  }
}
