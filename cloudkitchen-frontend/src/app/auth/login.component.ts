// Import core Angular features and needed modules
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';

// Define this class as a standalone component
@Component({
  selector: 'app-login', // component tag name
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // modules it uses
  template: `
  <!-- Login form template -->
  <div class="container py-4" style="max-width: 420px;">
    <h2 class="mb-3">Login</h2>

    <!-- ngForm for validation -->
    <form (ngSubmit)="onSubmit()" #f="ngForm" novalidate>
      <!-- Email input -->
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input class="form-control"
               name="email"
               type="email"
               required
               [(ngModel)]="model.email">
      </div>

      <!-- Password input -->
      <div class="mb-3">
        <label class="form-label">Password</label>
        <input class="form-control"
               name="password"
               type="password"
               required
               [(ngModel)]="model.password">
      </div>

      <!-- Error message display -->
      <div class="text-danger mb-2" *ngIf="error">{{ error }}</div>

      <!-- Submit button -->
      <button class="btn btn-primary w-100" [disabled]="loading || !f.valid">
        {{ loading ? 'Signing in…' : 'Login' }}
      </button>
    </form>

    <!-- Link to register page -->
    <div class="mt-3 text-center">
      <a routerLink="/register">Need an account? Register</a>
    </div>
  </div>
  `
})
export class LoginComponent {
  // Holds email and password input
  model = { email: '', password: '' };

  // Used to show loading spinner/text
  loading = false;

  // Stores error message
  error = '';

  // Inject AuthService, Router, and ActivatedRoute
  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // Called when the form is submitted
  onSubmit() {
    this.error = '';      // reset any previous error
    this.loading = true;  // show loading state

    // Call the AuthService login method
    this.auth.login(this.model).subscribe(ok => {
      this.loading = false;

      if (ok) {
        // Navigate to returnUrl or /home after successful login
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        this.router.navigateByUrl(returnUrl);
      } else {
        // Show invalid login message
        this.error = 'Invalid email or password.';
      }
    }, _ => {
      // Handle network/server error
      this.loading = false;
      this.error = 'Login failed. Please try again.';
    });
  }
}
