import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface DriverResource extends BaseResource {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  codigoEmpleado: string;
  codigoQr: string;
  placa: string;
  estado: string;
  foto: string;
}

export interface DriversResponse extends BaseResponse {
  conductores: DriverResource[];
}
