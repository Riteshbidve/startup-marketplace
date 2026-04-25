import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface CreateLeadPayload {
  product: number;
  name: string;
  email: string;
  company_size: string;
  budget_range: string;
  urgency_level: number;
}

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly API = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  createLead(data: CreateLeadPayload) {
    return this.http.post(`${this.API}/leads/`, data);
  }
}
