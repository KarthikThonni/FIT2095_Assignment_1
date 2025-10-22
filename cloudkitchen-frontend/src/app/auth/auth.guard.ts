import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Route guard: only allow navigation when a valid session exists.
 * If not logged in, redirect to /login and keep the original URL as `returnUrl`.
 */
export const authGuard: CanActivateFn = (route, state) => {
  // lightweight DI in functional guards
  const auth = inject(AuthService);
  const router = inject(Router);

  /**
   * ensureSession() pings /api/me-… and returns Observable<boolean>.
   * - true  -> allow navigation
   * - false -> build a UrlTree to /login?returnUrl=<original>
   * Any error is treated the same as "not logged in".
   */
  return auth.ensureSession().pipe(
    map(ok =>
      ok
        ? true
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })
    ),
    catchError(() =>
      of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }))
    )
  );
};
