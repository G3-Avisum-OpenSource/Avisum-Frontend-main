import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Turno } from '../domain/model/turno-historial.entity';
import { ShiftResource, ShiftsResponse } from './shifts-response';

export class ShiftAssembler implements BaseAssembler<Turno, ShiftResource, ShiftsResponse> {
  toEntityFromResource(r: ShiftResource): Turno {
    return new Turno({
      id: r.id,
      conductorId: r.employeeId,
      busId: String(r.busUnitId),
      rutaNombre: r.routeName,
      rutaOrigen: r.routeOrigin,
      rutaDestino: r.routeDestination,
      distanciaKm: r.distanceKm,
      tiempoSegundos: r.durationSeconds,
      pasajeros: r.passengerCount,
      recaudacion: r.fareCollected,
      estado: r.status === 'ACTIVE' ? 'ACTIVO' : 'FINALIZADO',
      fechaInicio: new Date(r.startedAt),
      fechaFin: r.endedAt ? new Date(r.endedAt) : null,
    });
  }

  toResourceFromEntity(entity: Turno): ShiftResource {
    return {
      id: entity.id,
      employeeId: entity.conductorId,
      busUnitId: Number(entity.busId),
      routeName: entity.rutaNombre,
      routeOrigin: entity.rutaOrigen,
      routeDestination: entity.rutaDestino,
      distanceKm: entity.distanciaKm,
      durationSeconds: entity.tiempoSegundos,
      passengerCount: entity.pasajeros,
      fareCollected: entity.recaudacion,
      status: entity.estado === 'ACTIVO' ? 'ACTIVE' : 'FINISHED',
      startedAt: entity.fechaInicio.toISOString(),
      endedAt: entity.fechaFin ? entity.fechaFin.toISOString() : null,
    };
  }

  toEntitiesFromResponse(response: ShiftsResponse): Turno[] {
    return response.shifts.map(r => this.toEntityFromResource(r));
  }
}
