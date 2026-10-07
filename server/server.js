/**
 * API falsa de Avisum con json-server.
 * Base de datos: server/db.json  |  Dirección: http://localhost:3000/api/v1
 *
 * Los endpoints REST normales (GET /employees, GET /alerts...) los resuelve json-server solo.
 * Los endpoints propios del backend (login por código, fin de turno, resolver alerta...)
 * se definen aquí, antes del router.
 */
const path = require('path');
const jsonServer = require('json-server');

const PORT = 3000;
const API = '/api/v1';

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const db = router.db; // instancia de lowdb sobre db.json

server.use(jsonServer.defaults()); // CORS, logger y archivos estáticos
server.use(jsonServer.bodyParser);

const nextId = (collection) =>
  db
    .get(collection)
    .value()
    .reduce((max, item) => Math.max(max, item.id), 0) + 1;

// Las posiciones en vivo se guardan en memoria para no reescribir db.json cada 2 segundos
const live = new Map();
const withLive = (u) => {
  const p = live.get(u.id);
  return p ? { ...u, currentLatitude: p.lat, currentLongitude: p.lng } : u;
};

// ---------- Empleados ----------
// Alta de empleado: el servidor asigna el id y el código (EMP-006, EMP-007...) sin reutilizar los de eliminados
server.post(`${API}/employees`, (req, res) => {
  const b = req.body || {};
  const meta = db.get('meta').value();
  const id =
    Math.max(
      meta.lastEmployeeId,
      ...db
        .get('employees')
        .value()
        .map((e) => e.id),
    ) + 1;
  db.set('meta.lastEmployeeId', id).write();
  const employee = {
    ...b,
    id,
    employeeCode: `EMP-${String(id).padStart(3, '0')}`,
    fullName: b.fullName || `${b.firstName || ''} ${b.lastName || ''}`.trim(),
    status: b.status || 'ACTIVE',
  };
  db.get('employees').push(employee).write();
  res.status(201).json(employee);
});

server.get(`${API}/employees/code/:code`, (req, res) => {
  const code = String(req.params.code).trim().toUpperCase().replace(/^QR-/, '');
  const employee = db.get('employees').find({ employeeCode: code }).value();
  if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });
  if (employee.status !== 'ACTIVE')
    return res.status(403).json({ message: 'Empleado desactivado' });
  res.json(employee);
});

// ---------- Unidades ----------
server.post(`${API}/bus-units`, (req, res) => {
  const b = req.body || {};
  const meta = db.get('meta').value();
  const id =
    Math.max(
      meta.lastUnitId,
      ...db
        .get('bus-units')
        .value()
        .map((u) => u.id),
    ) + 1;
  db.set('meta.lastUnitId', id).write();
  const unit = {
    currentLatitude: -12.0464,
    currentLongitude: -77.0428,
    status: 'ACTIVE',
    ...b,
    id,
  };
  db.get('bus-units').push(unit).write();
  res.status(201).json(unit);
});

server.get(`${API}/bus-units`, (req, res) => {
  res.json(db.get('bus-units').value().map(withLive));
});

server.get(`${API}/bus-units/:id`, (req, res) => {
  const unit = db
    .get('bus-units')
    .find({ id: Number(req.params.id) })
    .value();
  if (!unit) return res.status(404).json({ message: 'Unidad no encontrada' });
  res.json(withLive(unit));
});

server.patch(`${API}/bus-units/:id/location`, (req, res) => {
  const unit = db
    .get('bus-units')
    .find({ id: Number(req.params.id) })
    .value();
  if (!unit) return res.status(404).json({ message: 'Unidad no encontrada' });
  const { latitude, longitude } = req.body || {};
  const prev = live.get(unit.id) || { lat: unit.currentLatitude, lng: unit.currentLongitude };
  live.set(unit.id, {
    lat: typeof latitude === 'number' ? latitude : prev.lat,
    lng: typeof longitude === 'number' ? longitude : prev.lng,
  });
  res.json(withLive(unit));
});

// ---------- Alertas ----------
server.post(`${API}/alerts`, (req, res) => {
  const b = req.body || {};
  const alert = {
    id: nextId('alerts'),
    employeeId: b.employeeId ?? 0,
    busUnitId: b.busUnitId ?? 0,
    alertType: b.alertType || 'PÁNICO',
    description: b.description || '',
    latitude: b.latitude ?? 0,
    longitude: b.longitude ?? 0,
    resolved: false,
    createdAt: new Date().toISOString(),
  };
  db.get('alerts').push(alert).write();
  res.status(201).json(alert);
});

server.patch(`${API}/alerts/:id/resolve`, (req, res) => {
  const id = Number(req.params.id);
  if (!db.get('alerts').find({ id }).value())
    return res.status(404).json({ message: 'Alerta no encontrada' });
  res.json(db.get('alerts').find({ id }).assign({ resolved: true }).write());
});

// ---------- Turnos ----------
server.post(`${API}/shifts`, (req, res) => {
  const b = req.body || {};
  const unit = db.get('bus-units').find({ id: b.busUnitId }).value();
  const shift = {
    id: nextId('shifts'),
    employeeId: b.employeeId ?? 0,
    busUnitId: b.busUnitId ?? 0,
    routeName: unit ? unit.route : 'R-42',
    routeOrigin: b.routeOrigin || '',
    routeDestination: b.routeDestination || '',
    distanceKm: 0,
    durationSeconds: 0,
    passengerCount: 0,
    fareCollected: 0,
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
    endedAt: null,
  };
  db.get('shifts').push(shift).write();
  res.status(201).json(shift);
});

server.patch(`${API}/shifts/:id/end`, (req, res) => {
  const id = Number(req.params.id);
  const shift = db.get('shifts').find({ id }).value();
  if (!shift) return res.status(404).json({ message: 'Turno no encontrado' });
  const b = req.body || {};
  const updated = db
    .get('shifts')
    .find({ id })
    .assign({
      distanceKm: b.distanceKm ?? shift.distanceKm,
      durationSeconds: b.durationSeconds ?? shift.durationSeconds,
      passengerCount: b.passengerCount ?? shift.passengerCount,
      fareCollected: b.fareCollected ?? shift.fareCollected,
      status: 'FINISHED',
      endedAt: new Date().toISOString(),
    })
    .write();
  res.json(updated);
});

server.get(`${API}/shifts/employee/:id`, (req, res) => {
  res.json(
    db
      .get('shifts')
      .filter({ employeeId: Number(req.params.id) })
      .value(),
  );
});

server.get(`${API}/shifts/bus-unit/:id/active`, (req, res) => {
  const active = db
    .get('shifts')
    .find({ busUnitId: Number(req.params.id), status: 'ACTIVE' })
    .value();
  if (!active) return res.status(404).json({ message: 'Sin turno activo' });
  res.json(active);
});

// ---------- El resto: REST estándar de json-server bajo /api/v1 ----------
server.use(jsonServer.rewriter({ [`${API}/*`]: '/$1' }));
server.use(router);

server.listen(PORT, () => {
  console.log(`Avisum fake API lista en http://localhost:${PORT}${API}`);
});
