import { Routes } from '@angular/router';
import { adminGuard, conductorGuard } from './iam/application/role.guards';

// Shells compartidos (persisten entre rutas de su área)
const conductorLayout = () =>
  import('./shared/presentation/components/conductor-layout/conductor-layout').then(
    (m) => m.ConductorLayout,
  );
const adminLayout = () =>
  import('./shared/presentation/components/admin-layout/admin-layout').then((m) => m.AdminLayout);

// IAM
const login = () => import('./iam/presentation/views/login/login').then((m) => m.Login);
const adminLogin = () =>
  import('./iam/presentation/views/admin-login/admin-login').then((m) => m.AdminLogin);
const accessAuthorized = () =>
  import('./iam/presentation/views/access-authorized/access-authorized').then(
    (m) => m.AccessAuthorized,
  );

// Camera
const qrScanner = () =>
  import('./camera/presentation/views/qr-scanner/qr-scanner').then((m) => m.QrScanner);

// Alert management
const panicAlert = () =>
  import('./alert-management/presentation/views/panic-alert/panic-alert').then((m) => m.PanicAlert);
const alertLogs = () =>
  import('./alert-management/presentation/views/alert-logs/alert-logs').then((m) => m.AlertLogs);
const notifications = () =>
  import('./alert-management/presentation/views/notifications/notifications').then(
    (m) => m.Notifications,
  );

// Monitoring (fleet + turno del conductor)
const driverDashboard = () =>
  import('./monitoring/presentation/views/driver-dashboard/driver-dashboard').then(
    (m) => m.DriverDashboard,
  );
const viewMap = () =>
  import('./monitoring/presentation/views/view-map/view-map').then((m) => m.ViewMap);
const serviceSummary = () =>
  import('./monitoring/presentation/views/service-summary/service-summary').then(
    (m) => m.ServiceSummary,
  );
const passengerCount = () =>
  import('./monitoring/presentation/views/passenger-count/passenger-count').then(
    (m) => m.PassengerCount,
  );
const controlCenter = () =>
  import('./monitoring/presentation/views/dashboard/dashboard').then((m) => m.Dashboard);
const unitAssignment = () =>
  import('./monitoring/presentation/views/unit-assignment/unit-assignment').then(
    (m) => m.UnitAssignment,
  );
const shiftHistory = () =>
  import('./monitoring/presentation/views/shift-history/shift-history').then((m) => m.ShiftHistory);
const impactNumbers = () =>
  import('./monitoring/presentation/views/impact-numbers/impact-numbers').then(
    (m) => m.ImpactNumbers,
  );

// Users
const driverManagement = () =>
  import('./users/presentation/views/driver-management/driver-management').then(
    (m) => m.DriverManagement,
  );

// Profile
const driverProfile = () =>
  import('./profile/presentation/views/driver-profile/driver-profile').then((m) => m.DriverProfile);

// Shared
const apiConsole = () =>
  import('./shared/presentation/views/api-console/api-console').then((m) => m.ApiConsole);
const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const baseTitle = 'Avisum';

export const routes: Routes = [
  // ---------- CONDUCTOR ----------
  // Públicas: entrada del conductor
  { path: 'conductor/login', loadComponent: login, title: `${baseTitle} - Conductor` },
  { path: 'conductor/qr-scanner', loadComponent: qrScanner, title: `${baseTitle} - Conductor` },

  // Requieren sesión de conductor
  {
    path: 'conductor/access-authorized',
    canActivate: [conductorGuard],
    loadComponent: accessAuthorized,
    title: `${baseTitle} - Conductor`,
  },
  {
    path: 'conductor/panic-alert',
    canActivate: [conductorGuard],
    loadComponent: panicAlert,
    title: `${baseTitle} - Conductor`,
  },
  {
    path: 'conductor',
    canActivate: [conductorGuard],
    loadComponent: conductorLayout,
    children: [
      { path: 'dashboard', loadComponent: driverDashboard },
      { path: 'view-map', loadComponent: viewMap },
      { path: 'service-summary', loadComponent: serviceSummary },
      { path: 'passengers', loadComponent: passengerCount },
      { path: 'alert-logs', loadComponent: alertLogs },
      { path: 'profile', loadComponent: driverProfile },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ---------- ADMINISTRADOR ----------
  // Pública: entrada del administrador (debe ir antes del grupo 'admin')
  { path: 'admin/login', loadComponent: adminLogin, title: `${baseTitle} - Administrador` },

  // Requieren sesión de administrador
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: adminLayout,
    children: [
      { path: 'control-center', loadComponent: controlCenter },
      { path: 'drivers', loadComponent: driverManagement },
      { path: 'units', loadComponent: unitAssignment },
      { path: 'notifications', loadComponent: notifications },
      { path: 'shifts', loadComponent: shiftHistory },
      { path: 'impact', loadComponent: impactNumbers },
      { path: 'api-console', loadComponent: apiConsole },
      { path: '', redirectTo: 'control-center', pathMatch: 'full' },
    ],
  },

  { path: '', redirectTo: '/conductor/login', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `${baseTitle} - Not Found` },
];
