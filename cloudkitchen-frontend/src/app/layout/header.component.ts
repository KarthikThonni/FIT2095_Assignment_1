import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe],
  template: `
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <!-- Brand: becomes non-clickable on auth routes -->
      <ng-container *ngIf="!isAuthRoute(); else brandTextOnly">
        <a class="navbar-brand" routerLink="/home">CloudKitchen Pro</a>
      </ng-container>
      <ng-template #brandTextOnly>
        <span class="navbar-brand">CloudKitchen Pro</span>
      </ng-template>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#topnav">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="topnav">
        <!-- LEFT: nav items (hidden on auth routes) -->
        <ul class="navbar-nav me-auto" *ngIf="!isAuthRoute()">
          <li class="nav-item">
            <a class="nav-link" routerLink="/recipes">Recipes</a>
          </li>
        </ul>

        <!-- RIGHT: auth controls -->
        <div class="d-flex">
          <!-- On auth routes: show nothing clickable -->
          <ng-container *ngIf="isAuthRoute(); else whenNotAuthRoute"></ng-container>

          <ng-template #whenNotAuthRoute>
            <ng-container *ngIf="(auth.isLoggedIn$() | async) === true; else guest">
              <button class="btn btn-sm btn-dark" (click)="doLogout()">Logout</button>
            </ng-container>
            <ng-template #guest>
              <a routerLink="/login" class="btn btn-sm btn-light me-2">Login</a>
              <a routerLink="/register" class="btn btn-sm btn-outline-light">Register</a>
            </ng-template>
          </ng-template>
        </div>
      </div>
    </div>
  </nav>
  `
})
export class HeaderComponent {
  constructor(public auth: AuthService, private router: Router) {}

  isAuthRoute(): boolean {
    const url = this.router.url || '';
    return url.startsWith('/login') || url.startsWith('/register');
  }

  doLogout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
