import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    footer { background:#1f2937; color:#cbd5e1; }
    a, a:hover { color:#cbd5e1; text-decoration: none; }
  `],
  template: `
  <footer class="py-3 mt-4">
    <div class="container d-flex flex-column flex-lg-row justify-content-between gap-2">
      <div>© 2025 CloudKitchen Pro — FIT2095 Assignment 3</div>
      <div>Built by Karthik Thonnithodi (Student ID: 33905320)</div>
    </div>
  </footer>
  `
})
export class FooterComponent {}
