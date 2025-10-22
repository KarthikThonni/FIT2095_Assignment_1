import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  private jsonOpts = {
    withCredentials: true,
    observe: 'response' as const,
    headers: { Accept: 'application/json' }
  };

  constructor(private http: HttpClient) {}

  isLoggedIn$() {
    return this.loggedIn$.asObservable();
  }

  ensureSession() {
    return this.http.get<{ ok: boolean }>(`/api/me-33905320`, { withCredentials: true }).pipe(
      map(r => !!r?.ok),
      tap(ok => this.loggedIn$.next(ok)),
      catchError((_e: HttpErrorResponse) => {
        this.loggedIn$.next(false);
        return of(false);
      })
    );
  }

  register(body: { email: string; password: string; fullname: string; role: string; phone: string }) {
    return this.http.post('/api/register-33905320', body, this.jsonOpts)
      .pipe(map(() => true), catchError(() => of(false)));
  }

  login(body: { email: string; password: string }) {
    return this.http.post('/api/login-33905320', body, this.jsonOpts)
      .pipe(tap(() => this.loggedIn$.next(true)), map(() => true), catchError(() => of(false)));
  }

  logout() {
    return this.http.post('/logout-33905320', {}, this.jsonOpts)
      .pipe(tap(() => this.loggedIn$.next(false)), map(() => true), catchError(() => of(false)));
  }
}
