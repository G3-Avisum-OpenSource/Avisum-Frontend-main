export const environment = {
  production: false,
  // La API falsa corre con json-server (npm run server) en el puerto 3000
  useFakeApi: false,
  platformProviderApiBaseUrl: 'http://localhost:3000/api/v1',
  platformProviderConductoresEndpointPath: '/employees',
  platformProviderTurnosEndpointPath: '/shifts',
  platformProviderAlertasEndpointPath: '/alerts',
  platformProviderPasajerosEndpointPath: '/passenger-counts',
  platformProviderUnidadesEndpointPath: '/bus-units',
  platformProviderAdminEndpointPath: '/employees',
  platformProviderDriversEndpointPath: '/drivers',
  platformProviderSensorsEndpointPath: '/sensors',
};
