import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, isDevMode } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideServiceWorker } from '@angular/service-worker';

// I bootstrap the standalone Angular app with its main component and global providers
bootstrapApplication(AppComponent, {
  providers: [
    // I set up routing with my route definitions
    provideRouter(routes),

    // I enable HttpClient for API requests
    provideHttpClient(),

    // I import both template-driven and reactive forms support
    importProvidersFrom(FormsModule, ReactiveFormsModule),

    // I register a service worker for PWA support (only active in production)
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
    }),
  ]
});
