import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // I register the app’s routing configuration
    provideRouter(routes),
    // I enable HttpClient globally for API calls
    provideHttpClient(),
    // I import FormsModule globally for template-driven forms
    importProvidersFrom(FormsModule)
  ]
};
