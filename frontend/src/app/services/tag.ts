import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Tag {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly API = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getTags() {
    return this.http.get<Tag[]>(`${this.API}/tags/`);
  }
}
