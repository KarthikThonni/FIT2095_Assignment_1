import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <nav class="navbar navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand" routerLink="/home">CloudKitchen Pro</a>
      <div class="d-flex gap-2">
        <a routerLink="/login" class="btn btn-sm btn-light">Login</a>
        <a routerLink="/register" class="btn btn-sm btn-outline-light">Register</a>
        <button class="btn btn-sm btn-dark" (click)="logout()">Logout</button>
      </div>
    </div>
  </nav>
  `
})
export class HeaderComponent {
  constructor(private auth: AuthService, private router: Router) {}
  logout() {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/login'));
  }
}
