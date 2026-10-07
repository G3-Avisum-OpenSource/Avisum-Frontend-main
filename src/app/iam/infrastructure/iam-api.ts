import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DriversApiEndpoint } from '../../users/infrastructure/drivers-api-endpoint';
import { Driver } from '../../users/domain/model/driver.entity';
import { DriverAssembler } from '../../users/infrastructure/driver-assembler';
import { environment } from '../../../environments/environment';
import { avatarFor } from '../../shared/infrastructure/fake-api/fake-data';
@Injectable({ providedIn: 'root' })
export class IamApi {
  private http = inject(HttpClient);
  private endpoint = new DriversApiEndpoint(this.http);
  private assembler = new DriverAssembler();

  getAll(): Observable<Driver[]>           { return this.endpoint.getAll(); }
  getById(id: number): Observable<Driver>  { return this.endpoint.getById(id); }
  create(c: Driver): Observable<Driver>    { return this.endpoint.create(c); }
  update(c: Driver): Observable<Driver>    { return this.endpoint.update(c, c.id); }

  /** Verifica la identidad de un conductor a partir de su código de empleado. */
  verifyByCode(codigo: string): Observable<Driver | null> {
    const url = `${environment.platformProviderApiBaseUrl}/employees/code/${codigo}`;
    return this.http.get<any>(url).pipe(
      map(response => response ? this.mapEmployeeToDriver(response) : null)
    );
  }

  private mapEmployeeToDriver(employee: any): Driver {
    let nombre: string = employee.firstName ?? '';
    let apellido: string = employee.lastName ?? '';
    if (!nombre) {
      const partes = (employee.fullName ?? '').trim().split(' ');
      nombre = partes.shift() ?? '';
      apellido = partes.join(' ');
    }
    return new Driver({
      id: employee.id,
      nombre,
      apellido,
      dni: employee.dni ?? '',
      codigoEmpleado: employee.employeeCode,
      codigoQr: `QR-${employee.employeeCode}`,
      placa: employee.plateNumber ?? '',
      estado: 'ACTIVO',
      foto: employee.photoUrl ?? avatarFor({ firstName: nombre, lastName: apellido }),
    });
  }

  getMockList(): Driver[] { return []; }
}
