import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Tag {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  founder: number;
  founder_username: string;
  founder_linkedin_profile?: string | null;
  name: string;
  description: string;
  problem_statement: string;
  website_url?: string | null;
  video_url?: string | null;
  tags: Tag[];
  created_at: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  problem_statement: string;
  website_url?: string;
  video_url?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getProducts(query?: string) {
    const q = (query || '').trim();
    const url = q ? `${this.API}/products/?q=${encodeURIComponent(q)}` : `${this.API}/products/`;
    return this.http.get<Product[]>(url);
  }

  createProduct(data: CreateProductPayload) {
    return this.http.post<Product>(`${this.API}/products/`, data);
  }
}
