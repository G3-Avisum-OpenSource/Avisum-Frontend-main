import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

export interface ShiftResource extends BaseResource {
  id: number;
  employeeId: number;
  busUnitId: number;
  routeName: string;
  routeOrigin: string;
  routeDestination: string;
  distanceKm: number;
  durationSeconds: number;
  passengerCount: number;
  fareCollected: number;
  status: 'ACTIVE' | 'FINISHED';
  startedAt: string;
  endedAt: string | null;
}

export interface ShiftsResponse extends BaseResponse {
  shifts: ShiftResource[];
}
