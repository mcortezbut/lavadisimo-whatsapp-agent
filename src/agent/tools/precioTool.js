import { z } from "zod";
import { DataSource } from "typeorm";
import "reflect-metadata";
import levenshtein from "fast-levenshtein";

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
    driver: "tedious",
    connectionTimeout: 30000
  }
});

const textSimilarity = (a, b) => {
  const str1 = a.toLowerCase().replace(/\s+/g, '');
  const str2 = b.toLowerCase().replace(/\s+/g, '');
  const distance = levenshtein.get(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
};

export default {
  name: "consultar_precio",
  description: "Consulta precios EXACTOS de servicios. No inventes información.",
  schema: z.object({
    producto: z.string().describe("Nombre EXACTO del producto según la base de datos")
  }),
  func: async ({ producto }) => {
    if (!producto || producto.length < 3) {
      return "ERROR: Pide al cliente más detalles sobre el producto";
    }

    try {
      // ... (código de conexión igual)
      
      const results = await datasource.query(`
        SELECT TOP 3 NOMPROD, PRECIO 
        FROM PRODUCTOS 
        WHERE NOMPROD LIKE @producto
        ORDER BY NOMPROD
      `, [{ name: 'producto', value: `%${producto}%` }]);

      if (!results.length) {
        return "NO_ENCONTRADO"; // 👈 Mensaje específico
      }

      return results.map(p => `${p.NOMPROD}: $${p.PRECIO}`).join('\n');

    } catch (error) {
      console.error("Error en precioTool:", error);
      return "ERROR_TECNICO";
    } finally {
      await datasource.destroy();
    }
  }
};
