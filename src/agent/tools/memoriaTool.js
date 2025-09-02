import { z } from "zod";
import { DataSource } from "typeorm";
import { DynamicStructuredTool } from "@langchain/core/tools";

// Schema Zod para validación
const paramsSchema = z.object({
  telefono: z.string().min(8, "Teléfono debe tener al menos 8 dígitos"),
  mensaje: z.string().min(1, "Mensaje no puede estar vacío"),
  tipo: z.number().min(0).max(1), // 0 = mensaje entrante (cliente), 1 = mensaje saliente (agente)
  intencion: z.string().optional(),
  contexto: z.string().optional()
});

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true },
  extra: { driver: "tedious", requestTimeout: 10000 }
});

// Herramienta para guardar conversación
const guardarConversacionTool = new DynamicStructuredTool({
  name: "guardar_conversacion",
  description: "Guarda un mensaje en el historial de conversaciones del cliente",
  schema: paramsSchema,
  func: async ({ telefono, mensaje, tipo, intencion, contexto }) => {
    try {
      if (!datasource.isInitialized) {
        await datasource.initialize();
      }

      // Limpiar el teléfono (solo números)
      const telefonoLimpio = telefono.replace(/\D/g, '');

      // Insertar el mensaje en la tabla CONVERSACIONES
      await datasource.query(`
        INSERT INTO CONVERSACIONES (CELCTE, TIPO, MENSAJE, FECHA, INTENCION, CONTEXTO)
        VALUES (@0, @1, @2, GETDATE(), @3, @4)
      `, [telefonoLimpio, tipo, mensaje, intencion || null, contexto || null]);

      return "Conversación guardada exitosamente";

    } catch (error) {
      console.error("Error guardando conversación:", error);
      return "Error al guardar la conversación";
    }
  }
});

// Schema para obtener historial
const historialSchema = z.object({
  telefono: z.string().min(8, "Teléfono debe tener al menos 8 dígitos"),
  limite: z.number().optional().default(10)
});

// Herramienta para obtener historial de conversación
const obtenerHistorialTool = new DynamicStructuredTool({
  name: "obtener_historial",
  description: "Obtiene el historial reciente de conversaciones con un cliente para mantener contexto",
  schema: historialSchema,
  func: async ({ telefono, limite = 10 }) => {
    try {
      if (!datasource.isInitialized) {
        await datasource.initialize();
      }

      // Limpiar el teléfono (solo números)
      const telefonoLimpio = telefono.replace(/\D/g, '');

      // Obtener historial reciente
      const historial = await datasource.query(`
        SELECT TOP ${limite}
          TIPO,
          MENSAJE,
          FECHA,
          INTENCION,
          CONTEXTO
        FROM CONVERSACIONES
        WHERE CELCTE = @0
        ORDER BY FECHA DESC
      `, [telefonoLimpio]);

      if (historial.length === 0) {
        return "No hay historial previo con este cliente";
      }

      // Formatear el historial para el contexto
      let contextoFormateado = `Historial reciente con cliente ${telefono}:\n\n`;
      
      historial.reverse().forEach((conv, index) => {
        const fecha = new Date(conv.FECHA).toLocaleString('es-CL');
        const emisor = conv.TIPO === 0 ? 'Cliente' : 'Agente';
        contextoFormateado += `${fecha} - ${emisor}: ${conv.MENSAJE}\n`;
        
        if (conv.INTENCION) {
          contextoFormateado += `   Intención: ${conv.INTENCION}\n`;
        }
      });

      // Analizar patrones en el historial
      const mensajesCliente = historial.filter(h => h.TIPO === 0);
      const ultimoMensajeCliente = mensajesCliente[0];
      
      if (ultimoMensajeCliente) {
        contextoFormateado += `\nÚltima consulta del cliente: ${ultimoMensajeCliente.MENSAJE}`;
        
        // Detectar si hay consultas recurrentes
        const consultasPrecios = mensajesCliente.filter(m => 
          m.MENSAJE.toLowerCase().includes('precio') || 
          m.MENSAJE.toLowerCase().includes('cuesta') ||
          m.MENSAJE.toLowerCase().includes('vale')
        );
        
        if (consultasPrecios.length > 1) {
          contextoFormateado += `\nNota: Cliente ha consultado precios ${consultasPrecios.length} veces - posible interés en compra`;
        }
      }

      return contextoFormateado;

    } catch (error) {
      console.error("Error obteniendo historial:", error);
      return "Error al obtener el historial de conversación";
    }
  }
});

export { guardarConversacionTool, obtenerHistorialTool };
