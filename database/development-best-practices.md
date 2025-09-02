# Mejores Prácticas para Desarrollo con Base de Datos

## 🎯 Configuración Completa de VSCode para Base de Datos

### 1. Extensiones Recomendadas

**Instala estas extensiones en VSCode:**

1. **SQL Server (mssql)** - Microsoft
   - Conexión directa a SQL Server
   - IntelliSense para SQL
   - Ejecución de queries

2. **Database Client** - cweijan
   - Soporte multi-base de datos
   - Interfaz visual más amigable
   - Export/Import de datos

3. **SQL Formatter** - adpyke
   - Formateo automático de queries
   - Mejora legibilidad del código

4. **Thunder Client** - rangav
   - Para probar APIs relacionadas con la DB
   - Útil para testing de endpoints

### 2. Configuración del Workspace

**Archivo `.vscode/settings.json` ya configurado con:**
- Conexión a tu base de datos
- Formateo automático de SQL
- Autocompletado mejorado

**Para usar:**
1. Actualiza las variables en `.vscode/settings.json`:
   ```json
   "lavadisimo.dbHost": "tu-servidor-real.database.windows.net",
   "lavadisimo.dbName": "tu_base_datos_real",
   "lavadisimo.dbUser": "tu_usuario_real"
   ```

2. Presiona `Ctrl+Shift+P` y busca "MS SQL: Connect"
3. Selecciona "Lavadisimo Production DB"
4. Ingresa tu password cuando se solicite

### 3. Scripts de Desarrollo

**Ya incluidos en el proyecto:**

```bash
# Explorar estructura completa de la base de datos
npm run explore-db

# Probar el agente localmente
npm run test

# Ejecutar servidor de desarrollo
npm start
```

### 4. Flujo de Trabajo Recomendado

#### A. Exploración Inicial
```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales

# 2. Explorar la base de datos
npm run explore-db
```

Esto generará `database/database-context.md` con:
- Estructura completa de tablas
- Relaciones entre tablas
- Datos de ejemplo
- Queries sugeridas

#### B. Desarrollo de Nuevas Herramientas

1. **Analizar el contexto generado**
   ```bash
   # Revisar el archivo generado
   code database/database-context.md
   ```

2. **Crear nueva herramienta**
   ```bash
   # Ejemplo: herramienta para consultar clientes
   code src/agent/tools/clienteTool.js
   ```

3. **Probar la herramienta**
   ```bash
   npm run test
   ```

#### C. Queries de Desarrollo

**Crear archivos .sql para queries frecuentes:**

```sql
-- database/queries/productos.sql
SELECT TOP 10 * FROM PRODUCTOS 
WHERE NOMPROD LIKE '%camisa%'
ORDER BY PRECIO DESC;

-- database/queries/ordenes-pendientes.sql
SELECT * FROM ORDENES 
WHERE ESTADO IN ('Pendiente', 'En Proceso')
ORDER BY FECHA_INGRESO DESC;
```

### 5. Debugging de Base de Datos

#### Logs Útiles
```javascript
// En tus herramientas, agrega logs detallados:
console.log('🔍 Query ejecutada:', query);
console.log('📊 Parámetros:', params);
console.log('✅ Resultados:', results.length, 'filas');
```

#### Manejo de Errores
```javascript
try {
  const result = await datasource.query(query, params);
  return result;
} catch (error) {
  console.error('❌ Error DB:', {
    message: error.message,
    query: query,
    params: params
  });
  throw error;
}
```

### 6. Performance y Optimización

#### Índices Recomendados
```sql
-- Para búsquedas de productos por nombre
CREATE INDEX IX_PRODUCTOS_NOMBRE ON PRODUCTOS(NOMPROD);

-- Para búsquedas de órdenes por teléfono
CREATE INDEX IX_ORDENES_TELEFONO ON ORDENES(TELEFONO_CLIENTE);

-- Para búsquedas de órdenes por estado
CREATE INDEX IX_ORDENES_ESTADO ON ORDENES(ESTADO);
```

#### Queries Optimizadas
```sql
-- ✅ Bueno: Usar LIKE con wildcard al final
SELECT * FROM PRODUCTOS WHERE NOMPROD LIKE 'camisa%'

-- ❌ Evitar: Wildcard al inicio (no usa índices)
SELECT * FROM PRODUCTOS WHERE NOMPROD LIKE '%camisa'

-- ✅ Bueno: Limitar resultados
SELECT TOP 10 * FROM ORDENES ORDER BY FECHA_INGRESO DESC

-- ✅ Bueno: Usar parámetros para evitar SQL injection
SELECT * FROM PRODUCTOS WHERE NOMPROD LIKE '%' + @0 + '%'
```

### 7. Seguridad

#### Variables de Entorno
```bash
# .env (nunca commitear este archivo)
DB_HOST=servidor-real.database.windows.net
DB_USER=usuario_real
DB_PASSWORD=password_super_seguro
DB_NAME=lavadisimo_production

# .env.example (sí commitear este archivo)
DB_HOST=tu_servidor_sql_server
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=lavadisimo_db
```

#### Conexiones Seguras
```javascript
// Siempre usar conexiones encriptadas
const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { 
    encrypt: true,  // ✅ Siempre true en producción
    trustServerCertificate: true 
  }
});
```

### 8. Testing con Datos Reales

#### Script de Testing Avanzado
```javascript
// scripts/test-with-real-data.js
import { initializeAgent } from '../src/agent/manager.js';

const testCases = [
  "¿Cuánto cuesta lavar una camisa?",
  "¿Cómo va mi orden 12345?",
  "¿Tienes alguna orden para el teléfono 56912345678?",
  "¿Qué servicios de limpieza ofrecen?"
];

// Probar con datos reales de la base de datos
```

### 9. Monitoreo en Producción

#### Logs de Base de Datos
```javascript
// Agregar métricas de performance
const startTime = Date.now();
const result = await datasource.query(query, params);
const duration = Date.now() - startTime;

console.log(`⏱️ Query ejecutada en ${duration}ms`);
if (duration > 1000) {
  console.warn('🐌 Query lenta detectada:', query);
}
```

### 10. Backup y Versionado

#### Scripts de Migración
```sql
-- database/migrations/001_add_indexes.sql
CREATE INDEX IX_PRODUCTOS_NOMBRE ON PRODUCTOS(NOMPROD);
CREATE INDEX IX_ORDENES_TELEFONO ON ORDENES(TELEFONO_CLIENTE);
```

#### Versionado de Esquema
```javascript
// Verificar versión de esquema al iniciar
const schemaVersion = await datasource.query(
  "SELECT value FROM CONFIG WHERE key = 'schema_version'"
);
```

---

## 🚀 Comandos Rápidos

```bash
# Explorar base de datos completa
npm run explore-db

# Probar agente con datos reales
npm run test

# Conectar VSCode a la base de datos
Ctrl+Shift+P -> "MS SQL: Connect"

# Ejecutar query en VSCode
Ctrl+Shift+E (con archivo .sql abierto)
```

¡Con esta configuración tendrás contexto completo de tu base de datos directamente en VSCode para desarrollar herramientas más precisas para el agente!
