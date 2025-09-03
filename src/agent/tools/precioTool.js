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
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { 
    encrypt: false, 
    trustServerCertificate: true,
    enableArithAbort: true
  },
  extra: { 
    driver: "tedious", 
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
});

// Sistema robusto de búsqueda inteligente
const sinonimos = {
  // Productos principales
  "chaqueta": ["CHAQ"],
  "chaquetas": ["CHAQ"],
  "casaca": ["CHAQ"],
  "casacas": ["CHAQ"],
  
  "pantalon": ["PANT"],
  "pantalones": ["PANT"],
  "jeans": ["PANT"],
  
  "blusa": ["BLUS"],
  "blusas": ["BLUS"],
  "camisa": ["CAMI"],
  "camisas": ["CAMI"],
  
  "cortina": ["CORTINA"],
  "cortinas": ["CORTINA"],
  
  "alfombra": ["ALFOMBRA"],
  "alfombras": ["ALFOMBRA"],
  
  "cobertor": ["COBERTOR"],
  "cobertores": ["COBERTOR"],
  "frazada": ["COBERTOR", "FRAZADA"],
  "frazadas": ["COBERTOR", "FRAZADA"],
  
  // Materiales
  "cuero": ["CUERO", "CUERINA"],
  "cuerina": ["CUERINA"],
  "gamuza": ["GAMUZA"],
  
  // Tamaños de cama
  "una plaza": ["1 PL"],
  "1 plaza": ["1 PL"],
  "plaza y media": ["1 1/2 PL"],
  "plaza y medio": ["1 1/2 PL"],
  "dos plazas": ["2 PL"],
  "2 plazas": ["2 PL"],
  "king": ["KING"],
  "super king": ["SUPER KING"],
  
  // Cortinas por tamaño
  "pequeña": ["TALLA S"],
  "mediana": ["TALLA M"],
  "grande": ["TALLA L"],
  "extra grande": ["XL"]
};

// Función para normalizar medidas (2x3 → 2 M. X 3 M.)
function normalizarMedidas(texto) {
  // Patrones de medidas comunes - más flexible para detectar en frases
  const patronMedidas = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  
  return texto.replace(patronMedidas, (match, ancho, largo) => {
    // Convertir a formato de base de datos (usar comas)
    const anchoNorm = ancho.replace('.', ',');
    const largoNorm = largo.replace('.', ',');
    return `${anchoNorm} M. X ${largoNorm} M.`;
  });
}

// Función para extraer medidas específicas de frases - MÁS ROBUSTA
function extraerMedidasDeFrase(texto) {
  // Patrones mejorados para detectar medidas en contexto conversacional
  const patrones = [
    // "la de 1,3 x 1,9" - el caso más común
    /(?:la|el|de|una|un)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    
    // "medida 1,3x1,9" o "tamaño 1.3x1.9"
    /(?:medidas?|tamaño|dimensiones?)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    
    // "1,3 x 1,9 metros" o "1.3x1.9 m"
    /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:metros|m\.?)/i,
    
    // "cuanto vale 1,3x1,9" (sin contexto previo)
    /(?:cuanto|cual|precio|valor)\s+(?:vale|es|de|para)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    
    // Solo medidas al final de la frase "quiero una alfombra 1,3x1,9"
    /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)$/i,
    
    // Medidas al inicio "1,3x1,9 cuanto vale"
    /^(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i
  ];
  
  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      const ancho = match[1].replace('.', ',');
      const largo = match[2].replace('.', ',');
      return `${ancho} M. X ${largo} M.`;
    }
  }
  
  return null;
}

// Función para expandir términos de búsqueda
function expandirBusqueda(termino) {
  let terminoNormalizado = normalizarMedidas(termino);
  const terminoLower = terminoNormalizado.toLowerCase().trim();
  
  let terminosExpandidos = [termino, terminoNormalizado];
  
  // Extraer medidas específicas de frases como "la de 2x3"
  const medidaExtraida = extraerMedidasDeFrase(termino);
  if (medidaExtraida) {
    terminosExpandidos.push(medidaExtraida);
  }
  
  // Buscar sinónimos palabra por palabra
  const palabras = terminoLower.split(/\s+/);
  palabras.forEach(palabra => {
    if (sinonimos[palabra]) {
      terminosExpandidos = terminosExpandidos.concat(sinonimos[palabra]);
    }
  });
  
  // Buscar frases completas
  if (sinonimos[terminoLower]) {
    terminosExpandidos = terminosExpandidos.concat(sinonimos[terminoLower]);
  }
  
  return [...new Set(terminosExpandidos)].filter(t => t && t.trim());
}

// Función para crear búsqueda fuzzy más inteligente
function crearBusquedaFuzzy(terminos) {
  const condiciones = [];
  
  terminos.forEach((termino, index) => {
    // Búsqueda exacta
    condiciones.push(`pt.NOMPROD LIKE '%' + @${index} + '%'`);
    
    // Para medidas, también buscar sin espacios y con variaciones
    if (termino.includes('M. X')) {
      const sinEspacios = termino.replace(/\s+/g, '');
      const conGuion = termino.replace(' X ', '-');
      condiciones.push(`pt.NOMPROD LIKE '%${sinEspacios}%'`);
      condiciones.push(`pt.NOMPROD LIKE '%${conGuion}%'`);
    }
  });
  
  return condiciones.join(' OR ');
}

