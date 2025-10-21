import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<{ totalUsers: number; recipeCount: number; inventoryCount: number }> {
    return this.http
      .get<{ ok: boolean; totalUsers: number; recipeCount: number; inventoryCount: number }>(
        '/api/stats-33905320',
        { withCredentials: true }
      )
      .pipe(
        map(r => ({ totalUsers: r.totalUsers, recipeCount: r.recipeCount, inventoryCount: r.inventoryCount })),
        catchError(() => of({ totalUsers: 0, recipeCount: 0, inventoryCount: 0 }))
      );
  }
}
