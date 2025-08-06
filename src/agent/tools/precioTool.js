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
    trustServerCertificate: true,
    connectTimeout: 5000 // 5 segundos timeout
  },
  extra: {
    driver: "tedious",
    options: {
      requestTimeout: 5000 // 5 segundos por consulta
    }
  }
});

export default {
  name: "consultar_precio",
  description: "Herramienta PARA PRECIOS EXACTOS. Devuelve productos que coincidan EXACTAMENTE.",
  schema: z.object({
    producto: z.string().min(3).describe("Nombre EXACTO del producto")
  }),
  func: async ({ producto }) => {
    let connection;
    try {
      connection = await datasource.initialize();
      
      // Consulta optimizada con parámetros
      const results = await connection.query(`
        SELECT TOP 1 NOMPROD, PRECIO 
        FROM PRODUCTOS 
        WHERE NOMPROD LIKE '%' + @0 + '%'
        ORDER BY CASE 
          WHEN NOMPROD = @0 THEN 0 
          WHEN NOMPROD LIKE @0 + '%' THEN 1 
          ELSE 2 
        END
      `, [producto]);

      if (!results.length) {
        return "NO_ENCONTRADO";
      }

      return `${results[0].NOMPROD}: $${results[0].PRECIO}`;

    } catch (error) {
      console.error("Error en precioTool:", error);
      return "ERROR_CONSULTA";
    } finally {
      if (connection) {
        await connection.destroy();
      }
    }
  }
};
