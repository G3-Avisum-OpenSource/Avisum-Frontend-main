import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Alerta } from '../domain/model/alert.entity';
import { AlertaResource, AlertasResponse } from './alerta-response';

export class AlertaAssembler implements BaseAssembler<Alerta, AlertaResource, AlertasResponse> {
  toEntityFromResource(r: AlertaResource): Alerta {
    return new Alerta({
      id: r.id, conductorId: r.conductorId, turnoId: r.turnoId,
      latitud: r.latitud, longitud: r.longitud,
      timestamp: new Date(r.timestamp),
      estadoCentral: r.nivelRiesgo, audioRemoto: 'GRABANDO',
      resuelta: r.resuelta,
    });
  }
  toResourceFromEntity(e: Alerta): AlertaResource {
    return {
      id: e.id, conductorId: e.conductorId, turnoId: e.turnoId,
      tipo: 'PANICO', nivelRiesgo: e.estadoCentral,
      latitud: e.latitud, longitud: e.longitud,
      timestamp: e.timestamp.toISOString(),
      descripcion: '', resuelta: e.resuelta,
    };
  }
  toEntitiesFromResponse(r: AlertasResponse): Alerta[] {
    return r.alertas.map(a => this.toEntityFromResource(a));
  }
}
