import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  styles: [`
    .navbar-brand { font-weight: 600; letter-spacing:.2px; }
    .nav-link { font-weight: 500; }
    .nav-link.active { text-decoration: underline; }
    .brand-disabled { pointer-events: none; cursor: default; opacity: .9; }
  `],
  template: `
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">

      <!-- Brand: clickable everywhere EXCEPT on /login or /register -->
      <ng-container *ngIf="!onAuthPage(); else plainBrand">
        <a class="navbar-brand" routerLink="/home">CloudKitchen Pro</a>
      </ng-container>
      <ng-template #plainBrand>
        <span class="navbar-brand brand-disabled">CloudKitchen Pro</span>
      </ng-template>

      <button class="navbar-toggler" type="button"
              data-bs-toggle="collapse" data-bs-target="#mainNav"
              aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="mainNav" class="collapse navbar-collapse">
        <!-- Left: hide nav links on login/register -->
        <ul class="navbar-nav me-auto mb-2 mb-lg-0" *ngIf="!onAuthPage()">
          <li class="nav-item">
            <a routerLink="/home" routerLinkActive="active" class="nav-link">Home</a>
          </li>
          <li class="nav-item">
            <a routerLink="/recipes" routerLinkActive="active" class="nav-link">Recipes</a>
          </li>
          <li class="nav-item">
            <a routerLink="/inventory" routerLinkActive="active" class="nav-link">Inventory</a>
          </li>
        </ul>

        <!-- Right: 
             - Logged in: show only Logout (never show “Guest” text)
             - Logged out: show Login/Register EXCEPT on login/register pages (show nothing there) -->
        <div class="d-flex align-items-center gap-2">
          <ng-container *ngIf="(isLoggedIn | async); else authBtns">
            <button class="btn btn-sm btn-dark" (click)="doLogout()">Logout</button>
          </ng-container>
          <ng-template #authBtns>
            <ng-container *ngIf="!onAuthPage()">
              <a routerLink="/login" class="btn btn-sm btn-light">Login</a>
              <a routerLink="/register" class="btn btn-sm btn-outline-light">Register</a>
            </ng-container>
          </ng-template>
        </div>
      </div>
    </div>
  </nav>
  `
})
export class HeaderComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  isLoggedIn = this.auth.isLoggedIn$();
  private _onAuthPage = signal<boolean>(false);

  constructor() {
    const compute = (url: string) => this._onAuthPage.set(/^\/(login|register)(\/|$)/.test(url));
    compute(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => compute((e as NavigationEnd).urlAfterRedirects));
  }

  onAuthPage() { return this._onAuthPage(); }

  doLogout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
