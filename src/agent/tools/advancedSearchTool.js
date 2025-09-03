import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import databaseManager from './databaseManager.js';

// Schema Zod para validación
const paramsSchema = z.object({
  producto: z.string().min(2, "Mínimo 2 caracteres"),
  telefono: z.string().optional()
});


// Sistema avanzado de búsqueda inteligente
const sinonimosAvanzados = {
  // Alfombras y medidas
  "alfombra": ["ALFOMBRA"],
  "alfombras": ["ALFOMBRA"],
  "tapete": ["ALFOMBRA"],
  "tapices": ["ALFOMBRA"],
  
  // Medidas y formatos
  "m": ["M.", "M", "metros", "metro"],
  "x": ["X", "×", "por", "x"],
  "cm": ["CM", "centimetros", "centímetros"],
  
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
  "choche": ["COCHE"],
  "coche bebé": ["COCHE"],
  "carrito": ["COCHE"],
  "carrito de bebé": ["COCHE"],
  "cochecito": ["COCHE"]
};

// Función para normalizar medidas con múltiples formatos
function normalizarMedidasAvanzado(texto) {
  // Patrones de medidas con diferentes separadores y formatos
  const patrones = [
    // Formato 1,6x2,2
    /(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/g,
    // Formato 1.6 x 2.2
    /(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/g,
    // Formato 1,6 por 2,2
    /(\d+[.,]\d+)\s*por\s*(\d+[.,]\d+)/gi,
    // Formato con palabras: "medida 1,6 x 2,2"
    /medid[ao]\s*(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/gi,
    // Formato con "de": "la de 1,6 x 2,2"
    /(?:la|el|de|una|un)\s+.*?(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/gi
  ];

  let textoNormalizado = texto;
  
  for (const patron of patrones) {
    textoNormalizado = textoNormalizado.replace(patron, (match, ancho, largo) => {
      const anchoNorm = ancho.replace('.', ',');
      const largoNorm = largo.replace('.', ',');
      return `${anchoNorm} M. X ${largoNorm} M.`;
    });
  }

  return textoNormalizado;
}

// Función para extraer medidas de cualquier formato
function extraerMedidas(texto) {
  const patrones = [
    // Formato estándar con M.
    /(\d+[.,]\d+)\s*M\.\s*X\s*(\d+[.,]\d+)\s*M\./,
    // Formato sin M.
    /(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/,
    // Formato con palabras
    /(\d+[.,]\d+)\s*por\s*(\d+[.,]\d+)/i,
    // Formato en contexto
    /(?:medid[ao]|tamaño|dimensiones?)\s*(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/i
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      const ancho = parseFloat(match[1].replace(',', '.'));
      const largo = parseFloat(match[2].replace(',', '.'));
      return { ancho, largo, original: match[0] };
    }
  }

  return null;
}

// Función para calcular similitud entre strings usando Jaccard index
function calcularSimilitud(str1, str2) {
  const str1Lower = str1.toLowerCase();
  const str2Lower = str2.toLowerCase();
  
  // Si son iguales, similitud perfecta
  if (str1Lower === str2Lower) return 1.0;
  
  // Tokenizar en palabras
  const words1 = new Set(str1Lower.split(/\s+/));
  const words2 = new Set(str2Lower.split(/\s+/));
  
  // Calcular intersección y unión
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  // Jaccard index: |intersection| / |union|
  return intersection.size / union.size;
}

// Función para búsqueda avanzada con múltiples estrategias
async function busquedaAvanzada(termino, limite = 50) {
  try {
    // ESTRATEGIA 1: Búsqueda exacta
    const resultadosExactos = await databaseManager.executeQuery(`
      SELECT TOP ${limite}
        pt.IDPROD,
        pt.NOMPROD, 
        pt.PRECIO,
        c.NOMCAT as CATEGORIA
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
      WHERE pt.NOMPROD LIKE '%' + @0 + '%'
        AND pt.NULO = 0
        AND pt.IDUSUARIO = 'lavadisimo'
      ORDER BY 
        CASE WHEN pt.NOMPROD = @0 THEN 1 
             WHEN pt.NOMPROD LIKE @0 + ' %' THEN 2
             WHEN pt.NOMPROD LIKE '% ' + @0 + ' %' THEN 3
             ELSE 4 END,
        LEN(pt.NOMPROD),
        pt.PRECIO
    `, [termino]);

    // ESTRATEGIA 2: Búsqueda con sinónimos
    let terminosExpandidos = [termino];
    const palabras = termino.toLowerCase().split(/\s+/);
    
    palabras.forEach(palabra => {
      if (sinonimosAvanzados[palabra]) {
        terminosExpandidos = [...terminosExpandidos, ...sinonimosAvanzados[palabra]];
      }
    });

    // Eliminar duplicados
    terminosExpandidos = [...new Set(terminosExpandidos)];

    let condiciones = terminosExpandidos.map((_, index) => 
      `pt.NOMPROD LIKE '%' + @${index} + '%'`
    ).join(' OR ');

    const queryExpandida = `
      SELECT TOP ${limite}
        pt.IDPROD,
        pt.NOMPROD, 
        pt.PRECIO,
        c.NOMCAT as CATEGORIA
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
      WHERE (${condiciones})
        AND pt.NULO = 0
        AND pt.IDUSUARIO = 'lavadisimo'
      ORDER BY pt.PRECIO
    `;

    const resultadosExpandidos = await databaseManager.executeQuery(queryExpandida, terminosExpandidos);

    // Combinar y eliminar duplicados
    const todosResultados = [...resultadosExactos, ...resultadosExpandidos];
    const resultadosUnicos = todosResultados.filter((prod, index, self) =>
      index === self.findIndex(p => p.IDPROD === prod.IDPROD)
    );

    return resultadosUnicos.slice(0, limite);

  } catch (error) {
    console.error("Error en búsqueda avanzada:", error);
    return [];
  }
}

// Función para encontrar la mejor coincidencia por similitud
function encontrarMejorCoincidencia(resultados, terminoBusqueda) {
  if (resultados.length === 0) return null;

  // Calcular similitud para cada resultado
  const resultadosConSimilitud = resultados.map(prod => ({
    ...prod,
    similitud: calcularSimilitud(prod.NOMPROD, terminoBusqueda)
  }));

  // Ordenar por similitud (mayor primero)
  resultadosConSimilitud.sort((a, b) => b.similitud - a.similitud);

  return resultadosConSimilitud[0];
}

// Crear la herramienta avanzada
const advancedSearchTool = new DynamicStructuredTool({
  name: "consultar_precio",
  description: "Consulta precios de servicios de lavandería con búsqueda avanzada, múltiples estrategias de matching, sinónimos y similitud de texto",
  schema: paramsSchema,
  func: async ({ producto, telefono }) => {
    try {
      console.log(`🔍 Búsqueda avanzada para: "${producto}"`);

      // ESTRATEGIA 1: Detectar y manejar medidas específicas
      const medidas = extraerMedidas(producto);
      if (medidas) {
        console.log(`📏 Medidas detectadas: ${medidas.ancho} x ${medidas.largo}`);
        
        // Buscar productos con medidas similares
        const todosProductos = await busquedaAvanzada("alfombra", 100);
        
        // Filtrar productos que contengan medidas
        const productosConMedidas = todosProductos.filter(prod => 
          prod.NOMPROD.includes('M. X') && prod.NOMPROD.includes('ALFOMBRA')
        );

        if (productosConMedidas.length > 0) {
          // Encontrar la mejor coincidencia por similitud numérica
          const mejorCoincidencia = encontrarMejorCoincidencia(productosConMedidas, producto);
          
          if (mejorCoincidencia && mejorCoincidencia.similitud > 0.3) {
            return `${mejorCoincidencia.NOMPROD}: $${parseInt(mejorCoincidencia.PRECIO).toLocaleString('es-CL')}`;
          }
        }
      }

      // ESTRATEGIA 2: Búsqueda general avanzada
      const resultados = await busquedaAvanzada(producto, 15);

      if (resultados.length === 0) {
        return `No encontré servicios que coincidan con "${producto}". ¿Podrías ser más específico? Por ejemplo: "poltrona", "cortina", "cobertor", "alfombra", etc.`;
      }

      if (resultados.length === 1) {
        const prod = resultados[0];
        return `${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`;
      }

      // Mostrar múltiples resultados
      let respuesta = `Encontré ${resultados.length} opciones para "${producto}":\n\n`;
      
      resultados.forEach((prod, index) => {
        respuesta += `${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}\n`;
      });

      respuesta += `\n¿Cuál de estas opciones te interesa más? Puedo darte más detalles.`;

      return respuesta;

    } catch (error) {
      console.error("Error en advancedSearchTool:", error);
      return "Disculpa, tuve un problema al consultar los precios. ¿Podrías intentar nuevamente?";
    }
  }
});

export default advancedSearchTool;
