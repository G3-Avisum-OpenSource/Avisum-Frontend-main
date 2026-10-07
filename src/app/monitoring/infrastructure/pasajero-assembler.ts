import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Pasajero } from '../domain/model/pasajero.entity';
import { PasajeroResource, PasajerosResponse } from './pasajeros-response';

export class PasajeroAssembler implements BaseAssembler<Pasajero, PasajeroResource, PasajerosResponse> {
  toEntityFromResource(r: PasajeroResource): Pasajero {
    return new Pasajero({
      id: r.id,
      turnoId: r.shiftId,
      busId: String(r.busUnitId),
      totalAbordaron: r.totalBoarded,
      totalBajaron: r.totalAlighted,
      totalAbordo: r.totalAboard,
      timestamp: new Date(r.recordedAt),
      anomalia: r.anomaly,
    });
  }

  toResourceFromEntity(e: Pasajero): PasajeroResource {
    return {
      id: e.id,
      shiftId: e.turnoId,
      busUnitId: Number(e.busId),
      totalBoarded: e.totalAbordaron,
      totalAlighted: e.totalBajaron,
      totalAboard: e.totalAbordo,
      anomaly: e.anomalia,
      recordedAt: e.timestamp.toISOString(),
    };
  }

  toEntitiesFromResponse(r: PasajerosResponse): Pasajero[] {
    return r.pasajeros.map(p => this.toEntityFromResource(p));
  }
}
