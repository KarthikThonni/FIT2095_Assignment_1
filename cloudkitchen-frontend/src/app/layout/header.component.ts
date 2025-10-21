import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <nav class="navbar navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand" routerLink="/home">CloudKitchen Pro</a>

      <div class="d-flex gap-2" *ngIf="(isLoggedIn$ | async) === false; else logged">
        <a routerLink="/login" class="btn btn-sm btn-light">Login</a>
        <a routerLink="/register" class="btn btn-sm btn-outline-light">Register</a>
      </div>

      <ng-template #logged>
        <button class="btn btn-sm btn-dark" (click)="doLogout()">Logout</button>
      </ng-template>
    </div>
  </nav>
  `
})
export class HeaderComponent implements OnInit {
  // Declare only; don't reference `this.auth` here
  isLoggedIn$!: Observable<boolean>;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.auth.isLoggedIn$();
  }

  doLogout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}