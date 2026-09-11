import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/auth';

  private _userName = signal<string | null>(localStorage.getItem('email'));

  readonly userName = this._userName.asReadonly();
  readonly isLoggedIn = computed(() => this._userName() != null);

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  saveUser(response: any) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('email', response.email);

    this._userName.set(response.email);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    this._userName.set(null);
  }

  initials(name: string | null): string {
    if (!name) return '';

    return name
      .trim()
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }
}