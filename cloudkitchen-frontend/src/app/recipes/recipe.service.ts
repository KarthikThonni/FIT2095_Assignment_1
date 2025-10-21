// src/app/recipes/recipe.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  recipeId: string;
  userId?: string;
  title: string;
  chef: string;
  ingredients: string[];     // or (string | {item:string; quantity:string})[]
  instructions: string[];
  mealType: MealType;
  cuisineType: string;
  prepTime: number;
  difficulty: Difficulty;
  servings: number;
  createdDate: string;        // YYYY-MM-DD
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private base = '/api/recipes-33905320';

  constructor(private http: HttpClient) {}

  /** Make this tolerant to either `{ ok, recipes }` or raw array responses. */
  getAll(): Observable<Recipe[]> {
    return this.http.get<any>(this.base, { withCredentials: true }).pipe(
      map(res => {
        if (Array.isArray(res)) return res as Recipe[];
        if (res && Array.isArray(res.recipes)) return res.recipes as Recipe[];
        return [];
      })
    );
  }

  get(id: string) {
    return this.http.get<{ ok: boolean; recipe: Recipe }>(`${this.base}/${encodeURIComponent(id)}`, { withCredentials: true })
      .pipe(map(r => r.recipe));
  }

  create(payload: Partial<Recipe>) {
    return this.http.post<{ ok: boolean; recipe: Recipe }>(this.base, payload, { withCredentials: true });
  }

  update(id: string, payload: Partial<Recipe>) {
    return this.http.put<{ ok: boolean; recipe: Recipe }>(`${this.base}/${encodeURIComponent(id)}`, payload, { withCredentials: true });
  }

  remove(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${encodeURIComponent(id)}`, { withCredentials: true });
  }
}
