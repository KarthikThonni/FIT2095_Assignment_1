import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, Observable } from 'rxjs';

// I make this service injectable so I can use it anywhere in the app
@Injectable({ providedIn: 'root' })
export class DashboardService {
  // I inject HttpClient to make API requests
  constructor(private http: HttpClient) {}

  // This method fetches overall stats from my backend API
  getStats(): Observable<{ totalUsers: number; recipeCount: number; inventoryCount: number }> {
    return this.http
      // I call my stats endpoint and include credentials for session-based auth
      .get<{ ok: boolean; totalUsers: number; recipeCount: number; inventoryCount: number }>(
        '/api/stats-33905320',
        { withCredentials: true }
      )
      .pipe(
        // I extract only the stats I need from the response
        map(r => ({
          totalUsers: r.totalUsers,
          recipeCount: r.recipeCount,
          inventoryCount: r.inventoryCount
        })),
        // If the API call fails, I handle it gracefully by returning zeros
        catchError(() => of({ totalUsers: 0, recipeCount: 0, inventoryCount: 0 }))
      );
  }
}
