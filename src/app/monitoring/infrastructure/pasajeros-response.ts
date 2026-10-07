import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

// Forma REAL que devuelve el backend (PassengerCountResource, en ingles).
export interface PasajeroResource extends BaseResource {
  id: number;
  shiftId: number;
  busUnitId: number;
  totalBoarded: number;
  totalAlighted: number;
  totalAboard: number;
  anomaly: boolean;
  recordedAt: string;
}

export interface PasajerosResponse extends BaseResponse {
  pasajeros: PasajeroResource[];
}
