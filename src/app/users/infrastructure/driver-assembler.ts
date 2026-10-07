import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Driver } from '../domain/model/driver.entity';
import { DriverResource, DriversResponse } from './driver-response';

export class DriverAssembler implements BaseAssembler<Driver, DriverResource, DriversResponse> {
  toEntityFromResource(r: DriverResource): Driver {
    return new Driver({
      id: r.id, nombre: r.nombre, apellido: r.apellido, dni: r.dni,
      codigoEmpleado: r.codigoEmpleado, codigoQr: r.codigoQr,
      placa: r.placa, estado: r.estado, foto: r.foto,
    });
  }
  toResourceFromEntity(e: Driver): DriverResource {
    return {
      id: e.id, nombre: e.nombre, apellido: e.apellido, dni: e.dni,
      codigoEmpleado: e.codigoEmpleado, codigoQr: e.codigoQr,
      placa: e.placa, estado: e.estado, foto: e.foto,
    };
  }
  toEntitiesFromResponse(r: DriversResponse): Driver[] {
    return r.conductores.map(c => this.toEntityFromResource(c));
  }
}
