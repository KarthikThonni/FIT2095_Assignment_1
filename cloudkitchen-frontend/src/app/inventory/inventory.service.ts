import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

export interface InventoryItem {
  inventoryId: string;
  userId?: string;

  ingredientName: string;
  quantity: number;
  unit: string;
  category: string;

  purchaseDate: string;   
  expirationDate: string; 
  location: string;

  cost: number;           
  createdDate: string;    
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private base = '/api/inventory-33905320';

  constructor(private http: HttpClient) {}

  getAll(): Observable<InventoryItem[]> {
    return this.http.get<any>(this.base, { withCredentials: true }).pipe(
      map(r => {
        if (Array.isArray(r)) return r as InventoryItem[];
        if (Array.isArray(r.items)) return r.items as InventoryItem[];
        if (Array.isArray(r.data)) return r.data as InventoryItem[];
        return [];
      })
    );
  }

  get(id: string) {
    return this.http.get<{ ok: boolean; item: InventoryItem }>(`${this.base}/${encodeURIComponent(id)}`, { withCredentials: true })
      .pipe(map(r => r.item));
  }

  create(payload: Partial<InventoryItem>) {
    return this.http.post<{ ok: boolean; item: InventoryItem }>(this.base, payload, { withCredentials: true });
  }

  update(id: string, payload: Partial<InventoryItem>) {
    return this.http.put<{ ok: boolean; item: InventoryItem }>(`${this.base}/${encodeURIComponent(id)}`, payload, { withCredentials: true });
  }

  remove(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${encodeURIComponent(id)}`, { withCredentials: true });
  }
}