// Crear la herramienta usando DynamicStructuredTool
const precioTool = new DynamicStructuredTool({
  name: "consultar_precio",
  description: "Consulta precios de servicios de lavandería. Puede mostrar múltiples variantes y opciones disponibles para ayudar al cliente a elegir el servicio más adecuado. Reconoce sinónimos y abreviaciones comunes.",
  schema: paramsSchema,
  func: async ({ producto, telefono }) => {
    try {
      if (!datasource.isInitialized) {
        await datasource.initialize();
      }

      // Expandir términos de búsqueda usando sinónimos
      const terminosExpandidos = expandirBusqueda(producto);
      
      // Detectar si la búsqueda incluye medidas específicas
      const tieneMedidasEspecificas = terminosExpandidos.some(termino => 
        termino.includes('M. X') || /\d+[.,]?\d*\s*[xX×]\s*\d+[.,]?\d*/.test(termino)
      );
      
      let condicionesBusqueda;
      let parametrosBusqueda;
      
      if (tieneMedidasEspecificas) {
        // Búsqueda específica para medidas - mostrar solo coincidencias exactas o muy cercanas
        condicionesBusqueda = terminosExpandidos.map((_, index) => 
          `pt.NOMPROD LIKE '%' + @${index} + '%'`
        ).join(' AND ');
        parametrosBusqueda = terminosExpandidos;
      } else {
        // Búsqueda general - usar OR para términos expandidos
        condicionesBusqueda = terminosExpandidos.map((_, index) => 
          `pt.NOMPROD LIKE '%' + @${index} + '%'`
        ).join(' OR ');
        parametrosBusqueda = terminosExpandidos;
      }
      
      // Determinar ordenamiento según tipo de búsqueda
      let ordenamiento = `
        ORDER BY 
          CASE WHEN pt.NOMPROD LIKE @0 + '%' THEN 1 ELSE 2 END,
          LEN(pt.NOMPROD),
          pt.PRECIO
      `;
      
      if (tieneMedidasEspecificas) {
        // Para medidas específicas, priorizar coincidencias exactas
        ordenamiento = `
          ORDER BY 
            CASE 
              WHEN pt.NOMPROD LIKE '%${terminosExpandidos.join('%')}%' THEN 1
              ELSE 2 
            END,
            LEN(pt.NOMPROD),
            pt.PRECIO
        `;
      }
      
      // Buscar productos que coincidan con los términos
      const productos = await datasource.query(`
        SELECT TOP ${tieneMedidasEspecificas ? '5' : '15'} 
          pt.IDPROD,
          pt.NOMPROD, 
          pt.PRECIO,
          c.NOMCAT as CATEGORIA
        FROM PRODUCTOS pt
        INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
        ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
        LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
        WHERE (${condicionesBusqueda})
          AND pt.NULO = 0
          AND pt.IDUSUARIO = 'lavadisimo'
        ${ordenamiento}
      `, parametrosBusqueda);

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
              pt.NOMPROD, 
              pt.PRECIO,
              c.NOMCAT as CATEGORIA
            FROM PRODUCTOS pt
            INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
            ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
            INNER JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
            WHERE c.NOMCAT = @0 AND pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
            ORDER BY pt.PRECIO
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

        // Buscar productos relacionados o similares (solo si existen)
        const similares = await datasource.query(`
          SELECT TOP 3
            pt.NOMPROD, 
            pt.PRECIO
          FROM PRODUCTOS pt
          INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
          ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
          LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
          WHERE pt.IDPROD != @0 
            AND (pt.IDGRUPO = @1 OR pt.NOMPROD LIKE '%' + @2 + '%')
            AND pt.NULO = 0
            AND pt.IDUSUARIO = 'lavadisimo'
          ORDER BY pt.PRECIO
        `, [prod.IDPROD, prod.IDGRUPO || 0, producto.split(' ')[0]]);

        if (similares.length > 0) {
          respuesta += `\n\nTambién tenemos:\n`;
          similares.forEach((sim, index) => {
            respuesta += `• ${sim.NOMPROD}: $${parseInt(sim.PRECIO).toLocaleString('es-CL')}\n`;
          });
        }

        // Respuesta 100% específica sin inventar información
        respuesta += `\n¿Te gustaría agendar este servicio?`;
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
      
      // Intentar cerrar la conexión si hay problemas
      if (datasource.isInitialized) {
        try {
          await datasource.destroy();
        } catch (destroyError) {
          console.error("Error cerrando conexión:", destroyError);
        }
      }
      
      // Mensaje más específico según el tipo de error
      if (error.code === 'ESOCKET' || error.message.includes('socket hang up')) {
        return "Hay un problema temporal con la conexión a la base de datos. Por favor, intenta nuevamente en unos momentos.";
      } else if (error.message.includes('timeout')) {
        return "La consulta está tardando más de lo esperado. ¿Podrías intentar con un término más específico?";
      } else {
        return "Disculpa, tuve un problema al consultar los precios. ¿Podrías intentar nuevamente?";
      }
    }
  }
});

export default precioTool;
