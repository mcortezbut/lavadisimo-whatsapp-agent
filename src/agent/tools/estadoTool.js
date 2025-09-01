import { z } from "zod";
import { DataSource } from "typeorm";

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
  extra: { driver: "tedious" }
});

// Definir schema primero
const paramsSchema = z.object({
  orden: z.string().optional(),
  telefono: z.string().optional()
}).refine(data => data.orden || data.telefono, {
  message: "Debes proporcionar orden o teléfono"
});

export default {
  name: "verificar_estado",
  description: "Consulta el estado de una orden",
  parameters: paramsSchema,  // Schema Zod directo
  type: "function",
  function: {
    name: "verificar_estado",
    description: "Consulta el estado de una orden",
    parameters: paramsSchema
  },
  func: async ({ orden, telefono }) => {
    try {
      if (!datasource.isInitialized) {
        await datasource.initialize();
      }

      let query, params;
      
      if (orden) {
        query = `
          SELECT TOP 1 NUMERO_ORDEN, ESTADO, FECHA_INGRESO, FECHA_ENTREGA 
          FROM ORDENES 
          WHERE NUMERO_ORDEN = @0 OR NUMERO_ORDEN LIKE '%' + @0 + '%'
        `;
        params = [orden.toString()];
      } else if (telefono) {
        query = `
          SELECT TOP 1 NUMERO_ORDEN, ESTADO, FECHA_INGRESO, FECHA_ENTREGA 
          FROM ORDENES 
          WHERE TELEFONO_CLIENTE = @0 OR TELEFONO_CLIENTE LIKE '%' + @0 + '%'
          ORDER BY FECHA_INGRESO DESC
        `;
        params = [telefono.replace(/\D/g, '')]; // Solo números
      }

      const [result] = await datasource.query(query, params);

      if (result) {
        const fechaEntrega = result.FECHA_ENTREGA ? 
          new Date(result.FECHA_ENTREGA).toLocaleDateString('es-CL') : 
          'Por definir';
        
        return `Orden ${result.NUMERO_ORDEN}: ${result.ESTADO}. Entrega: ${fechaEntrega}`;
      }

      return orden ? 
        `No encontré la orden ${orden}` : 
        `No encontré órdenes para el teléfono ${telefono}`;

    } catch (error) {
      console.error("Error en estadoTool:", error);
      return "Error al consultar el estado de la orden";
    }
  }
};
