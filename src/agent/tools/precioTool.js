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
    driver: "tedious"
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
  description: "Consulta precios de servicios en la base de datos con tolerancia a errores",
  schema: z.object({
    producto: z.string().describe("Nombre del producto/servicio ej: 'poltrona grande'")
  }),
  func: async ({ producto }) => {
    await datasource.initialize();
    
    const allProducts = await datasource.query(`
      SELECT P.NOMPROD, P.PRECIO
      FROM lavadisimo.lavadisimo.PRODUCTOS P
      INNER JOIN (
        SELECT IDPROD, MAX(FECHAUPDATE) AS maxdate
        FROM lavadisimo.lavadisimo.PRODUCTOS
        WHERE IDUSUARIO = 'lavadisimo'
        GROUP BY IDPROD
      ) PT ON P.IDPROD = PT.IDPROD AND P.FECHAUPDATE = PT.maxdate
      WHERE P.IDUSUARIO = 'lavadisimo'
    `);
    
    datasource.destroy();

    if (allProducts.length === 0) {
      return "No hay productos disponibles en la base de datos";
    }

    // CORRECCIÓN PRINCIPAL: Paréntesis bien cerrados en la cadena de métodos
    const results = allProducts
      .map(item => ({
        ...item,
        similarity: Math.max(
          textSimilarity(item.NOMPROD, producto),
          item.NOMPROD.toLowerCase().includes(producto.toLowerCase()) ? 0.8 : 0
        )
      })) // <-- Este paréntesis estaba faltando
      .filter(item => item.similarity > 0.4)
      .sort((a, b) => b.similarity - a.similarity);

    if (results.length === 0) {
      const closestMatch = allProducts.reduce((prev, curr) => 
        textSimilarity(curr.NOMPROD, producto) > textSimilarity(prev.NOMPROD, producto) ? curr : prev
      );
      return `No encontré "${producto}". ¿Quizás te refieres a "${closestMatch.NOMPROD}"?`;
    }

    const exactMatch = results.find(r => r.similarity > 0.9);
    if (exactMatch) {
      return `• ${exactMatch.NOMPROD}: $${exactMatch.PRECIO}`;
    }

    return [
      `¿Uno de estos? (escribe exactamente el nombre para confirmar):`,
      ...results.slice(0, 3).map(item => 
        `• ${item.NOMPROD}: $${item.PRECIO} (similitud: ${Math.round(item.similarity * 100)}%)`
      )
    ].join('\n');
  }
};
