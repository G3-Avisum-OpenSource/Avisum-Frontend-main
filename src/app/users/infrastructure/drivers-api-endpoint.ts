import { HttpClient } from '@angular/common/http';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Driver } from '../domain/model/driver.entity';
import { DriverResource, DriversResponse } from './driver-response';
import { DriverAssembler } from './driver-assembler';
import { environment } from '../../../environments/environment';

export class DriversApiEndpoint extends BaseApiEndpoint<Driver, DriverResource, DriversResponse, DriverAssembler> {
  constructor(http: HttpClient) {
    super(http, environment.platformProviderApiBaseUrl + environment.platformProviderConductoresEndpointPath, new DriverAssembler());
  }
}
