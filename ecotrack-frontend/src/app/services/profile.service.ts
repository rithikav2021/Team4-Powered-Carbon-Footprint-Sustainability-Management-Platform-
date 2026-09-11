import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private http = inject(HttpClient);

  private apiUrl =
    'https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/profile';

  // Get profile
  getProfile(email: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/${encodeURIComponent(email)}`
    );
  }

  // Update profile
  updateProfile(
    email: string,
    fullName: string,
    location: string
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/${encodeURIComponent(email)}?fullName=${encodeURIComponent(fullName)}&location=${encodeURIComponent(location)}`,
      {}
    );
  }
}