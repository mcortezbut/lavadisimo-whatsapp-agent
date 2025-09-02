import { z } from "zod";
import { DataSource } from "typeorm";
import { DynamicStructuredTool } from "@langchain/core/tools";

// Schema Zod para validación
const paramsSchema = z.object({
  producto: z.string().min(2, "Mínimo 2 caracteres"),
  telefono: z.string().optional()
});

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true },
  extra: { driver: "tedious", requestTimeout: 10000 }
});

// Crear la herramienta usando DynamicStructuredTool
const precioTool = new DynamicStructuredTool({
  name: "consultar_precio",
  description: "Consulta precios de servicios de lavandería. Puede mostrar múltiples variantes y opciones disponibles para ayudar al cliente a elegir el servicio más adecuado.",
  schema: paramsSchema,
  func: async ({ producto, telefono }) => {
    try {
      if (!datasource.isInitialized) {
        await datasource.initialize();
      }

      // Buscar productos que coincidan con la consulta
      const productos = await datasource.query(`
        SELECT TOP 10 
          p.IDPROD,
          p.NOMPROD, 
          p.PRECIO,
          c.NOMCAT as CATEGORIA
        FROM PRODUCTOS p
        LEFT JOIN CATEGORIAS c ON p.IDGRUPO = c.IDGRUPO
        WHERE p.NOMPROD LIKE '%' + @0 + '%' 
          AND p.NULO = 0
        ORDER BY 
          CASE WHEN p.NOMPROD LIKE @0 + '%' THEN 1 ELSE 2 END,
          LEN(p.NOMPROD),
          p.PRECIO
      `, [producto]);

      if (productos.length === 0) {
        // Si no encuentra nada, buscar en categorías
        const categorias = await datasource.query(`
          SELECT DISTINCT c.NOMCAT
          FROM CATEGORIAS c
          WHERE c.NOMCAT LIKE '%' + @0 + '%'
        `, [producto]);

        if (categorias.length > 0) {
          const categoria = categorias[0].NOMCAT;
          const productosCategoria = await datasource.query(`
            SELECT TOP 5
              p.NOMPROD, 
              p.PRECIO,
              c.NOMCAT as CATEGORIA
            FROM PRODUCTOS p
            INNER JOIN CATEGORIAS c ON p.IDGRUPO = c.IDGRUPO
            WHERE c.NOMCAT = @0 AND p.NULO = 0
            ORDER BY p.PRECIO
          `, [categoria]);

          if (productosCategoria.length > 0) {
            let respuesta = `Encontré servicios en la categoría "${categoria}":\n\n`;
            productosCategoria.forEach((prod, index) => {
              respuesta += `${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}\n`;
            });
            respuesta += `\n¿Te interesa alguno de estos servicios específicamente?`;
            return respuesta;
          }
        }

        return `No encontré servicios que coincidan con "${producto}". ¿Podrías ser más específico? Por ejemplo: "poltrona", "cortina", "cobertor", "alfombra", etc.`;
      }

      // Si encuentra solo un producto
      if (productos.length === 1) {
        const prod = productos[0];
        let respuesta = `${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`;
        
        if (prod.CATEGORIA) {
          respuesta += ` (${prod.CATEGORIA})`;
        }

        // Buscar productos relacionados o similares
        const similares = await datasource.query(`
          SELECT TOP 3
            p.NOMPROD, 
            p.PRECIO
          FROM PRODUCTOS p
          LEFT JOIN CATEGORIAS c ON p.IDGRUPO = c.IDGRUPO
          WHERE p.IDPROD != @0 
            AND (p.IDGRUPO = @1 OR p.NOMPROD LIKE '%' + @2 + '%')
            AND p.NULO = 0
          ORDER BY p.PRECIO
        `, [prod.IDPROD, prod.IDGRUPO || 0, producto.split(' ')[0]]);

        if (similares.length > 0) {
          respuesta += `\n\nTambién tenemos:\n`;
          similares.forEach((sim, index) => {
            respuesta += `• ${sim.NOMPROD}: $${parseInt(sim.PRECIO).toLocaleString('es-CL')}\n`;
          });
        }

        respuesta += `\n¿Te gustaría agendar este servicio o necesitas más información?`;
        return respuesta;
      }

      // Si encuentra múltiples productos (el caso más común)
      let respuesta = `Tenemos varias opciones para "${producto}":\n\n`;
      
      // Agrupar por categoría si es posible
      const porCategoria = {};
      productos.forEach(prod => {
        const cat = prod.CATEGORIA || 'Otros servicios';
        if (!porCategoria[cat]) {
          porCategoria[cat] = [];
        }
        porCategoria[cat].push(prod);
      });

      // Si hay múltiples categorías, mostrar agrupado
      if (Object.keys(porCategoria).length > 1) {
        Object.keys(porCategoria).forEach(categoria => {
          respuesta += `**${categoria}:**\n`;
          porCategoria[categoria].forEach(prod => {
            respuesta += `• ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}\n`;
          });
          respuesta += `\n`;
        });
      } else {
        // Si es una sola categoría, mostrar lista simple
        productos.forEach((prod, index) => {
          respuesta += `${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}\n`;
        });
      }

      // Agregar precio más económico y más caro
      const precios = productos.map(p => parseInt(p.PRECIO));
      const minPrecio = Math.min(...precios);
      const maxPrecio = Math.max(...precios);

      if (minPrecio !== maxPrecio) {
        respuesta += `\nRango de precios: desde $${minPrecio.toLocaleString('es-CL')} hasta $${maxPrecio.toLocaleString('es-CL')}\n`;
      }

      respuesta += `\n¿Cuál de estas opciones te interesa más? Puedo darte más detalles sobre cualquiera de ellas.`;

      return respuesta;

    } catch (error) {
      console.error("Error en precioTool:", error);
      return "Disculpa, tuve un problema al consultar los precios. ¿Podrías intentar nuevamente?";
    }
  }
});

export default precioTool;
