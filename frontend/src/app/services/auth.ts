import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  role: 'founder' | 'buyer';
  linkedin_profile?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://127.0.0.1:8000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  register(data: RegisterPayload): Observable<unknown> {
    return this.http.post(`${this.API}/register/`, data);
  }

  login(data: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/token/`, data).pipe(
      tap((response) => {
        this.saveToken(response.access);
        localStorage.setItem('refreshToken', response.refresh);
      }),
    );
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isLoggedIn() {
    return Boolean(this.getToken());
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.router.navigate(['/login']);
  }
}
