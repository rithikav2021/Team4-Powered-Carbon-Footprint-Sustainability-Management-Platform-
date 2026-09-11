import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private http = inject(HttpClient);

  private apiUrl =
    'https://team4-powered-carbon-footprint-sustainability-ma-production.up.railway.app/api/chat';

  sendMessage(message: string): Observable<ChatResponse> {

    const email = localStorage.getItem('email');

    return this.http.post<ChatResponse>(
      this.apiUrl,
      {
        email: email,
        message: message
      }
    );
  }
}