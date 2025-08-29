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
    // ... resto del código igual
  }
};
