# Guía de Configuración Rápida

## 🔧 Configurar Base de Datos

### 1. Editar archivo .env

Abre el archivo `.env` y reemplaza los valores de ejemplo con tus credenciales reales:

```env
# Configuración de Base de Datos SQL Server
DB_HOST=tu-servidor-real.database.windows.net
DB_USER=tu_usuario_real
DB_PASSWORD=tu_password_real
DB_NAME=tu_base_datos_real
```

### 2. Formato de Credenciales

**Para Azure SQL Database:**
```env
DB_HOST=servidor.database.windows.net
DB_USER=usuario@servidor
DB_PASSWORD=tu_password_seguro
DB_NAME=nombre_base_datos
```

**Para SQL Server local:**
```env
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=tu_password
DB_NAME=lavadisimo_db
```

**Para SQL Server con instancia:**
```env
DB_HOST=servidor\\SQLEXPRESS
DB_USER=usuario
DB_PASSWORD=password
DB_NAME=base_datos
```

### 3. Probar Conexión

Una vez configuradas las credenciales:

```bash
# Explorar estructura de base de datos
npm run explore-db

# Si funciona, verás:
# ✅ Conectado a la base de datos
# 📋 TABLAS DISPONIBLES:
# ...
```

### 4. Solución de Problemas Comunes

**Error: "Login failed"**
- Verificar usuario y password
- Confirmar que el usuario tiene permisos de lectura

**Error: "Server not found"**
- Verificar nombre del servidor
- Confirmar conectividad de red
- Revisar firewall

**Error: "Database not found"**
- Verificar nombre de la base de datos
- Confirmar que el usuario tiene acceso a esa base de datos

### 5. Configuración de VSCode

Una vez que funcione la exploración, actualiza también `.vscode/settings.json`:

```json
{
  "lavadisimo.dbHost": "tu-servidor-real.database.windows.net",
  "lavadisimo.dbName": "tu_base_datos_real",
  "lavadisimo.dbUser": "tu_usuario_real"
}
```

## 🚀 Comandos Disponibles

```bash
# Explorar base de datos (requiere credenciales)
npm run explore-db

# Probar agente (funciona sin base de datos)
npm run test

# Ejecutar servidor
npm start
```

## 📞 ¿Necesitas Ayuda?

Si tienes problemas con la configuración:
1. Verifica que las credenciales sean correctas
2. Prueba la conexión desde otra herramienta (SQL Server Management Studio, etc.)
3. Revisa los logs de error para más detalles
