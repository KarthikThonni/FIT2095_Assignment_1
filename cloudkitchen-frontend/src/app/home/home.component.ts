import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <h4>Welcome, Karthik Thonnithodi (33905320)</h4>
      <p class="text-muted">Home placeholder — dashboard comes next.</p>
    </div>
  `
})
export class HomeComponent {}
