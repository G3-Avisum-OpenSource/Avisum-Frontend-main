import { TEAM_MEMBERS } from './fake-data';

export type Rec = Record<string, any>;

/** La "base de datos" del modo sin servidor: tiene la misma forma que server/db.json. */
export interface FakeDb {
  employees: Rec[];
  'bus-units': Rec[];
  alerts: Rec[];
  shifts: Rec[];
  drivers: Rec[];
  sensors: Rec[];
  'passenger-counts': Rec[];
  meta: { lastEmployeeId: number; lastUnitId: number };
}

export type Collection = Exclude<keyof FakeDb, 'meta'>;

export const COLLECTIONS: Collection[] = [
  'employees',
  'bus-units',
  'alerts',
  'shifts',
  'drivers',
  'sensors',
  'passenger-counts',
];

const KEY = 'avisum.fakedb.v2';

/** Datos iniciales: los 5 integrantes del equipo con sus unidades, y 4 turnos de ejemplo. */
function seed(): FakeDb {
  const HOUR = 3600 * 1000;
  const muestras = [
    { m: 0, haceHoras: 30, seg: 12300, km: 14.2, pax: 96, fare: 182.5 },
    { m: 1, haceHoras: 28, seg: 10800, km: 11.8, pax: 74, fare: 139.0 },
    { m: 2, haceHoras: 8, seg: 9000, km: 9.6, pax: 58, fare: 104.5 },
    { m: 3, haceHoras: 6, seg: 13200, km: 15.3, pax: 102, fare: 198.0 },
  ];
  return {
    employees: TEAM_MEMBERS.map((t) => ({
      id: t.id,
      employeeCode: t.employeeCode,
      firstName: t.firstName,
      lastName: t.lastName,
      fullName: t.fullName,
      dni: t.dni,
      plateNumber: t.plateNumber,
      status: 'ACTIVE',
    })),
    'bus-units': TEAM_MEMBERS.map((t) => ({
      id: t.id,
      plateNumber: t.plateNumber,
      route: t.route,
      currentLatitude: t.latitude,
      currentLongitude: t.longitude,
      status: 'ACTIVE',
    })),
    alerts: [],
    shifts: muestras.map((s, i) => {
      const t = TEAM_MEMBERS[s.m];
      const inicio = Date.now() - s.haceHoras * HOUR;
      return {
        id: i + 1,
        employeeId: t.id,
        busUnitId: t.id,
        routeName: t.route,
        routeOrigin: 'Terminal Norte',
        routeDestination: 'Estación Central',
        distanceKm: s.km,
        durationSeconds: s.seg,
        passengerCount: s.pax,
        fareCollected: s.fare,
        status: 'FINISHED',
        startedAt: new Date(inicio).toISOString(),
        endedAt: new Date(inicio + s.seg * 1000).toISOString(),
      };
    }),
    drivers: [],
    sensors: [],
    'passenger-counts': [],
    meta: { lastEmployeeId: TEAM_MEMBERS.length, lastUnitId: TEAM_MEMBERS.length },
  };
}

/**
 * Lee la base guardada en el navegador. Se lee en cada consulta, así que lo que hace una
 * pestaña (por ejemplo, el administrador crea un conductor) lo ven las demás.
 */
export function readDb(): FakeDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FakeDb;
  } catch {
    /* sin acceso a localStorage: se usan los datos de ejemplo */
  }
  return seed();
}

export function writeDb(db: FakeDb): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignorar */
  }
}

/** Vuelve a los datos de ejemplo. */
export function resetDb(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignorar */
  }
}
