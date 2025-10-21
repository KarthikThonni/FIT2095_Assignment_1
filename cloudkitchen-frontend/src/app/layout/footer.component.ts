import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-dark text-white text-center py-3 mt-5">
      <div class="container small">
        <div>© 2025 CloudKitchen Pro — FIT2095 Assignment 3</div>
        <div>Built by Karthik Thonnithodi (Student ID: 33905320)</div>
      </div>
    </footer>
  `
})
export class FooterComponent {}