// Import required Angular modules and services
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

// Password regex: enforces strong password rules
const PASSWORD_COMPLEXITY = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/;

// Define the registration component
@Component({
  selector: 'app-register',                // HTML tag for this component
  standalone: true,                        // can be used without a parent module
  imports: [CommonModule, FormsModule, RouterLink], // dependencies for forms and routing
  template: `
  <!-- Registration form UI -->
  <div class="container mt-4" style="max-width:520px">
    <h3 class="mb-3">Register</h3>

    <!-- Error alert -->
    <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

    <!-- ngForm handles form validation and submission -->
    <form (ngSubmit)="onSubmit()" #f="ngForm" novalidate>

      <!-- Email input -->
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input class="form-control" name="email" [(ngModel)]="email" required type="email">
      </div>

      <!-- Password input with validation pattern -->
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input class="form-control" name="password" [(ngModel)]="password"
               required type="password" [pattern]="passwordPattern">
        <small class="text-muted">
          8+ chars with upper, lower, number, and special character.
        </small>
      </div>

      <!-- Full name input -->
      <div class="mb-3">
        <label class="form-label">Full name</label>
        <input class="form-control" name="fullname" [(ngModel)]="fullname" required>
      </div>

      <!-- Role dropdown -->
      <div class="mb-3">
        <label class="form-label">Role</label>
        <select class="form-select" name="role" [(ngModel)]="role" required>
          <option value="chef">Chef</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <!-- Phone input -->
      <div class="mb-3">
        <label class="form-label">Phone</label>
        <input class="form-control" name="phone" [(ngModel)]="phone" required>
      </div>

      <!-- Submit button -->
      <button class="btn btn-primary w-100" [disabled]="f.invalid">Register</button>
    </form>

    <!-- Link to login -->
    <p class="mt-3 text-center">
      Already have an account? <a routerLink="/login">Login</a>
    </p>
  </div>
  `
})
export class RegisterComponent {
  // Form field variables bound to inputs
  email = '';
  password = '';
  fullname = '';
  role = 'chef';
  phone = '';
  error = '';

  // Pattern used in the password input for validation
  passwordPattern = PASSWORD_COMPLEXITY.source;

  // Inject AuthService for registration and Router for navigation
  constructor(private auth: AuthService, private router: Router) {}

  // Handle form submission
  onSubmit() {
    this.error = ''; // reset previous error
    this.auth.register({
      email: this.email,
      password: this.password,
      fullname: this.fullname,
      role: this.role,
      phone: this.phone
    }).subscribe(ok => {
      if (ok) this.router.navigateByUrl('/login'); // go to login if success
      else this.error = 'Registration failed. Please check your details.';
    });
  }
}
