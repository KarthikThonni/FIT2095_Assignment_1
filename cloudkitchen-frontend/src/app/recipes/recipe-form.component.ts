import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RecipeService, Recipe } from './recipe.service';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container my-4">
      <h3 class="mb-3">{{ isEdit ? 'Edit Recipe' : 'Add Recipe' }}</h3>

      <form [formGroup]="form" (ngSubmit)="save()" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Title</label>
          <input class="form-control" formControlName="title" required minlength="3" maxlength="100">
        </div>

        <div class="col-md-3">
          <label class="form-label">Meal Type</label>
          <select class="form-select" formControlName="mealType" required>
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option>
          </select>
        </div>

        <div class="col-md-3">
          <label class="form-label">Cuisine Type</label>
          <select class="form-select" formControlName="cuisineType" required>
            <option>Italian</option><option>Asian</option><option>Mexican</option>
            <option>American</option><option>French</option><option>Indian</option>
            <option>Mediterranean</option><option>Other</option>
          </select>
        </div>

        <div class="col-md-3">
          <label class="form-label">Prep Time (mins)</label>
          <input type="number" min="1" max="480" class="form-control" formControlName="prepTime" required>
        </div>

        <div class="col-md-3">
          <label class="form-label">Difficulty</label>
          <select class="form-select" formControlName="difficulty" required>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </div>

        <div class="col-md-3">
          <label class="form-label">Servings</label>
          <input type="number" min="1" max="20" class="form-control" formControlName="servings" required>
        </div>

        <div class="col-md-3">
          <label class="form-label">Created Date (YYYY-MM-DD)</label>
          <input class="form-control" formControlName="createdDate" required>
        </div>

        <div class="col-12">
          <label class="form-label">Ingredients (one per line)</label>
          <textarea class="form-control" rows="5" formControlName="ingredientsText" required></textarea>
        </div>

        <div class="col-12">
          <label class="form-label">Instructions (one step per line)</label>
          <textarea class="form-control" rows="5" formControlName="instructionsText" required></textarea>
        </div>

        <div class="col-12 d-flex gap-2">
          <button class="btn btn-primary" [disabled]="form.invalid">{{ isEdit ? 'Save Changes' : 'Create' }}</button>
          <a class="btn btn-secondary" routerLink="/recipes">Cancel</a>
        </div>
      </form>
    </div>
  `
})
export class RecipeFormComponent implements OnInit {
  isEdit = false;
  recipeId = '';
  form!: FormGroup; // <-- declare first, initialize later

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: RecipeService
  ) {
    // ✅ initialize here (after fb is injected)
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      mealType: ['Dinner', Validators.required],
      cuisineType: ['Other', Validators.required],
      prepTime: [10, [Validators.required, Validators.min(1), Validators.max(480)]],
      difficulty: ['Easy', Validators.required],
      servings: [2, [Validators.required, Validators.min(1), Validators.max(20)]],
      createdDate: [new Date().toISOString().slice(0,10), Validators.required],
      ingredientsText: ['', Validators.required],
      instructionsText: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return; // create mode

    this.isEdit = true;
    this.recipeId = id;

    this.api.get(id).subscribe(r => {
      this.form.patchValue({
        title: r.title,
        mealType: r.mealType,
        cuisineType: r.cuisineType,
        prepTime: r.prepTime,
        difficulty: r.difficulty,
        servings: r.servings,
        createdDate: r.createdDate?.slice(0,10) || '',
        ingredientsText: (r.ingredients || []).join('\n'),
        instructionsText: (r.instructions || []).join('\n'),
      });
    });
  }

  private toLines(s: string): string[] {
    return String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.value;

    const payload = {
      title: v.title!,
      mealType: v.mealType as any,
      cuisineType: v.cuisineType!,
      prepTime: Number(v.prepTime),
      difficulty: v.difficulty as any,
      servings: Number(v.servings),
      createdDate: v.createdDate!,
      ingredients: this.toLines(v.ingredientsText || ''),
      instructions: this.toLines(v.instructionsText || ''),
    };

    const req = this.isEdit
      ? this.api.update(this.recipeId, payload)
      : this.api.create(payload);

    req.subscribe({
      next: () => this.router.navigateByUrl('/recipes'),
      error: err => console.error('Save failed', err),
    });
  }
}
