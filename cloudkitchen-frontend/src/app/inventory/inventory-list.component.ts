// src/app/inventory/inventory-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem } from './inventory.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container my-3">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3 class="mb-0">Inventory</h3>
        <a routerLink="/inventory/new" class="btn btn-success">Add Item</a>
      </div>

      <!-- I allow users to filter items by name, category, or location -->
      <div class="input-group mb-3">
        <input class="form-control"
               placeholder="Filter by name/category/location…"
               [(ngModel)]="filterText">
        <button class="btn btn-outline-secondary" (click)="clearFilter()">Clear</button>
      </div>

      <div *ngIf="items.length === 0" class="text-muted">No items found.</div>

      <!-- I display inventory items in a sortable table -->
      <table *ngIf="items.length" class="table table-sm align-middle">
        <thead>
          <tr>
            <th (click)="sortBy('ingredientName')" role="button">Name</th>
            <th (click)="sortBy('quantity')" role="button">Qty</th>
            <th>Unit</th>
            <th (click)="sortBy('category')" role="button">Category</th>
            <th (click)="sortBy('location')" role="button">Location</th>
            <th (click)="sortBy('expirationDate')" role="button">Expires</th>
            <th class="text-end">Cost</th>
            <th style="width: 160px"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let it of filteredAndSorted()">
            <td>{{ it.ingredientName }}</td>
            <td>{{ it.quantity }}</td>
            <td>{{ it.unit }}</td>
            <td>{{ it.category }}</td>
            <td>{{ it.location }}</td>
            <!-- I highlight items expiring soon or already expired -->
            <td [class.text-danger]="isExpiringSoon(it)" [class.text-muted]="isExpired(it)">
              {{ it.expirationDate }}
            </td>
            <td class="text-end">{{ it.cost | number:'1.2-2' }}</td>
            <td class="text-end">
              <a class="btn btn-sm btn-outline-primary me-2"
                 [routerLink]="['/inventory', it.inventoryId, 'edit']">Edit</a>
              <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(it)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- I show the total cost value at the bottom -->
      <div class="mt-2 fw-semibold">
        Total Value: {{ totalValue() | number:'1.2-2' }}
      </div>
    </div>
  `
})
export class InventoryListComponent implements OnInit {
  // I store all inventory items
  items: InventoryItem[] = [];
  // I track filter text and sorting preferences
  filterText = '';
  sortKey: keyof InventoryItem = 'ingredientName';
  sortAsc = true;

  // I inject my InventoryService to fetch data
  constructor(private api: InventoryService) {}

  ngOnInit(): void {
    this.load(); // I load inventory items on component init
  }

  // I fetch all items from the backend
  load() {
    this.api.getAll().subscribe(arr => this.items = arr);
  }

  // Clears the filter field
  clearFilter() { this.filterText = ''; }

  // I handle filtering and sorting together
  filteredAndSorted() {
    const f = this.filterText.trim().toLowerCase();
    // Filter by name, category, or location
    let out = this.items.filter(i =>
      !f ||
      i.ingredientName.toLowerCase().includes(f) ||
      i.category.toLowerCase().includes(f) ||
      i.location.toLowerCase().includes(f)
    );

    // Sort based on the selected key
    out = out.sort((a, b) => {
      const A = (a[this.sortKey] ?? '') as any;
      const B = (b[this.sortKey] ?? '') as any;
      const cmp = A < B ? -1 : A > B ? 1 : 0;
      return this.sortAsc ? cmp : -cmp;
    });
    return out;
  }

  // I toggle sorting when a column header is clicked
  sortBy(key: keyof InventoryItem) {
    if (this.sortKey === key) this.sortAsc = !this.sortAsc;
    else { this.sortKey = key; this.sortAsc = true; }
  }

  // I check if an item has already expired
  isExpired(it: InventoryItem) {
    return new Date(it.expirationDate) < new Date();
  }

  // I check if an item expires within 3 days
  isExpiringSoon(it: InventoryItem) {
    const d = new Date(it.expirationDate).getTime() - Date.now();
    return d > 0 && d <= 3 * 24 * 60 * 60 * 1000;
  }

  // I calculate total value of all inventory items
  totalValue() {
    return this.items.reduce((acc, it) => acc + (Number(it.cost) || 0), 0);
  }

  // I confirm deletion and call the API to remove an item
  confirmDelete(it: InventoryItem) {
    if (!confirm(`Delete "${it.ingredientName}"?`)) return;
    this.api.remove(it.inventoryId).subscribe({
      next: () => this.load(), // reload after delete
      error: () => alert('Delete failed')
    });
  }
}
