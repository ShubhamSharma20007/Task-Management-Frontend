import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import environments from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environments.apiURL}/auth`;

  public currentUser = signal<any>(null);
  public isAuthChecked = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  getRole(): string {
    return this.currentUser()?.role || '';
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        this.currentUser.set(res.data.user);
        this.isAuthChecked.set(true);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData).pipe(
      tap((res: any) => {
        this.currentUser.set(res.data.user);
        this.isAuthChecked.set(true);
      })
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      },
    });
  }

  checkAuth(): Observable<any> {
    if (this.isAuthChecked()) {
      return of(this.currentUser());
    }

    return this.http.get(`${this.apiUrl}/me`).pipe(
      tap((res: any) => {
        this.currentUser.set(res.data.user);
        this.isAuthChecked.set(true);
      }),
      catchError(() => {
        this.currentUser.set(null);
        this.isAuthChecked.set(true);
        return of(null);
      })
    );
  }
}
