import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  // Use text response to avoid JSON parse errors when backend redirects/render HTML
  private optsText = {
    withCredentials: true,
    observe: 'response' as const,
    responseType: 'text' as 'json',     // <-- key change
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
  };

  constructor(private http: HttpClient) {}

  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  register(body: { email: string; password: string; fullname: string; role: string; phone: string }): Observable<boolean> {
    return this.http.post('/api/register-33905320', body, this.optsText).pipe(
      tap((resp: HttpResponse<any>) => console.log('REGISTER RESP:', resp.status)),
      map((resp: HttpResponse<any>) => resp.status >= 200 && resp.status < 400),
      catchError((err: HttpErrorResponse) => {
        console.error('REGISTER ERROR:', err.status, err.message);
        return of(false);
      })
    );
  }

  login(body: { email: string; password: string }): Observable<boolean> {
    return this.http.post('/api/login-33905320', body, this.optsText).pipe(
      tap((resp: HttpResponse<any>) => console.log('LOGIN RESP:', resp.status)),
      map((resp: HttpResponse<any>) => {
        const ok = resp.status >= 200 && resp.status < 400;
        if (ok) this.loggedIn$.next(true);
        return ok;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('LOGIN ERROR:', err.status, err.message);
        return of(false);
      })
    );
  }

  logout(): Observable<boolean> {
    return this.http.post('/logout-33905320', {}, this.optsText).pipe(
      tap((resp: HttpResponse<any>) => console.log('LOGOUT RESP:', resp.status)),
      map((resp: HttpResponse<any>) => {
        const ok = resp.status >= 200 && resp.status < 400;
        if (ok) this.loggedIn$.next(false);
        return ok;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('LOGOUT ERROR:', err.status, err.message);
        return of(false);
      })
    );
  }

  check() {
    // asks backend if cookie/session is valid
    return this.http.get('/api/me-33905320', this.optsText).pipe(
      map((resp: any) => {
        const ok = resp.status >= 200 && resp.status < 300;
        this.loggedIn$.next(ok);
        return ok;
      }),
      catchError(() => {
        this.loggedIn$.next(false);
        return of(false);
      })
    );
  }

}