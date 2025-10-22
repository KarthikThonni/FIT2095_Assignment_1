import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';

import { RecipeListComponent } from './recipes/recipe-list.component';
import { RecipeFormComponent } from './recipes/recipe-form.component';
import { RecipeViewComponent } from './recipes/recipe-view.component';

import { InventoryListComponent } from './inventory/inventory-list.component';
import { InventoryFormComponent } from './inventory/inventory-form.component';

import { HomeComponent } from './home/home.component';
import { authGuard } from './auth/auth.guard';
import { NotFoundComponent } from './notfound/notfound.component';

// I define all main application routes here
export const routes: Routes = [
  // Redirect empty path to login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public routes (accessible without login)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Protected routes guarded by authGuard
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },

  // Recipe module routes
  { path: 'recipes', component: RecipeListComponent, canActivate: [authGuard] },
  { path: 'recipes/new', component: RecipeFormComponent, canActivate: [authGuard] },
  { path: 'recipes/:id', component: RecipeViewComponent, canActivate: [authGuard] },
  { path: 'recipes/:id/edit', component: RecipeFormComponent, canActivate: [authGuard] },

  // Inventory module routes
  { path: 'inventory', component: InventoryListComponent, canActivate: [authGuard] },
  { path: 'inventory/new', component: InventoryFormComponent, canActivate: [authGuard] },
  { path: 'inventory/:id/edit', component: InventoryFormComponent, canActivate: [authGuard] },

  // Fallback for any unknown routes
  { path: '**', component: NotFoundComponent }
];
