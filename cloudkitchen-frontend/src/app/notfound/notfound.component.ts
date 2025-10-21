import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-notfound',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mt-5 text-center">
      <h3 class="text-warning">404 Not Found</h3>
      <p>The page you requested doesn’t exist.</p>
      <a routerLink="/home" class="btn btn-secondary">Back to Home</a>
    </div>
  `
})
export class NotFoundComponent {}
