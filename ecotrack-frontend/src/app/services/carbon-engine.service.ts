import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CarbonEngineRequest {
  activityType: string;
  amount: number;
  unit: string;
  email: string | null;
}

export interface CarbonEngineActivity {
  id?: number;
  activityType: string;
  amount: number;
  unit: string;
  emissionFactor: number;
  carbonKg: number;
  email: string;
  calculatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarbonEngineService {

  private apiUrl =
    'https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/carbon-engine';

  constructor(private http: HttpClient) {}

  calculateCarbon(
    request: CarbonEngineRequest
  ): Observable<CarbonEngineActivity> {

    return this.http.post<CarbonEngineActivity>(
      `${this.apiUrl}/calculate`,
      request
    );
  }

  getUserCalculations(
    email: string
  ): Observable<CarbonEngineActivity[]> {

    return this.http.get<CarbonEngineActivity[]>(
      `${this.apiUrl}/user/${email}`
    );
  }
}