import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';

/**
 * AuthService handles all login/register/session tasks.
 * It talks to the backend auth endpoints and exposes a reactive login state.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // BehaviourSubject keeps the latest login state so components can subscribe.
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  // Default HTTP options: always send cookies and expect JSON responses.
  private jsonOpts = {
    withCredentials: true,
    observe: 'response' as const,
    headers: { Accept: 'application/json' }
  };

  constructor(private http: HttpClient) {}

  /** Observable stream of login state for navbars etc. */
  isLoggedIn$() {
    return this.loggedIn$.asObservable();
  }

  /**
   * ensureSession(): checks if the backend cookie session is still valid.
   * - Calls `/api/me-33905320`
   * - Emits true if user logged in, false otherwise
   * - Updates BehaviorSubject accordingly
   */
  ensureSession() {
    return this.http.get<{ ok: boolean }>(`/api/me-33905320`, { withCredentials: true }).pipe(
      map(r => !!r?.ok),
      tap(ok => this.loggedIn$.next(ok)), // keep local state in sync
      catchError((_e: HttpErrorResponse) => {
        this.loggedIn$.next(false);
        return of(false);
      })
    );
  }

  /**
   * register(): calls backend register endpoint with form body.
   * Returns true if success, false otherwise.
   */
  register(body: { email: string; password: string; fullname: string; role: string; phone: string }) {
    return this.http.post('/api/register-33905320', body, this.jsonOpts)
      .pipe(map(() => true), catchError(() => of(false)));
  }

  /**
   * login(): posts credentials to backend.
   * On success, marks user as logged in via BehaviorSubject.
   */
  login(body: { email: string; password: string }) {
    return this.http.post('/api/login-33905320', body, this.jsonOpts)
      .pipe(
        tap(() => this.loggedIn$.next(true)),
        map(() => true),
        catchError(() => of(false))
      );
  }

  /**
   * logout(): calls logout endpoint and resets local login state.
   */
  logout() {
    return this.http.post('/logout-33905320', {}, this.jsonOpts)
      .pipe(
        tap(() => this.loggedIn$.next(false)),
        map(() => true),
        catchError(() => of(false))
      );
  }
}
