# Lavadísimo - Sitio Web

Sitio web para agendar servicios de limpieza de vehículos, alfombras, lavandería y más.

## Características

- 🌐 Frontend moderno con HTML/CSS/JavaScript
- 🔐 Sistema de autenticación de usuarios
- 📅 Sistema de reservas de servicios
- 🛒 Carrito de compras para servicios
- 📊 Panel de administración

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env` basado en `.env.example`:

```env
DB_HOST=200.63.96.20
DB_USER=lavadisimo
DB_PASSWORD=tu_password
DB_NAME=lavadisimo
PORT=3000
NODE_ENV=development
```

## Ejecutar servidor

```bash
node index.js
```

El servidor estará disponible en `http://localhost:3000`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/services` - Lista de servicios
- `GET /api/clients/by-phone` - Datos de cliente por teléfono
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `POST /api/orders` - Crear orden
- `GET /api/users/:userId/orders` - Órdenes de usuario
- `GET /api/orders/:orderNumber` - Detalles de orden
- `POST /api/bookings` - Crear reserva
- `GET /api/bookings/:bookingNumber` - Estado de reserva
- `POST /api/availability` - Verificar disponibilidad
- `POST /api/payments` - Procesar pago
- `GET /api/admin/stats` - Estadísticas
