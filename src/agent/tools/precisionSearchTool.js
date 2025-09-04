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
    // Formato con M. (ej: "1,6 M. X 2,3 M.") - ahora maneja enteros y decimales
    /(\d+[.,]?\d*)\s*M\.\s*X\s*(\d+[.,]?\d*)\s*M\./,
    // Formato sin M. (ej: "1,6x2,3" o "2x3") - maneja enteros y decimales
    /(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)/,
    // Formato con palabras (ej: "1,6 por 2,3") - maneja enteros y decimales
    /(\d+[.,]?\d*)\s*por\s*(\d+[.,]?\d*)/i,
    // Formato en contexto (ej: "la de 1,6 x 2,3" o "una de 2x3") - maneja enteros y decimales
    /(?:la|el|de|una|un)\s+.*?(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)/i
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      // Convertir a números, manejando tanto enteros como decimales
      const ancho = parseFloat(match[1].replace(',', '.'));
      const largo = parseFloat(match[2].replace(',', '.'));
      
      // Verificar que son números válidos y mayores que 0
      if (!isNaN(ancho) && !isNaN(largo) && ancho > 0 && largo > 0) {
        return { ancho, largo, original: match[0] };
      }
    }
  }
  return null;
}

// Función para extraer medidas de nombres de productos (ej: "ALFOMBRA 1,6 M. X 2,3 M." o "ALFOMBRA 2 M. X 3 M.")
function extraerMedidasDeProducto(nombreProducto) {
  if (!nombreProducto || typeof nombreProducto !== 'string') {
    return null;
  }
  
  const patron = /(\d+[.,]?\d*)\s*(?:[Mm]\.?)?\s*[xX×]\s*(\d+[.,]?\d*)\s*(?:[Mm]\.?)?/i;
  const match = nombreProducto.match(patron);
  
  if (match && match[1] && match[2]) {
    try {
      const anchoStr = match[1];
      const largoStr = match[2];
      // Verificación adicional por si acaso
      if (!anchoStr || !largoStr) {
        return null;
      }
      const ancho = parseFloat(anchoStr.replace(',', '.'));
      const largo = parseFloat(largoStr.replace(',', '.'));
      
      // Verificar que los valores son números válidos
      if (!isNaN(ancho) && !isNaN(largo)) {
        return { ancho, largo };
      }
    } catch (error) {
      console.error("Error parsing measures:", error);
    }
  }
  return null;
}

// Función para verificar si el nombre del producto ya contiene medidas
function nombreContieneMedidas(nombre) {
  return /(\d+[.,]?\d*)\s*(?:[Mm]\.?)?\s*[xX×]\s*(\d+[.,]?\d*)\s*(?:[Mm]\.?)?/i.test(nombre);
}

// Función para calcular diferencia numérica entre medidas
function calcularDiferencia(medidas1, medidas2) {
  if (!medidas1 || !medidas2) return Infinity;
  const diffAncho = Math.abs(medidas1.ancho - medidas2.ancho);
  const diffLargo = Math.abs(medidas1.largo - medidas2.largo);
  return diffAncho + diffLargo;
}

// Función para detectar variantes en una lista de productos
function detectarVariantes(productos) {
  const nombres = productos.map(p => p.NOMPROD);
  
  // Detectar si hay medidas en los nombres
  const tienenMedidas = nombres.some(nombre => extraerMedidasDeProducto(nombre));
  if (tienenMedidas) {
    return { tipo: "medida", mensaje: "¿Podrías especificar las medidas? Por ejemplo: 0,6 x 1,10" };
  }
  
  // Detectar tamaños (chica, mediana, grande, etc.)
  const patronesTamanos = [
    /\b(chica|pequeña|small|s)\b/i,
    /\b(mediana|media|medium|m)\b/i,
    /\b(grande|large|l|xl)\b/i,
    /\b(extra grande|extra grande|xxl)\b/i
  ];
  
  const tienenTamanos = nombres.some(nombre => 
    patronesTamanos.some(patron => patron.test(nombre))
  );
  
  if (tienenTamanos) {
    return { tipo: "tamaño", mensaje: "¿Qué tamaño necesitas? (chica, mediana, grande)" };
  }
  
  // Si no se detecta variante específica, devolver opciones generales
  return { 
    tipo: "opciones", 
    mensaje: "Tenemos varias opciones disponibles. ¿Podrías darme más detalles sobre lo que necesitas?"
  };
}

