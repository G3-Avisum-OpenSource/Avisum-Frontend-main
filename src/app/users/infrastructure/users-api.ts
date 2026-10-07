import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { DriversApiEndpoint } from './drivers-api-endpoint';
import { Driver } from '../domain/model/driver.entity';

@Injectable({ providedIn: 'root' })
export class UsersApi extends BaseApi {
  private http = inject(HttpClient);
  private endpoint = new DriversApiEndpoint(this.http);

  getAll(): Observable<Driver[]>            { return this.endpoint.getAll(); }
  getById(id: number): Observable<Driver>   { return this.endpoint.getById(id); }
  create(d: Driver): Observable<Driver>     { return this.endpoint.create(d); }
  update(d: Driver): Observable<Driver>     { return this.endpoint.update(d, d.id); }
  delete(id: number): Observable<void>      { return this.endpoint.delete(id); }
}
