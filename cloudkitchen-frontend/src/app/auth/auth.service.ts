import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, map, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  isLoggedIn$() {
    return this.loggedIn$.asObservable();
  }

  register(body: { email: string; password: string; fullname: string; role: string; phone: string }) {
    return this.http.post('/api/register-33905320', body, { withCredentials: true, observe: 'response' })
      .pipe(map(() => true), catchError(() => of(false)));
  }

  login(body: { email: string; password: string }) {
    return this.http.post('/api/login-33905320', body, { withCredentials: true, observe: 'response' })
      .pipe(
        tap(() => this.loggedIn$.next(true)),
        map(() => true),
        catchError((_err: HttpErrorResponse) => of(false))
      );
  }

  logout() {
    return this.http.post('/logout-33905320', {}, { withCredentials: true, observe: 'response' })
      .pipe(
        tap(() => this.loggedIn$.next(false)),
        map(() => true),
        catchError(() => of(false))
      );
  }
}
