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
  "extra grande": ["XL"],
  
  // Coche bebé (carrito de bebé)
  "coche": ["COCHE"],
  "choche": ["COCHE"], // común error de tipeo
  "coche bebé": ["COCHE"],
  "carrito": ["COCHE"],
  "carrito de bebé": ["COCHE"],
  "cochecito": ["COCHE"]
};

// Función para normalizar medidas (2x3 → 2 M. X 3 M.) con soporte para puntos y comas
function normalizarMedidas(texto) {
  const patronMedidas = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  
  return texto.replace(patronMedidas, (match, ancho, largo) => {
    const anchoNorm = ancho.replace('.', ',');
    const largoNorm = largo.replace('.', ',');
    return `${anchoNorm} M. X ${largoNorm} M.`;
  });
}

// Función para extraer y normalizar medidas de cualquier formato
function extraerYNormalizarMedidas(texto) {
  const textoNormalizado = normalizarMedidas(texto);
  const patronMedidas = /(\d+[.,]\d+)\s*M\.\s*X\s*(\d+[.,]\d+)\s*M\./;
  const match = textoNormalizado.match(patronMedidas);
  
  if (match) {
    return `${match[1]} M. X ${match[2]} M.`;
  }
  return extraerMedidasDeFrase(texto);
}

// Función para parsear medidas en valores numéricos
function parsearMedidasANumeros(medidaStr) {
  const patron = /(\d+(?:[.,]\d+)?)\s*M\.\s*X\s*(\d+(?:[.,]\d+)?)\s*M\./;
  const match = medidaStr.match(patron);
  
  if (match) {
    const ancho = parseFloat(match[1].replace(',', '.'));
    const largo = parseFloat(match[2].replace(',', '.'));
    return { ancho, largo };
  }
  return null;
}

// Función para encontrar la medida más cercana en la base de datos con búsqueda exacta
async function encontrarMedidaCercana(anchoTarget, largoTarget) {
  try {
    if (!datasource.isInitialized) {
      await datasource.initialize();
    }

    // Primero buscar coincidencia exacta
    const productosExactos = await datasource.query(`
      SELECT TOP 10 pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND pt.NOMPROD LIKE '% M. X % M.%'
        AND (
          pt.NOMPROD LIKE '%${anchoTarget.toFixed(1).replace('.', ',')}%' 
          AND pt.NOMPROD LIKE '%${largoTarget.toFixed(1).replace('.', ',')}%'
        )
      ORDER BY pt.FECHAUPDATE DESC, pt.PRECIO
    `);

    // Si encontramos coincidencias exactas, devolver la más reciente
    if (productosExactos.length > 0) {
      return productosExactos[0];
    }

    // Si no hay coincidencia exacta, buscar la más cercana
    const productos = await datasource.query(`
      SELECT TOP 20 pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND pt.NOMPROD LIKE '% M. X % M.%'
      ORDER BY pt.NOMPROD
    `);

    let mejorMatch = null;
    let menorDiferencia = Infinity;

    for (const prod of productos) {
      const medidas = parsearMedidasANumeros(prod.NOMPROD);
      if (medidas) {
        const diferenciaAncho = Math.abs(medidas.ancho - anchoTarget);
        const diferenciaLargo = Math.abs(medidas.largo - largoTarget);
        const diferenciaTotal = diferenciaAncho + diferenciaLargo;

        // Preferir coincidencias exactas o muy cercanas
        if (diferenciaTotal < menorDiferencia) {
          menorDiferencia = diferenciaTotal;
          mejorMatch = prod;
        }
      }
    }

    // Solo devolver si la diferencia es pequeña (menos de 0.3 en total para mayor precisión)
    if (mejorMatch && menorDiferencia < 0.3) {
      return mejorMatch;
    }
    return null;
  } catch (error) {
    console.error("Error en búsqueda de medida cercana:", error);
    return null;
  }
}

// Función para extraer medidas específicas de frases
function extraerMedidasDeFrase(texto) {
  const patronGeneral = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  const matches = [...texto.matchAll(patronGeneral)];
  
  if (matches.length > 0) {
    const match = matches[0];
    const ancho = match[1].replace('.', ',');
    const largo = match[2].replace('.', ',');
    return `${ancho} M. X ${largo} M.`;
  }
  
  const patronesContextuales = [
    /(?:la|el|de|una|un).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(?:medidas?|tamaño|dimensiones?).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(?:cuanto|cual|precio|valor).*?(?:vale|es|de|para).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i
  ];
  
  for (const patron of patronesContextuales) {
    const match = texto.match(patron);
    if (match) {
      const ancho = match[1].replace('.', ',');
      const largo = match[2].replace('.', ',');
      return `${ancho} M. X ${largo} M.`;
    }
  }
  
  return null;
}

