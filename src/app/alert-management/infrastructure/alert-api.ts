import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AlertasApiEndpoint } from './alertas-api-endpoint';
import { Alerta } from '../domain/model/alert.entity';

@Injectable({ providedIn: 'root' })
export class AlertApi extends BaseApi {
  private http = inject(HttpClient);
  private endpoint = new AlertasApiEndpoint(this.http);

  getAlertas(): Observable<Alerta[]>          { return this.endpoint.getAll(); }
  createAlerta(a: Alerta): Observable<Alerta> { return this.endpoint.create(a); }
  updateAlerta(a: Alerta): Observable<Alerta> { return this.endpoint.update(a, a.id); }
}
