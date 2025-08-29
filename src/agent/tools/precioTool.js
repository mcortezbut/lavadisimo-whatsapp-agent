import { z } from "zod";
import { DataSource } from "typeorm";

// Primero define el schema Zod
const paramsSchema = z.object({
  producto: z.string().min(3, "Mínimo 3 caracteres")
});

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
  extra: { driver: "tedious", requestTimeout: 5000 }
});

export default {
  name: "consultar_precio",
  description: "Consulta precios de productos",
  parameters: paramsSchema, // Usa el schema Zod directamente
  type: "function",
  function: {
    name: "consultar_precio",
    description: "Consulta precios de productos",
    parameters: paramsSchema
  },
  func: async ({ producto }) => {
    try {
      const [result] = await datasource.query(`
        SELECT TOP 1 NOMPROD, PRECIO 
        FROM PRODUCTOS 
        WHERE NOMPROD LIKE '%' + @0 + '%'
        ORDER BY LEN(NOMPROD)
      `, [producto.substring(0, 30)]);

      return result ? `${result.NOMPROD}: $${result.PRECIO}` : "No encontré ese producto";
    } catch (error) {
      console.error("Error en precioTool:", error);
      return "Error al consultar precios";
    }
  }
};
