import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface AlertaResource extends BaseResource {
  id: number; conductorId: number; turnoId: number; tipo: string;
  nivelRiesgo: string; latitud: number; longitud: number;
  timestamp: string; descripcion: string; resuelta: boolean;
}
export interface AlertasResponse extends BaseResponse {
  alertas: AlertaResource[];
}
