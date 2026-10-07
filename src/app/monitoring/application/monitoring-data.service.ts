import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { UnidadBus } from '../domain/model/unidad-bus.entity';
import { Turno } from '../domain/model/turno-historial.entity';
import { UnidadesApiEndpoint } from '../infrastructure/unidades-api-endpoint';
import { ShiftsApiEndpoint } from '../infrastructure/shifts-api-endpoint';

@Injectable({ providedIn: 'root' })
export class MonitoringDataService {
  private http = inject(HttpClient);
  private unidadesApi = new UnidadesApiEndpoint(this.http);
  private shiftsApi = new ShiftsApiEndpoint(this.http);

  getUnidades(): Observable<UnidadBus[]> {
    return this.unidadesApi.getAll();
  }

  getHistorial(): Observable<Turno[]> {
    return this.shiftsApi.getAll();
  }
}
