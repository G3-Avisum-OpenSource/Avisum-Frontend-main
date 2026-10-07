import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Turno } from '../domain/model/turno-historial.entity';
import { ShiftResource, ShiftsResponse } from './shifts-response';
import { ShiftAssembler } from './shift-assembler';
import { environment } from '../../../environments/environment';

export class ShiftsApiEndpoint extends BaseApiEndpoint<Turno, ShiftResource, ShiftsResponse, ShiftAssembler> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.platformProviderApiBaseUrl + environment.platformProviderTurnosEndpointPath,
      new ShiftAssembler()
    );
  }

  iniciarTurno(employeeId: number, busUnitId: number, routeOrigin: string, routeDestination: string): Observable<Turno> {
    const body = { employeeId, busUnitId, routeOrigin, routeDestination };
    return this.http.post<ShiftResource>(this.endpointUrl, body).pipe(
      map(r => this.assembler.toEntityFromResource(r))
    );
  }

  finalizarTurno(
    shiftId: number, distanceKm: number, durationSeconds: number,
    passengerCount: number, fareCollected: number
  ): Observable<Turno> {
    const body = { distanceKm, durationSeconds, passengerCount, fareCollected };
    return this.http.patch<ShiftResource>(`${this.endpointUrl}/${shiftId}/end`, body).pipe(
      map(r => this.assembler.toEntityFromResource(r))
    );
  }

  getActiveShiftByBusUnit(busUnitId: number): Observable<Turno> {
    return this.http.get<ShiftResource>(`${this.endpointUrl}/bus-unit/${busUnitId}/active`).pipe(
      map(r => this.assembler.toEntityFromResource(r))
    );
  }

  getHistorialByConductor(employeeId: number): Observable<Turno[]> {
    return this.http.get<ShiftResource[]>(`${this.endpointUrl}/employee/${employeeId}`).pipe(
      map(list => list.map(r => this.assembler.toEntityFromResource(r)))
    );
  }
}
