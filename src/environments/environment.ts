export const environment = {
  production: true,
  // Local: backend corriendo en tu máquina con Maven/IntelliJ (H2 local).
  useFakeApi: true, // Sprint 2: sin backend. Pon false para volver al backend real.
  platformProviderApiBaseUrl: 'http://localhost:8080/api/v1',
  platformProviderConductoresEndpointPath: '/employees',
  platformProviderTurnosEndpointPath: '/shifts',
  platformProviderAlertasEndpointPath: '/alerts',
  platformProviderPasajerosEndpointPath: '/passenger-counts',
  platformProviderUnidadesEndpointPath: '/bus-units',
  platformProviderAdminEndpointPath: '/employees',
  platformProviderDriversEndpointPath: '/drivers',
  platformProviderSensorsEndpointPath: '/sensors',
};
