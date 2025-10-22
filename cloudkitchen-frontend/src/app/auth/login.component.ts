import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="container py-4" style="max-width: 420px;">
    <h2 class="mb-3">Login</h2>

    <form (ngSubmit)="onSubmit()" #f="ngForm" novalidate>
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input class="form-control"
               name="email"
               type="email"
               required
               [(ngModel)]="model.email">
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input class="form-control"
               name="password"
               type="password"
               required
               [(ngModel)]="model.password">
      </div>

      <div class="text-danger mb-2" *ngIf="error">{{ error }}</div>

      <button class="btn btn-primary w-100" [disabled]="loading || !f.valid">
        {{ loading ? 'Signing in…' : 'Login' }}
      </button>
    </form>

    <div class="mt-3 text-center">
      <a routerLink="/register">Need an account? Register</a>
    </div>
  </div>
  `
})
export class LoginComponent {
  model = { email: '', password: '' };
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onSubmit() {
    this.error = '';
    this.loading = true;

    this.auth.login(this.model).subscribe(ok => {
      this.loading = false;
      if (ok) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        this.router.navigateByUrl(returnUrl);
      } else {
        this.error = 'Invalid email or password.';
      }
    }, _ => {
      this.loading = false;
      this.error = 'Login failed. Please try again.';
    });
  }
}
