import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Goal } from '../models/goal.model';

@Injectable({
  providedIn: 'root'
})
export class GoalService {

  private apiUrl =
    'https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/goals';

  constructor(private http: HttpClient) {}

  // Save Goal
  saveGoal(goal: Goal): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/add`,
      goal
    );
  }

  // Update Goal Progress
  updateProgress(id: number, currentKg: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/progress/${id}?currentKg=${currentKg}`,
      {}
    );
  }

  // Get Logged-in User Goals
  getGoals(email: string): Observable<Goal[]> {
    return this.http.get<Goal[]>(
      `${this.apiUrl}/user/${email}`
    );
  }

  // Delete Goal
  deleteGoal(id: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/delete/${id}`,
      {
        responseType: 'text'
      }
    );
  }

}