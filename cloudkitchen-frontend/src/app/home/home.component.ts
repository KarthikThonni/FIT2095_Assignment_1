// src/app/home/home.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, startWith, switchMap } from 'rxjs';

// I define data types for stats and user info
type Stats = { totalUsers: number; recipeCount: number; inventoryCount: number };
type Me = { ok: boolean; user?: { fullname: string; email: string; role: string } };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    .section-title { background:#e9ecef; border:1px solid #dee2e6; padding:.6rem .8rem; }
    .card-soft     { border:1px solid #dee2e6; }
    .stat-box .h4  { margin:0; }
  `],
  template: `
    <div class="container my-3">
      <div class="section-title mb-3 fw-semibold">Task 2: Dashboard & Homepage</div>

      <div class="row g-3 align-items-stretch mb-3">
        <div class="col-md-8">
          <div class="card card-soft h-100">
            <div class="card-body">
              <div class="fw-semibold mb-2">Student Information</div>
              <div class="d-flex">
                <div class="me-4">
                  <div><span class="text-muted">Name:</span> Karthik Thonnithodi</div>
                  <div><span class="text-muted">Student ID:</span> 33905320</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- I greet the logged-in user -->
      <div class="card card-soft mb-3">
        <div class="card-body">
          <div class="fw-semibold mb-2">Welcome, {{me?.user?.fullname || 'Guest'}}!</div>
          <div class="text-muted small" *ngIf="me?.user">
            Role: {{me?.user?.role}} &nbsp;•&nbsp; Email: {{me?.user?.email}}
          </div>
        </div>
      </div>

      <!-- I show live stats -->
      <div class="mb-2 fw-semibold">Real-time Statistics</div>
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="card card-soft stat-box">
            <div class="card-body">
              <div class="text-muted small">Total Users</div>
              <div class="h4">{{stats.totalUsers}}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card card-soft stat-box">
            <div class="card-body">
              <div class="text-muted small">Total Recipes</div>
              <div class="h4">{{stats.recipeCount}}</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card card-soft stat-box">
            <div class="card-body">
              <div class="text-muted small">Inventory Items</div>
              <div class="h4">{{stats.inventoryCount}}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick navigation buttons -->
      <div class="fw-semibold mb-2">Quick Actions</div>
      <div class="d-flex flex-wrap gap-2 mb-4">
        <a class="btn btn-primary" routerLink="/recipes">View Recipes</a>
        <a class="btn btn-outline-primary" routerLink="/recipes/new">Add Recipe</a>
        <a class="btn btn-success" routerLink="/inventory">View Inventory</a>
        <a class="btn btn-outline-success" routerLink="/inventory/new">Add Inventory</a>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  // I store dashboard stats and logged-in user info
  stats: Stats = { totalUsers: 0, recipeCount: 0, inventoryCount: 0 };
  me: Me | null = null;

  // I keep the subscription reference so I can clean up later
  sub?: Subscription;

  // I inject the dashboard service and HttpClient
  constructor(private dash: DashboardService, private http: HttpClient) {}

  ngOnInit(): void {
    // I fetch the logged-in user info from /api/me endpoint
    this.http.get<Me>('/api/me-33905320', { withCredentials: true })
      .subscribe(v => this.me = v, () => this.me = null);

    // I poll the stats every 30 seconds using RxJS interval
    this.sub = interval(30000)
      .pipe(
        startWith(0), // I trigger it immediately once on load
        switchMap(() => this.dash.getStats()) // I call the service each interval
      )
      .subscribe(s => this.stats = s); // I update the stats display
  }

  ngOnDestroy(): void {
    // I unsubscribe to prevent memory leaks
    this.sub?.unsubscribe();
  }
}
