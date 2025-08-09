import { z } from "zod";
import { DataSource } from "typeorm";

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
  extra: { driver: "tedious", requestTimeout: 5000 }
});

// Schema debe ser definido con Zod directamente
const paramsSchema = z.object({
  producto: z.string().min(3)
});

export default {
  name: "consultar_precio",
  description: "Devuelve EXACTAMENTE 1 producto coincidente o nada",
  parameters: paramsSchema,  // Usamos el schema directamente
  func: async ({ producto }) => {
    try {
      const [result] = await datasource.query(`
        SELECT TOP 1 NOMPROD, PRECIO 
        FROM PRODUCTOS 
        WHERE NOMPROD LIKE '%' + @0 + '%'
        ORDER BY LEN(NOMPROD)
      `, [producto.substring(0, 30)]);

      return result ? `${result.NOMPROD}: $${result.PRECIO}` : "NO_ENCONTRADO";
    } catch (error) {
      console.error("Error en precioTool:", error);
      return "ERROR_TECNICO";
    }
  }
};
