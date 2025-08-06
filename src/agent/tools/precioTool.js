import { z } from "zod";
import { DataSource } from "typeorm";

// Configuración de conexión a tu BD (usa tus variables de entorno)
const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: 1433,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false }
});

export default {
  name: "consultar_precio",
  description: "Consulta precios de servicios en la base de datos",
  schema: z.object({
    producto: z.string().describe("Nombre del producto/servicio ej: 'poltrona grande'")
  }),
  func: async ({ producto }) => {
    await datasource.initialize();
    const query = `
      SELECT NOMPROD, PRECIO 
      FROM PRODUCTOS 
      WHERE NOMPROD LIKE '%${producto}%'
    `;
    const result = await datasource.query(query);
    datasource.destroy();

    if (result.length === 0) {
      return `No encontré precios para "${producto}"`;
    }

    return result.map(item => 
      `• ${item.NOMPROD}: $${item.PRECIO}`
    ).join('\n');
  }
};
