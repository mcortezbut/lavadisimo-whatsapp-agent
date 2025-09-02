# Guía de Conexión a Base de Datos - VSCode Integration

## 🎯 Opciones para Conectar VSCode con tu Base de Datos

### Opción 1: Extensión SQL Server (Microsoft)

**Instalación:**
1. Ve a Extensions en VSCode (Ctrl+Shift+X)
2. Busca "SQL Server (mssql)" de Microsoft
3. Instala la extensión

**Configuración:**
1. Presiona `Ctrl+Shift+P` y busca "MS SQL: Connect"
2. Ingresa los datos de conexión:
   ```
   Server: tu-servidor.database.windows.net
   Database: lavadisimo_db
   Authentication Type: SQL Login
   User: tu_usuario
   Password: tu_password
   ```
3. Guarda la conexión con un nombre descriptivo

**Uso:**
- Explora tablas en el panel lateral
- Ejecuta queries directamente
- Ve estructura de datos en tiempo real

### Opción 2: Extensión Database Client

**Instalación:**
1. Busca "Database Client" en Extensions
2. Instala la extensión (más universal, soporta múltiples DB)

**Configuración:**
```json
{
  "host": "tu-servidor.database.windows.net",
  "port": 1433,
  "user": "tu_usuario",
  "password": "tu_password",
  "database": "lavadisimo_db",
  "encrypt": true
}
```

### Opción 3: Archivo de Configuración Local

Crea un archivo `.vscode/settings.json` en tu proyecto:

```json
{
  "mssql.connections": [
    {
      "server": "tu-servidor.database.windows.net",
      "database": "lavadisimo_db",
      "user": "tu_usuario",
      "password": "",
      "authenticationType": "SqlLogin",
      "profileName": "Lavadisimo DB",
      "encrypt": true
    }
  ]
}
```

## 🔧 Scripts de Desarrollo con Contexto de DB

### Script para Explorar Estructura
