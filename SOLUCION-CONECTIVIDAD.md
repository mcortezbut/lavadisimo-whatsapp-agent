# Solución para Problemas de Conectividad de Base de Datos

## Problema Actual
El agente de WhatsApp está funcionando correctamente, pero no puede conectarse a la base de datos SQL Server desde Render debido a errores de conectividad de red (ESOCKET - socket hang up).

## Solución Temporal Implementada ✅
Se ha implementado una herramienta de fallback (`precioFallbackTool`) que:
- Contiene precios de los servicios más comunes
- Funciona sin conexión a la base de datos
- Responde consultas básicas de precios
- Incluye servicios como: pulido de focos, poltrona, cortinas, alfombras, etc.

## Pasos para Resolver la Conectividad Permanente

### 1. Verificar Configuración del Servidor SQL Server
```bash
# Verificar que SQL Server esté ejecutándose
# Verificar que el puerto 1433 esté abierto
# Verificar que las conexiones remotas estén habilitadas
```

### 2. Configurar Firewall y Red
- **Whitelist de IPs de Render**: Agregar las IPs de Render a la lista blanca del firewall
- **Puerto 1433**: Asegurar que esté abierto para conexiones externas
- **Configuración de Red**: Verificar que no haya restricciones de red

### 3. Obtener IPs de Render
Para obtener las IPs que Render usa para conexiones salientes:
```bash
# Desde el dashboard de Render, ir a la sección de networking
# O contactar soporte de Render para obtener el rango de IPs
```

### 4. Configuración Alternativa - Túnel VPN
Si el problema persiste, considerar:
- Configurar un túnel VPN entre Render y el servidor
- Usar un proxy/gateway intermedio
- Migrar la base de datos a un servicio cloud (Azure SQL, AWS RDS)

### 5. Variables de Entorno a Verificar
```env
DB_HOST=200.63.96.20
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=tu_base_de_datos
```

## Monitoreo y Diagnóstico

### Script de Prueba de Conectividad
```bash
node scripts/test-precio-query.js
```

### Logs a Revisar
- Errores ESOCKET indican problemas de red/firewall
- Timeouts indican conectividad lenta
- Authentication errors indican problemas de credenciales

## Estado Actual del Sistema
- ✅ Agente funcionando correctamente
- ✅ Respuestas de fallback implementadas
- ✅ Manejo de errores mejorado
- ❌ Conexión directa a base de datos (pendiente)

## Próximos Pasos
1. Contactar administrador del servidor SQL Server
2. Configurar whitelist de IPs de Render
3. Probar conectividad
4. Remover herramienta de fallback una vez resuelto

## Contacto Técnico
Para resolver este problema, necesitarás:
- Acceso administrativo al servidor SQL Server (200.63.96.20)
- Configuración de firewall/red
- Posiblemente contactar soporte de Render para IPs específicas
