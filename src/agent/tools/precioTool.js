import { z } from "zod";
import { DataSource } from "typeorm";
import "reflect-metadata";

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: 1433,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { 
    encrypt: false,
    trustServerCertificate: true
  },
  extra: {
    driver: "tedious"
  }
});

export default {
  name: "consultar_precio",
  description: "Consulta precios de servicios en la base de datos",
  schema: z.object({
    producto: z.string().describe("Nombre del producto/servicio")
  }),
  func: async ({ producto }) => {
    try {
      await datasource.initialize();
      
      const results = await datasource.query(`
        SELECT TOP 3 NOMPROD, PRECIO 
        FROM PRODUCTOS 
        WHERE NOMPROD LIKE '%' + @0 + '%'
        ORDER BY NOMPROD
      `, [producto]);

      if (results.length === 0) {
        return "No encontré ese producto en nuestros registros";
      }

      // Formatea la respuesta para el cliente final
      return results.map(p => `${p.NOMPROD}: $${p.PRECIO}`).join('\n');

    } catch (error) {
      console.error("Error en precioTool:", error);
      return "Ocurrió un error al consultar los precios";
    } finally {
      await datasource.destroy();
    }
  }
};
