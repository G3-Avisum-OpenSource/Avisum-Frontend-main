import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { UnidadesApiEndpoint } from './unidades-api-endpoint';
import { UnidadBus } from '../domain/model/unidad-bus.entity';

@Injectable({ providedIn: 'root' })
export class UnidadApi extends BaseApi {
  private readonly unidadesEndpoint: UnidadesApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.unidadesEndpoint = new UnidadesApiEndpoint(http);
  }

  getUnidades(): Observable<UnidadBus[]>              { return this.unidadesEndpoint.getAll(); }
  getUnidadById(id: number): Observable<UnidadBus>    { return this.unidadesEndpoint.getById(id); }
  updateUnidad(u: UnidadBus): Observable<UnidadBus>   { return this.unidadesEndpoint.update(u, u.id); }
}