# Contexto de Base de Datos - Lavadísimo (EJEMPLO)

## Tablas Disponibles

### PRODUCTOS

**Columnas:**
- **ID**: int NOT NULL
- **NOMPROD**: nvarchar(255) NOT NULL
- **DESCRIPCION**: nvarchar(500) NULL
- **PRECIO**: decimal(10,2) NOT NULL
- **CATEGORIA**: nvarchar(100) NULL
- **ACTIVO**: bit NOT NULL

**Datos de ejemplo:**
```json
[
  {
    "ID": 1,
    "NOMPROD": "Lavado de camisa",
    "DESCRIPCION": "Lavado y planchado de camisa de vestir",
    "PRECIO": 2500,
    "CATEGORIA": "Ropa formal",
    "ACTIVO": true
  },
  {
    "ID": 2,
    "NOMPROD": "Pulido de focos",
    "DESCRIPCION": "Pulido y restauración de focos de automóvil",
    "PRECIO": 25000,
    "CATEGORIA": "Automotriz",
    "ACTIVO": true
  },
  {
    "ID": 3,
    "NOMPROD": "Lavado de cortinas",
    "DESCRIPCION": "Lavado especializado de cortinas",
    "PRECIO": 8000,
    "CATEGORIA": "Hogar",
    "ACTIVO": true
  }
]
```

---

### ORDENES

**Columnas:**
- **ID**: int NOT NULL
- **NUMERO_ORDEN**: nvarchar(50) NOT NULL
- **CLIENTE_ID**: int NULL
- **TELEFONO_CLIENTE**: nvarchar(20) NULL
- **ESTADO**: nvarchar(100) NOT NULL
- **FECHA_INGRESO**: datetime NOT NULL
- **FECHA_ENTREGA**: datetime NULL
- **TOTAL**: decimal(10,2) NULL
- **OBSERVACIONES**: nvarchar(500) NULL

**Datos de ejemplo:**
```json
[
  {
    "ID": 1,
    "NUMERO_ORDEN": "ORD-2025-001",
    "CLIENTE_ID": 101,
    "TELEFONO_CLIENTE": "56912345678",
    "ESTADO": "En proceso",
    "FECHA_INGRESO": "2025-01-01T10:00:00.000Z",
    "FECHA_ENTREGA": "2025-01-03T16:00:00.000Z",
    "TOTAL": 15000,
    "OBSERVACIONES": "Cliente prefiere entrega en la tarde"
  },
  {
    "ID": 2,
    "NUMERO_ORDEN": "ORD-2025-002",
    "CLIENTE_ID": 102,
    "TELEFONO_CLIENTE": "56987654321",
    "ESTADO": "Completado",
    "FECHA_INGRESO": "2024-12-28T14:30:00.000Z",
    "FECHA_ENTREGA": "2024-12-30T11:00:00.000Z",
    "TOTAL": 25000,
    "OBSERVACIONES": null
  }
]
```

---

### CLIENTES

**Columnas:**
- **ID**: int NOT NULL
- **NOMBRE**: nvarchar(255) NOT NULL
- **TELEFONO**: nvarchar(20) NULL
- **EMAIL**: nvarchar(255) NULL
- **DIRECCION**: nvarchar(500) NULL
- **FECHA_REGISTRO**: datetime NOT NULL

**Datos de ejemplo:**
```json
[
  {
    "ID": 101,
    "NOMBRE": "Juan Pérez",
    "TELEFONO": "56912345678",
    "EMAIL": "juan.perez@email.com",
    "DIRECCION": "Av. Principal 123, Santiago",
    "FECHA_REGISTRO": "2024-06-15T09:00:00.000Z"
  },
  {
    "ID": 102,
    "NOMBRE": "María González",
    "TELEFONO": "56987654321",
    "EMAIL": "maria.gonzalez@email.com",
    "DIRECCION": "Calle Secundaria 456, Providencia",
    "FECHA_REGISTRO": "2024-08-20T14:30:00.000Z"
  }
]
```

---

## Relaciones entre Tablas

- **ORDENES.CLIENTE_ID** → **CLIENTES.ID**

## Queries Útiles para el Agente

### Consultas de Productos

**Buscar productos por nombre:**
```sql
SELECT NOMPROD, PRECIO, DESCRIPCION 
FROM PRODUCTOS 
WHERE NOMPROD LIKE '%camisa%' AND ACTIVO = 1
ORDER BY PRECIO ASC
```

**Productos por categoría:**
```sql
SELECT NOMPROD, PRECIO 
FROM PRODUCTOS 
WHERE CATEGORIA = 'Ropa formal' AND ACTIVO = 1
```

### Consultas de Órdenes

**Buscar orden por número:**
```sql
SELECT o.NUMERO_ORDEN, o.ESTADO, o.FECHA_ENTREGA, c.NOMBRE
FROM ORDENES o
LEFT JOIN CLIENTES c ON o.CLIENTE_ID = c.ID
WHERE o.NUMERO_ORDEN = 'ORD-2025-001'
```

**Órdenes por teléfono:**
```sql
SELECT NUMERO_ORDEN, ESTADO, FECHA_INGRESO, FECHA_ENTREGA
FROM ORDENES 
WHERE TELEFONO_CLIENTE = '56912345678'
ORDER BY FECHA_INGRESO DESC
```

**Órdenes pendientes:**
```sql
SELECT NUMERO_ORDEN, TELEFONO_CLIENTE, FECHA_INGRESO
FROM ORDENES 
WHERE ESTADO IN ('Pendiente', 'En proceso')
ORDER BY FECHA_INGRESO ASC
```

## Recomendaciones para el Agente

### 1. Herramientas Sugeridas

**PrecioTool mejorada:**
- Buscar por nombre exacto primero
- Luego buscar por palabras clave
- Mostrar categoría si está disponible
- Incluir descripción si es útil

**EstadoTool mejorada:**
- Buscar por número de orden
- Buscar por teléfono del cliente
- Mostrar fecha estimada de entrega
- Incluir observaciones si existen

**Nueva ClienteTool:**
- Buscar información del cliente
- Historial de órdenes
- Datos de contacto

### 2. Queries Optimizadas

```sql
-- Búsqueda de productos (más flexible)
SELECT TOP 5 NOMPROD, PRECIO, CATEGORIA
FROM PRODUCTOS 
WHERE (NOMPROD LIKE '%' + @producto + '%' 
       OR DESCRIPCION LIKE '%' + @producto + '%')
  AND ACTIVO = 1
ORDER BY 
  CASE WHEN NOMPROD LIKE @producto + '%' THEN 1 ELSE 2 END,
  LEN(NOMPROD),
  PRECIO

-- Estado de orden con información del cliente
SELECT 
  o.NUMERO_ORDEN,
  o.ESTADO,
  o.FECHA_ENTREGA,
  o.OBSERVACIONES,
  c.NOMBRE as CLIENTE_NOMBRE
FROM ORDENES o
LEFT JOIN CLIENTES c ON o.CLIENTE_ID = c.ID
WHERE o.NUMERO_ORDEN = @orden
   OR o.TELEFONO_CLIENTE = @telefono
```

### 3. Respuestas Mejoradas

**Para precios:**
- "El [producto] cuesta $[precio]. [Descripción opcional]"
- "Tenemos varios servicios de [categoría]: [lista]"

**Para estados:**
- "Tu orden [número] está [estado]. Entrega estimada: [fecha]"
- "Encontré [cantidad] órdenes para tu teléfono. La más reciente está [estado]"

---

*Este es un contexto de ejemplo. Ejecuta `npm run explore-db` con credenciales reales para obtener la estructura actual de tu base de datos.*
