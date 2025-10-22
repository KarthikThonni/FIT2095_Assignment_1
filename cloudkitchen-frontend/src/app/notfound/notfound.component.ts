import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-not-found',
  imports: [CommonModule, RouterLink],
  template: `
  <div class="container py-5">
    <h1 class="display-6 mb-3">Page not found</h1>
    <p class="text-muted mb-4">The page you’re looking for doesn’t exist.</p>
    <a routerLink="/home" class="btn btn-primary">Go to Home</a>
  </div>
  `
})
export class NotFoundComponent {}
