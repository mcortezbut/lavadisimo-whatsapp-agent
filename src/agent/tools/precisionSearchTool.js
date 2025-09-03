import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import databaseManager from './databaseManager.js';

// Schema Zod para validación
const paramsSchema = z.object({
  producto: z.string().min(2, "Mínimo 2 caracteres"),
  telefono: z.string().optional()
});

// Sistema de búsqueda por precisión numérica
const productCategories = {
  "alfombra": ["ALFOMBRA"],
  "alfombras": ["ALFOMBRA"],
  "tapete": ["ALFOMBRA"],
  "tapices": ["ALFOMBRA"],
  "cortina": ["CORTINA"],
  "cortinas": ["CORTINA"],
  "cobertor": ["COBERTOR"],
  "cobertores": ["COBERTOR"],
  "frazada": ["COBERTOR", "FRAZADA"],
  "chaqueta": ["CHAQ"],
  "pantalon": ["PANT"],
  "blusa": ["BLUS"],
  "camisa": ["CAMI"],
  "coche": ["COCHE"],
  "carrito": ["COCHE"]
};

// Función para extraer medidas numéricas de texto con alta precisión
function extraerMedidasPrecisas(texto) {
  const patrones = [
    // Formato con M. (ej: "1,6 M. X 2,3 M.")
    /(\d+[.,]\d+)\s*M\.\s*X\s*(\d+[.,]\d+)\s*M\./,
    // Formato sin M. (ej: "1,6x2,3")
    /(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/,
    // Formato con palabras (ej: "1,6 por 2,3")
    /(\d+[.,]\d+)\s*por\s*(\d+[.,]\d+)/i,
    // Formato en contexto (ej: "la de 1,6 x 2,3")
    /(?:la|el|de|una|un)\s+.*?(\d+[.,]\d+)\s*[xX×]\s*(\d+[.,]\d+)/i
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

// Función para extraer medidas de nombres de productos (ej: "ALFOMBRA 1,6 M. X 2,3 M." o "ALFOMBRA 2 M. X 3 M.")
function extraerMedidasDeProducto(nombreProducto) {
  const patron = /(\d+[.,]?\d*)\s*[Mm]?\.?\s*[xX×]\s*(\d+[.,]?\d*)\s*[Mm]?\.?/i;
  const match = nombreProducto.match(patron);
  if (match) {
    const ancho = parseFloat(match[1].replace(',', '.'));
    const largo = parseFloat(match[3].replace(',', '.'));
    return { ancho, largo };
  }
  return null;
}

// Función para verificar si el nombre del producto ya contiene medidas
function nombreContieneMedidas(nombre) {
  return /(\d+[.,]?\d*)\s*[Mm]?\.?\s*[xX×]\s*(\d+[.,]?\d*)\s*[Mm]?\.?/i.test(nombre);
}

// Función para calcular diferencia numérica entre medidas
function calcularDiferencia(medidas1, medidas2) {
  if (!medidas1 || !medidas2) return Infinity;
  const diffAncho = Math.abs(medidas1.ancho - medidas2.ancho);
  const diffLargo = Math.abs(medidas1.largo - medidas2.largo);
  return diffAncho + diffLargo;
}

// Búsqueda por categoría principal
async function buscarPorCategoria(categoria, limite = 20) {
  try {
    const terminos = productCategories[categoria.toLowerCase()] || [categoria];
    
    const query = `
      SELECT TOP ${limite}
        pt.IDPROD,
        pt.NOMPROD, 
        pt.PRECIO,
        c.NOMCAT as CATEGORIA
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND (${terminos.map((_, i) => `pt.NOMPROD LIKE '%' + @${i} + '%'`).join(' OR ')})
      ORDER BY pt.NOMPROD
    `;

    return await databaseManager.executeQuery(query, terminos);
  } catch (error) {
    console.error("Error en búsqueda por categoría:", error);
    return [];
  }
}

// Búsqueda exacta por medidas
async function buscarPorMedidasExactas(medidasTarget, categoria = "alfombra") {
  try {
    const productos = await buscarPorCategoria(categoria, 100);
    const productosConMedidas = [];
    
    // Primera pasada: buscar coincidencia exacta
    for (const producto of productos) {
      const medidasProducto = extraerMedidasDeProducto(producto.NOMPROD);
      if (medidasProducto) {
        const diferencia = calcularDiferencia(medidasTarget, medidasProducto);
        productosConMedidas.push({ ...producto, medidas: medidasProducto, diferencia });
        
        // Coincidencia exacta
        if (diferencia === 0) {
          return [producto];
        }
      }
    }

    // Si no hay coincidencia exacta, encontrar la más cercana
    if (productosConMedidas.length > 0) {
      productosConMedidas.sort((a, b) => a.diferencia - b.diferencia);
      
      // Solo devolver si la diferencia es mínima (menos de 0.1 en total)
      if (productosConMedidas[0].diferencia < 0.1) {
        return [productosConMedidas[0]];
      }
      
      // Si no hay coincidencia cercana, devolver todas las opciones de la categoría
      return productos.filter(p => 
        p.NOMPROD.includes('ALFOMBRA') && p.NOMPROD.includes('M. X')
      ).slice(0, 5);
    }

    return [];
  } catch (error) {
    console.error("Error en búsqueda por medidas:", error);
    return [];
  }
}

// Búsqueda general inteligente
async function busquedaInteligente(termino) {
  // Detectar si es una búsqueda con medidas
  const medidas = extraerMedidasPrecisas(termino);
  if (medidas) {
    console.log(`📏 Búsqueda por medidas: ${medidas.ancho} x ${medidas.largo}`);
    
    // Determinar categoría basada en el término
    let categoria = "alfombra";
    const terminoLower = termino.toLowerCase();
    
    if (terminoLower.includes("cortina")) categoria = "cortina";
    else if (terminoLower.includes("cobertor") || terminoLower.includes("frazada")) categoria = "cobertor";
    
    const resultados = await buscarPorMedidasExactas(medidas, categoria);
    
    if (resultados.length === 1) {
      return resultados;
    } else if (resultados.length > 1) {
      // Si hay múltiples resultados cercanos, mostrar opciones
      return resultados;
    }
  }
  
  // Búsqueda general por categoría
  const terminoLower = termino.toLowerCase();
  let categoria = Object.keys(productCategories).find(key => terminoLower.includes(key));
  
  if (!categoria) {
    // Si no se encuentra categoría específica, buscar en alfombras por defecto
    categoria = "alfombra";
  }
  
  return await buscarPorCategoria(categoria, 10);
}

// Crear la herramienta de precisión
const precisionSearchTool = new DynamicStructuredTool({
  name: "consultar_precio",
  description: "Consulta precios exactos de servicios con matching numérico preciso de medidas",
  schema: paramsSchema,
  func: async ({ producto, telefono }) => {
    try {
      console.log(`🎯 Búsqueda precisa para: "${producto}"`);

      const resultados = await busquedaInteligente(producto);

      if (resultados.length === 0) {
        // If no results, but it's an alfombra search, show all alfombra options
        if (producto.toLowerCase().includes('alfombra')) {
          const alfombras = await buscarPorCategoria('alfombra', 10);
          if (alfombras.length > 0) {
            let respuesta = `No encontré la medida exacta, pero tenemos estas opciones de alfombras:\n\n`;
            alfombras.forEach((prod, index) => {
              // Solo agregar medidas si el nombre no las contiene ya
              const medidas = extraerMedidasDeProducto(prod.NOMPROD);
              const infoMedidas = (medidas && !nombreContieneMedidas(prod.NOMPROD)) ? ` (${medidas.ancho} x ${medidas.largo} m)` : '';
              respuesta += `${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}${infoMedidas}\n`;
            });
            respuesta += `\n¿Te interesa alguna de estas?`;
            return respuesta;
          }
        }
        return `No encontré servicios que coincidan con "${producto}". ¿Podrías ser más específico? Por ejemplo: "alfombra 2x3", "cortina mediana", etc.`;
      }

      if (resultados.length === 1) {
        const prod = resultados[0];
        return `${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`;
      }

      // Mostrar múltiples opciones
      let respuesta = `Encontré ${resultados.length} opciones para "${producto}":\n\n`;
      
      resultados.forEach((prod, index) => {
        // Solo agregar medidas si el nombre no las contiene ya
        const medidas = extraerMedidasDeProducto(prod.NOMPROD);
        const infoMedidas = (medidas && !nombreContieneMedidas(prod.NOMPROD)) ? ` (${medidas.ancho} x ${medidas.largo} m)` : '';
        respuesta += `${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}${infoMedidas}\n`;
      });

      respuesta += `\n¿Cuál de estas opciones te interesa? Puedo darte más detalles.`;

      return respuesta;

    } catch (error) {
      console.error("Error en precisionSearchTool:", error);
      return "Disculpa, tuve un problema al consultar los precios. ¿Podrías intentar nuevamente?";
    }
  }
});

export default precisionSearchTool;
