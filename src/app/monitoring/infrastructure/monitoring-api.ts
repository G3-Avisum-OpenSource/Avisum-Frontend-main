import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { PasajerosApiEndpoint } from './pasajeros-api-endpoint';
import { Pasajero } from '../domain/model/pasajero.entity';

@Injectable({ providedIn: 'root' })
export class MonitoringApi extends BaseApi {
  private http = inject(HttpClient);
  private pasajerosEndpoint = new PasajerosApiEndpoint(this.http);

  getPasajeros(): Observable<Pasajero[]>            { return this.pasajerosEndpoint.getAll(); }
  createPasajero(p: Pasajero): Observable<Pasajero> { return this.pasajerosEndpoint.create(p); }
  updatePasajero(p: Pasajero): Observable<Pasajero> { return this.pasajerosEndpoint.update(p, p.id); }
}
