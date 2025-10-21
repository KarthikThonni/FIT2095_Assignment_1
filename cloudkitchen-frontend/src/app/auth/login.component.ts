import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="container mt-4" style="max-width:420px">
    <h3 class="mb-3">Login</h3>

    <div *ngIf="error" class="alert alert-danger">Invalid email or password.</div>

    <form (ngSubmit)="onSubmit()" #f="ngForm" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input class="form-control" name="email" [(ngModel)]="email" required type="email">
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input class="form-control" name="password" [(ngModel)]="password" required type="password">
      </div>

      <button class="btn btn-success w-100" [disabled]="f.invalid">Login</button>
    </form>

    <p class="mt-3 text-center">
      Don’t have an account? <a routerLink="/register">Register</a>
    </p>
  </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  error = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.error = false;
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();
    this.auth.login({ email, password }).subscribe(ok => {
      if (ok) this.router.navigateByUrl('/home');
      else this.error = true;
    });
  }

}