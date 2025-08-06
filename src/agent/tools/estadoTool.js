import { z } from "zod";
import { DataSource } from "typeorm";
import "reflect-metadata"; 

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { 
    encrypt: false,
    trustServerCertificate: true  // Necesario para conexiones no encriptadas
  },
  extra: {
    driver: "tedious"  // Usa el driver alternativo
  }
});

export default {
  name: "verificar_estado",
  description: "Consulta el estado de una orden en la base de datos",
  schema: z.object({
    orden: z.string().optional().describe("Número de orden ej: '123'"),
    telefono: z.string().optional().describe("Teléfono del cliente")
  }),
  func: async ({ orden, telefono }) => {
    await datasource.initialize();
    let query;

    if (orden) {
      query = `
        SELECT NROVENTA, ESTADO 
        FROM VENTAS 
        WHERE NROVENTA = '${orden}' AND NULO = 0
      `;
    } else if (telefono) {
      query = `
        SELECT V.NROVENTA, V.ESTADO 
        FROM VENTAS V
        JOIN CLIENTES C ON V.IDCTE = C.IDCTE
        WHERE C.CELCTE LIKE '%${telefono}%' AND V.NULO = 0
      `;
    } else {
      return "Debes proporcionar un número de orden o teléfono";
    }

    const result = await datasource.query(query);
    datasource.destroy();

    if (result.length === 0) {
      return "No encontré órdenes activas";
    }

    // Mapear estados numéricos a texto
    const estados = {
      0: "en espera",
      1: "en proceso",
      2: "terminado"
    };

    return result.map(item => 
      `• Orden ${item.NROVENTA}: ${estados[item.ESTADO] || 'desconocido'}`
    ).join('\n');
  }
};
