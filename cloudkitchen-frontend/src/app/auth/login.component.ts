import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    </div>
  `
})
export class LoginComponent {
  email = ''; password = ''; error = false;
  constructor(private auth: AuthService, private router: Router) {}
  onSubmit() {
    this.error = false;
    this.auth.login({ email: this.email, password: this.password }).subscribe(ok => {
      if (ok) this.router.navigateByUrl('/home'); else this.error = true;
    });
  }
}
