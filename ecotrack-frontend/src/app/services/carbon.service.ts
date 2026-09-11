import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CarbonService {

  private apiUrl =
    'https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/carbon';

  constructor(private http: HttpClient) {}

  // Save activity
  saveActivity(activity: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, activity);
  }

  // Get activities
  getActivities(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${email}`);
  }

  // Delete activity
  deleteActivity(id: number, email: string): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/${id}?email=${encodeURIComponent(email)}`,
      { responseType: 'text' }
    );
  }

  // Get personalized recommendation
  getRecommendation(email: string): Observable<string> {
    return this.http.get(
      `${this.apiUrl}/recommendation/${encodeURIComponent(email)}`,
      { responseType: 'text' }
    );
  }
}