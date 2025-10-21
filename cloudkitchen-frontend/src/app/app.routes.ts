import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { RecipeListComponent } from './recipes/recipe-list.component';
import { RecipeFormComponent } from './recipes/recipe-form.component';
import { RecipeViewComponent } from './recipes/recipe-view.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  // 👇 Default route: start at login page
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Authentication
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Dashboard
  { path: 'home', component: HomeComponent },

  // Recipes CRUD
  { path: 'recipes', component: RecipeListComponent },
  { path: 'recipes/new', component: RecipeFormComponent },
  { path: 'recipes/:id', component: RecipeViewComponent },
  { path: 'recipes/:id/edit', component: RecipeFormComponent },

  // Fallback for unknown routes
  { path: '**', redirectTo: 'login' }
];
