import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

const PASSWORD_COMPLEXITY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="container mt-4" style="max-width:520px">
    <h3 class="mb-3">Register</h3>

    <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

    <form (ngSubmit)="onSubmit()" #f="ngForm" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input class="form-control" name="email" [(ngModel)]="email" required type="email">
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input class="form-control" name="password" [(ngModel)]="password"
               required type="password" [pattern]="passwordPattern">
        <small class="text-muted">
          8+ chars with upper, lower, number, and special character.
        </small>
      </div>

      <div class="mb-3">
        <label class="form-label">Full name</label>
        <input class="form-control" name="fullname" [(ngModel)]="fullname" required>
      </div>

      <div class="mb-3">
        <label class="form-label">Role</label>
        <select class="form-select" name="role" [(ngModel)]="role" required>
          <option value="chef">Chef</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label">Phone</label>
        <input class="form-control" name="phone" [(ngModel)]="phone" required>
      </div>

      <button class="btn btn-primary w-100" [disabled]="f.invalid">Register</button>
    </form>

    <p class="mt-3 text-center">
      Already have an account? <a routerLink="/login">Login</a>
    </p>
  </div>
  `
})
export class RegisterComponent {
  email = '';
  password = '';
  fullname = '';
  role = 'chef';
  phone = '';
  error = '';
  passwordPattern = PASSWORD_COMPLEXITY.source;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.error = '';
    this.auth.register({
      email: this.email,
      password: this.password,
      fullname: this.fullname,
      role: this.role,
      phone: this.phone
    }).subscribe(ok => {
      if (ok) this.router.navigateByUrl('/login');
      else this.error = 'Registration failed. Please check your details.';
    });
  }
}