// Función para extraer variantes de una lista de nombres de productos
function extraerVariantes(nombresProductos) {
  if (nombresProductos.length === 0) return { base: null, variantes: [] };

  // Encontrar el prefijo común más largo
  let prefijoComun = nombresProductos[0];
  for (let i = 1; i < nombresProductos.length; i++) {
    const nombreActual = nombresProductos[i];
    let j = 0;
    while (j < prefijoComun.length && j < nombreActual.length && 
           prefijoComun[j] === nombreActual[j]) {
      j++;
    }
    prefijoComun = prefijoComun.substring(0, j);
  }

  // Limpiar el prefijo común
  prefijoComun = prefijoComun.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/, '').trim();

  // Extraer las variantes de cada nombre
  const variantes = nombresProductos.map(nombre => {
    const variante = nombre.replace(prefijoComun, '').trim();
    return variante.replace(/[\$\.,:;0-9]+/g, '').trim();
  }).filter(v => v.length > 0);

  // Si no encontramos variantes significativas, buscar por palabras clave comunes
  if (variantes.length === 0 || variantes.every(v => v === variantes[0])) {
    const palabrasComunes = ['PEQUEÑA', 'MEDIANA', 'GRANDE', 'CHICA', 'EXTRA', 'XL', 'L', 'M', 'S'];
    const variantesPorPalabra = new Set();
    
    nombresProductos.forEach(nombre => {
      palabrasComunes.forEach(palabra => {
        if (nombre.includes(palabra)) {
          variantesPorPalabra.add(palabra);
        }
      });
    });

    if (variantesPorPalabra.size > 0) {
      return {
        base: prefijoComun,
        variantes: Array.from(variantesPorPalabra)
      };
    }

    // Si aún no hay variantes, devolver los nombres completos como variantes
    return {
      base: '',
      variantes: nombresProductos
    };
  }

  return {
    base: prefijoComun,
    variantes: [...new Set(variantes)]
  };
}

// Función para expandir términos de búsqueda
export function expandirBusqueda(termino) {
  let terminoNormalizado = normalizarMedidas(termino);
  const terminoLower = terminoNormalizado.toLowerCase().trim();
  
  let terminosExpandidos = [termino, terminoNormalizado];
  
  const medidaExtraida = extraerMedidasDeFrase(termino);
  if (medidaExtraida) {
    terminosExpandidos.push(medidaExtraida);
  }
  
  const palabras = terminoLower.split(/\s+/);
  palabras.forEach(palabra => {
    if (sinonimos[palabra]) {
      terminosExpandidos = terminosExpandidos.concat(sinonimos[palabra]);
    }
  });
  
  if (sinonimos[terminoLower]) {
    terminosExpandidos = terminosExpandidos.concat(sinonimos[terminoLower]);
  }
  
  return [...new Set(terminosExpandidos)].filter(t => t && t.trim());
}

// Crear la herramienta usando DynamicStructuredTool
const precioTool = new DynamicStructuredTool({
  name: "consultar_precio",
  description: "Consulta precios de servicios. Solo muestra precios si hay una única coincidencia. Si hay múltiples coincidencias, extrae variantes y pregunta al cliente.",
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
      
      // Búsqueda inteligente para medidas
      if (tieneMedidasEspecificas) {
        const medidaExtraida = extraerMedidasDeFrase(producto);
        if (medidaExtraida) {
          const medidas = parsearMedidasANumeros(medidaExtraida);
          if (medidas) {
            const productoMasCercano = await encontrarMedidaCercana(medidas.ancho, medidas.largo);
            if (productoMasCercano) {
              return `${productoMasCercano.NOMPROD}: $${parseInt(productoMasCercano.PRECIO).toLocaleString('es-CL')}`;
            }
          }
        }
        
        // Si no se encuentra medida cercana, buscar productos generales
        condicionesBusqueda = `pt.NOMPROD LIKE '%' + @0 + '%'`;
        parametrosBusqueda = [producto.split(' ')[0]]; // Usar primera palabra para búsqueda general
      } else {
        // Búsqueda general - usar OR para términos expandidos
        condicionesBusqueda = terminosExpandidos.map((_, index) => 
          `pt.NOMPROD LIKE '%' + @${index} + '%'`
        ).join(' OR ');
        parametrosBusqueda = terminosExpandidos;
      }
      
      // Buscar productos que coincidan con los términos
      const productos = await datasource.query(`
        SELECT TOP 20
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
        ORDER BY 
          CASE WHEN pt.NOMPROD LIKE @0 + '%' THEN 1 ELSE 2 END,
          LEN(pt.NOMPROD),
          pt.PRECIO
      `, parametrosBusqueda);

      if (productos.length === 0) {
        return `No encontré servicios que coincidan con "${producto}". ¿Podrías ser más específico?`;
      }

      // Si encuentra solo un producto - mostrar precio
      if (productos.length === 1) {
        const prod = productos[0];
        return `${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`;
      }

      // Si encuentra múltiples productos - extraer variantes y preguntar
      const { base, variantes } = extraerVariantes(productos.map(p => p.NOMPROD));
      
      if (variantes.length > 0) {
        let respuesta = `Encontré varias opciones para ${base || producto}. ¿A cuál te refieres?\n\n`;
        
        variantes.forEach((variante, index) => {
          respuesta += `${index + 1}. ${variante}\n`;
        });
        
        respuesta += `\nPor favor, especifica cuál necesitas.`;
        return respuesta;
      }

      // Fallback si no se pueden extraer variantes
      return `Encontré varias opciones para "${producto}". Por favor, sé más específico sobre qué tipo necesitas.`;

    } catch (error) {
      console.error("Error en precioTool:", error);
      
      if (datasource.isInitialized) {
        try {
          await datasource.destroy();
        } catch (destroyError) {
          console.error("Error cerrando conexión:", destroyError);
        }
      }
      
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

export { encontrarMedidaCercana, parsearMedidasANumeros };
export default precioTool;
