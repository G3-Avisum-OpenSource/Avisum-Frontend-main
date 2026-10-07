import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { UnidadBus } from '../domain/model/unidad-bus.entity';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

export interface UnidadResource extends BaseResource {
  id: number;
  plateNumber: string;
  route: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  currentLatitude: number;
  currentLongitude: number;
  currentSpeed: number | null;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
  currentPassengerCount: number | null;
}

export interface UnidadesResponse extends BaseResponse {
  unidades: UnidadResource[];
}

export class UnidadAssembler implements BaseAssembler<UnidadBus, UnidadResource, UnidadesResponse> {
  toEntityFromResource(r: UnidadResource): UnidadBus {
    return new UnidadBus({
      id: r.id,
      placa: r.plateNumber,
      conductor: r.assignedEmployeeName ?? 'Sin asignar',
      ruta: r.route,
      estado: r.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO',
      lat: r.currentLatitude,
      lng: r.currentLongitude,
      pasajeros: r.currentPassengerCount ?? 0,
      velocidad: r.currentSpeed ?? 0,
    });
  }

  toResourceFromEntity(e: UnidadBus): UnidadResource {
    return {
      id: e.id,
      plateNumber: e.placa,
      route: e.ruta,
      status: e.estado === 'ACTIVO' ? 'ACTIVE' : 'INACTIVE',
      currentLatitude: e.lat,
      currentLongitude: e.lng,
      currentSpeed: e.velocidad,
      assignedEmployeeId: null,
      assignedEmployeeName: e.conductor,
      currentPassengerCount: e.pasajeros,
    };
  }

  toEntitiesFromResponse(r: UnidadesResponse): UnidadBus[] {
    return r.unidades.map(u => this.toEntityFromResource(u));
  }
}

export class UnidadesApiEndpoint extends BaseApiEndpoint<UnidadBus, UnidadResource, UnidadesResponse, UnidadAssembler> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.platformProviderApiBaseUrl + environment.platformProviderUnidadesEndpointPath,
      new UnidadAssembler()
    );
  }
}
