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

export interface Lead {
  id: number;
  product: number;
  product_name: string;
  buyer: number | null;
  buyer_username: string | null;
  name: string;
  email: string;
  company_size: string;
  budget_range: string;
  urgency_level: number;
  status: 'new' | 'contacted' | 'converted' | 'rejected';
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly API = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  createLead(data: CreateLeadPayload) {
    return this.http.post(`${this.API}/leads/`, data);
  }

  getLeads() {
    return this.http.get<Lead[]>(`${this.API}/leads/`);
  }

  updateLead(id: number, data: Partial<Pick<Lead, 'status'>>) {
    return this.http.patch<Lead>(`${this.API}/leads/${id}/`, data);
  }
}
