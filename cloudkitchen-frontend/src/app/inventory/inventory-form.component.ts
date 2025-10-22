import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InventoryService, InventoryItem } from './inventory.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container my-4">
      <h2 class="mb-3">{{isEdit ? 'Edit' : 'Add'}} Inventory Item</h2>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="row g-3">

          <!-- Ingredient Name -->
          <div class="col-12">
            <label class="form-label">Ingredient Name</label>
            <input class="form-control" formControlName="ingredientName" />
          </div>

          <!-- Quantity -->
          <div class="col-md-4">
            <label class="form-label">Quantity</label>
            <input type="number" class="form-control"
                   formControlName="quantity" min="0" step="0.01" />
          </div>

          <!-- Unit (SELECT) -->
          <div class="col-md-4">
            <label class="form-label">Unit</label>
            <select class="form-select" formControlName="unit">
              <option *ngFor="let u of units" [value]="u">{{ u }}</option>
            </select>
          </div>

          <!-- Category (SELECT) -->
          <div class="col-md-4">
            <label class="form-label">Category</label>
            <select class="form-select" formControlName="category">
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>

          <!-- Purchase Date -->
          <div class="col-md-6">
            <label class="form-label">Purchase Date</label>
            <input type="date" class="form-control" formControlName="purchaseDate" />
          </div>

          <!-- Expiration Date -->
          <div class="col-md-6">
            <label class="form-label">Expiration Date</label>
            <input type="date" class="form-control" formControlName="expirationDate" />
          </div>

          <!-- Location (SELECT) -->
          <div class="col-md-6">
            <label class="form-label">Location</label>
            <select class="form-select" formControlName="location">
              <option *ngFor="let l of locations" [value]="l">{{ l }}</option>
            </select>
          </div>

          <!-- Cost -->
          <div class="col-md-6">
            <label class="form-label">Cost</label>
            <input type="number" class="form-control"
                   formControlName="cost" min="0" step="0.01" />
          </div>
        </div>

        <div class="mt-4 d-flex gap-2">
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Save</button>
          <a class="btn btn-secondary" routerLink="/inventory">Cancel</a>
        </div>
      </form>
    </div>
  `
})
export class InventoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private svc = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  itemId: string | null = null;

  readonly units = ['pieces','kg','g','liters','ml','cups','tbsp','tsp','dozen'];
  readonly categories = [
    'Vegetables','Fruits','Meat','Dairy','Grains','Spices',
    'Beverages','Frozen','Canned','Other'
  ];
  readonly locations = ['Fridge','Freezer','Pantry','Counter','Cupboard'];

  form = this.fb.group({
    ingredientName: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    unit: [this.units[0], Validators.required],
    category: [this.categories[0], Validators.required],
    purchaseDate: [''],
    expirationDate: [''],
    location: [this.locations[0], Validators.required],
    cost: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.itemId;

    if (this.isEdit && this.itemId) {
      this.svc.get(this.itemId).subscribe(item => {
        // Pre-fill form on edit
        this.form.patchValue({
          ingredientName: item.ingredientName,
          quantity: item.quantity,
          unit: this.ensureInList(item.unit, this.units),
          category: this.ensureInList(item.category, this.categories),
          purchaseDate: (item.purchaseDate || '').slice(0, 10),
          expirationDate: (item.expirationDate || '').slice(0, 10),
          location: this.ensureInList(item.location, this.locations),
          cost: item.cost
        });
      });
    }
  }

  private ensureInList(value: string, list: string[]) {
    return list.includes(value) ? value : list[0];
  }

  save() {
    if (this.form.invalid) return;

    const payload = this.form.value as Partial<InventoryItem>;
    if (this.isEdit && this.itemId) {
      this.svc.update(this.itemId, payload).subscribe(() => {
        this.router.navigateByUrl('/inventory');
      });
    } else {
      this.svc.create(payload).subscribe(() => {
        this.router.navigateByUrl('/inventory');
      });
    }
  }
}
