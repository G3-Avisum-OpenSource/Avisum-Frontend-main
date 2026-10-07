# Avisum

Frontend Angular de Avisum: seguridad en transporte público (verificación de conductores, botón de pánico y monitoreo de flota).

## Cómo correrlo con la API falsa (json-server)

```bash
npm install
npm run server   # API falsa en http://localhost:3000/api/v1 (base de datos: server/db.json)
npm start        # app en http://localhost:4200
```

## Accesos de prueba

- Conductor: `/conductor/login` con `EMP-001` a `EMP-005`
- Administrador: `/admin/login` con `ADMIN-001`

## Despliegue

La versión desplegada en Vercel no usa json-server: una copia de la API (src/app/shared/infrastructure/fake-api) responde dentro del navegador con las mismas rutas.