// Función para formatear precio correctamente
function formatearPrecio(precio) {
  // Asegurar que el precio sea un número
  const precioNum = Number(precio);
  if (isNaN(precioNum)) {
    return precio; // Devolver original si no es número
  }
  return `$${precioNum.toLocaleString('es-CL')}`;
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
        p.NOMPROD.includes('ALFOMBRA')
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

      // Extraer medidas del input para usar en respuestas personalizadas
      const medidasInput = extraerMedidasPrecisas(producto);

      const resultados = await busquedaInteligente(producto);

      if (resultados.length === 0) {
        // If no results, but it's an alfombra search or measures were provided, show all alfombra options
        if (medidasInput || producto.toLowerCase().includes('alfombra')) {
          const alfombras = await buscarPorCategoria('alfombra', 10);
          if (alfombras.length > 0) {
            // Si se proporcionaron medidas, mostrar opciones con mensaje específico
            if (medidasInput) {
              let respuesta = `No encontré una alfombra exactamente de ${medidasInput.ancho} x ${medidasInput.largo} metros, pero tenemos estas opciones:\n\n`;
              alfombras.forEach((prod, index) => {
                const medidasProd = extraerMedidasDeProducto(prod.NOMPROD);
                const infoMedidas = medidasProd ? ` (${medidasProd.ancho} x ${medidasProd.largo} m)` : '';
                respuesta += `${index + 1}. ${prod.NOMPROD}: ${formatearPrecio(prod.PRECIO)}${infoMedidas}\n`;
              });
              respuesta += `\n¿Te interesa alguna de estas?`;
              return respuesta;
            } else {
              const variante = detectarVariantes(alfombras);
              return `No encontré exactamente lo que buscas, pero tenemos ${alfombras.length} opciones de alfombras. ${variante.mensaje}`;
            }
          }
        }
        return `No encontré servicios que coincidan con "${producto}". ¿Podrías ser más específico? Por ejemplo: "alfombra 2x3", "cortina mediana", etc.`;
      }

      if (resultados.length === 1) {
        const prod = resultados[0];
        const precioFormateado = formatearPrecio(prod.PRECIO);
        return `${prod.NOMPROD}: ${precioFormateado}`;
      }

      // Si hay múltiples resultados, verificar si se proporcionaron medidas
      if (medidasInput) {
        // Medidas proporcionadas pero no coincidencia exacta, mostrar opciones disponibles
        let respuesta = `No encontré una alfombra exactamente de ${medidasInput.ancho} x ${medidasInput.largo} metros, pero tenemos estas opciones:\n\n`;
        resultados.forEach((prod, index) => {
          const medidasProd = extraerMedidasDeProducto(prod.NOMPROD);
          const infoMedidas = medidasProd ? ` (${medidasProd.ancho} x ${medidasProd.largo} m)` : '';
          respuesta += `${index + 1}. ${prod.NOMPROD}: ${formatearPrecio(prod.PRECIO)}${infoMedidas}\n`;
        });
        respuesta += `\n¿Te interesa alguna de estas?`;
        return respuesta;
      } else {
        // No se proporcionaron medidas, detectar variantes
        const variante = detectarVariantes(resultados);
        return variante.mensaje;
      }

    } catch (error) {
      console.error("Error en precisionSearchTool:", error);
      return "Disculpa, tuve un problema al consultar los precios. ¿Podrías intentar nuevamente?";
    }
  }
});

export default precisionSearchTool;
export { extraerMedidasDeProducto, buscarPorMedidasExactas };
