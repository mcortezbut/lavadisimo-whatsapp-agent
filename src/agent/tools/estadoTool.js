import { z } from "zod";
import { DataSource } from "typeorm";
import { DynamicStructuredTool } from "@langchain/core/tools";

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { 
    encrypt: false, 
    trustServerCertificate: true,
    enableArithAbort: true
  },
  extra: { 
    driver: "tedious", 
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
});

// Schema Zod para validación
const paramsSchema = z.object({
  orden: z.string().optional(),
  telefono: z.string().optional()
}).refine(data => data.orden || data.telefono, {
  message: "Debes proporcionar número de orden o teléfono"
});

// Crear la herramienta usando DynamicStructuredTool
const estadoTool = new DynamicStructuredTool({
  name: "verificar_estado",
  description: "Consulta el estado de órdenes de lavandería por número de venta o teléfono del cliente",
  schema: paramsSchema,
  func: async ({ orden, telefono }) => {
    try {
      if (!datasource.isInitialized) {
        await datasource.initialize();
      }

      let query, params;
      
      if (orden) {
        // Buscar por número de venta
        query = `
          SELECT TOP 1 
            v.NROVENTA,
            v.TOTAL,
            v.FECHA,
            v.FECHAENTREGA,
            v.ESTADO,
            v.OBSERVACION,
            v.OBSPOSTVENTA,
            c.NOMCTE,
            c.CELCTE,
            c.DIRCTE,
            CASE v.ESTADO
              WHEN 0 THEN 'Recibido'
              WHEN 1 THEN 'En proceso'
              WHEN 2 THEN 'Listo para entrega'
              WHEN 3 THEN 'Entregado'
              ELSE 'Estado desconocido'
            END as ESTADO_TEXTO
          FROM VENTAS v
          LEFT JOIN CLIENTES c ON v.IDCTE = c.IDCTE
          WHERE v.NROVENTA = @0 
            AND v.NULO = 0
          ORDER BY v.FECHA DESC
        `;
        params = [orden.toString()];
      } else if (telefono) {
        // Buscar por teléfono del cliente
        const telefonoLimpio = telefono.replace(/\D/g, '');
        query = `
          SELECT TOP 3
            v.NROVENTA,
            v.TOTAL,
            v.FECHA,
            v.FECHAENTREGA,
            v.ESTADO,
            v.OBSERVACION,
            v.OBSPOSTVENTA,
            c.NOMCTE,
            c.CELCTE,
            c.DIRCTE,
            CASE v.ESTADO
              WHEN 0 THEN 'Recibido'
              WHEN 1 THEN 'En proceso'
              WHEN 2 THEN 'Listo para entrega'
              WHEN 3 THEN 'Entregado'
              ELSE 'Estado desconocido'
            END as ESTADO_TEXTO
          FROM VENTAS v
          INNER JOIN CLIENTES c ON v.IDCTE = c.IDCTE
          WHERE c.CELCTE = @0 
            AND v.NULO = 0
          ORDER BY v.FECHA DESC
        `;
        params = [telefonoLimpio];
      }

      const resultados = await datasource.query(query, params);

      if (resultados.length === 0) {
        if (orden) {
          return `No encontré la orden ${orden}. ¿Podrías verificar el número? También puedo buscar por tu teléfono.`;
        } else {
          return `No encontré órdenes registradas con el teléfono ${telefono}. ¿Podrías verificar el número o proporcionarme el número de orden?`;
        }
      }

      // Si es búsqueda por teléfono y hay múltiples resultados
      if (telefono && resultados.length > 1) {
        let respuesta = `Encontré ${resultados.length} órdenes para tu teléfono:\n\n`;
        
        resultados.forEach((venta, index) => {
          const fechaIngreso = new Date(venta.FECHA).toLocaleDateString('es-CL');
          const fechaEntrega = venta.FECHAENTREGA ? 
            new Date(venta.FECHAENTREGA).toLocaleDateString('es-CL') : 
            'Por definir';
          
          respuesta += `${index + 1}. Orden #${venta.NROVENTA}\n`;
          respuesta += `   Estado: ${venta.ESTADO_TEXTO}\n`;
          respuesta += `   Fecha ingreso: ${fechaIngreso}\n`;
          respuesta += `   Fecha entrega: ${fechaEntrega}\n`;
          respuesta += `   Total: $${parseInt(venta.TOTAL).toLocaleString('es-CL')}\n`;
          
          if (venta.OBSERVACION && venta.OBSERVACION !== '0') {
            respuesta += `   Observación: ${venta.OBSERVACION}\n`;
          }
          respuesta += `\n`;
        });

        respuesta += `¿Te interesa el detalle de alguna orden específica?`;
        return respuesta;
      }

      // Respuesta para una sola orden
      const venta = resultados[0];
      const fechaIngreso = new Date(venta.FECHA).toLocaleDateString('es-CL');
      const fechaEntrega = venta.FECHAENTREGA ? 
        new Date(venta.FECHAENTREGA).toLocaleDateString('es-CL') : 
        'Por definir';

      let respuesta = `📋 **Orden #${venta.NROVENTA}**\n\n`;
      respuesta += `👤 Cliente: ${venta.NOMCTE || 'No especificado'}\n`;
      respuesta += `📱 Teléfono: ${venta.CELCTE}\n`;
      respuesta += `📍 Dirección: ${venta.DIRCTE || 'No especificada'}\n\n`;
      respuesta += `📊 **Estado:** ${venta.ESTADO_TEXTO}\n`;
      respuesta += `📅 Fecha ingreso: ${fechaIngreso}\n`;
      respuesta += `🚚 Fecha entrega: ${fechaEntrega}\n`;
      respuesta += `💰 Total: $${parseInt(venta.TOTAL).toLocaleString('es-CL')}\n`;

      if (venta.OBSERVACION && venta.OBSERVACION !== '0') {
        respuesta += `📝 Observación: ${venta.OBSERVACION}\n`;
      }

      if (venta.OBSPOSTVENTA && venta.OBSPOSTVENTA !== '0') {
        respuesta += `📋 Nota adicional: ${venta.OBSPOSTVENTA}\n`;
      }

      // Obtener detalle de productos si es necesario
      try {
        const detalle = await datasource.query(`
          SELECT TOP 5
            d.CANT,
            pt.NOMPROD,
            d.PRECIO
          FROM DETALLE d
          INNER JOIN PRODUCTOS pt ON d.IDPROD = pt.IDPROD
          INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
          ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
          WHERE d.NROVENTA = @0 AND pt.IDUSUARIO = 'lavadisimo'
        `, [venta.NROVENTA]);

        if (detalle.length > 0) {
          respuesta += `\n🛍️ **Servicios:**\n`;
          detalle.forEach(item => {
            respuesta += `• ${item.CANT}x ${item.NOMPROD} - $${parseInt(item.PRECIO).toLocaleString('es-CL')}\n`;
          });
        }
      } catch (error) {
        console.log("No se pudo obtener detalle de productos:", error.message);
      }

      // Agregar mensaje contextual según el estado
      switch (venta.ESTADO) {
        case 0:
          respuesta += `\n✅ Tu orden ha sido recibida y está en cola para procesamiento.`;
          break;
        case 1:
          respuesta += `\n🔄 Tu orden está siendo procesada por nuestro equipo.`;
          break;
        case 2:
          respuesta += `\n🎉 ¡Tu orden está lista! Puedes pasar a retirarla.`;
          break;
        case 3:
          respuesta += `\n✅ Tu orden fue entregada exitosamente.`;
          break;
      }

      if (venta.ESTADO < 3) {
        respuesta += `\n\n¿Necesitas cambiar algo de tu orden o tienes alguna consulta?`;
      }

      return respuesta;

    } catch (error) {
      console.error("Error en estadoTool:", error);
      
      // Intentar cerrar la conexión si hay problemas
      if (datasource.isInitialized) {
        try {
          await datasource.destroy();
        } catch (destroyError) {
          console.error("Error cerrando conexión:", destroyError);
        }
      }
      
      // Mensaje más específico según el tipo de error
      if (error.code === 'ESOCKET' || error.message.includes('socket hang up')) {
        return "Hay un problema temporal con la conexión a la base de datos. Por favor, intenta nuevamente en unos momentos.";
      } else if (error.message.includes('timeout')) {
        return "La consulta está tardando más de lo esperado. ¿Podrías intentar nuevamente?";
      } else {
        return "Disculpa, tuve un problema al consultar el estado de tu orden. ¿Podrías intentar nuevamente?";
      }
    }
  }
});

export default estadoTool;
