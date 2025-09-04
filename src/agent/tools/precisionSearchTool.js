import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import databaseManager from './databaseManager.js';

// Schema Zod para validación
const paramsSchema = z.object({
  producto: z.string().min(2, "Mínimo 2 caracteres"),
  telefono: z.string().optional()
});

// Sistema de búsqueda por precisión numérica con categorías expandidas
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
  "carrito": ["COCHE"],
  "auto": ["AUTO"],
  "butaca": ["BUTACA"],
  "poltrona": ["POLTRONA", "BUTACA", "SILLA"],
  "silla": ["SILLA"],
  "sofa": ["SOFA", "SILLON"],
  "sillon": ["SILLON"],
  "colchon": ["COLCHON"],
  "almohada": ["ALMOHADA"],
  "fundas": ["FUNDA"],
  "funda": ["FUNDA"],
  "tapiz": ["TAPIZ"],
  "plumon": ["PLUMON"],
  "seda": ["SEDA"],
  "cojin": ["COJIN"],
  "cojines": ["COJIN"]
};

// Función para extraer medidas numéricas de texto con alta precisión
function extraerMedidasPrecisas(texto) {
  const patrones = [
    // Formato con M. (ej: "1,6 M. X 2,3 M.") - ahora maneja enteros y decimales
    /(\d+[.,]?\d*)\s*M\.\s*X\s*(\d+[.,]?\d*)\s*M\./,
    // Formato sin M. (ej: "1,6x2,3" o "2x3") - maneja enteros como decimales
    /(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)/,
    // Formato con palabras (ej: "1,6 por 2,3") - maneja enteros como decimales
    /(\d+[.,]?\d*)\s*por\s*(\d+[.,]?\d*)/i,
    // Formato en contexto (ej: "la de 1,6 x 2,3" o "una de 2x3") - maneja enteros como decimales
    /(?:la|el|de|una|un)\s+.*?(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)/i,
    // Formato con "por" (ej: "160 por 230")
    /(\d+[.,]?\d*)\s*por\s*(\d+[.,]?\d*)/i
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      // Convertir a números, manejando tanto enteros como decimales
      let ancho = parseFloat(match[1].replace(',', '.'));
      let largo = parseFloat(match[2].replace(',', '.'));
      
      // Detectar si son medidas en centímetros (números grandes > 10)
      // y convertirlos a metros dividiendo por 100
      if (ancho > 10 && largo > 10) {
        ancho = ancho / 100;
        largo = largo / 100;
      }
      
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

// Función para extraer términos de variante (tamaño, material, etc.) desde la consulta
function extraerVariantesDeConsulta(consulta) {
  const consultaLower = consulta.toLowerCase();
  const variantes = {
    tamanos: [],
    materiales: [],
    atributos: []
  };

  // Extraer tamaños
  const patronesTamanos = [
    /\b(chica|pequeña|small|s)\b/i,
    /\b(mediana|media|medium|m)\b/i,
    /\b(grande|large|l|xl)\b/i,
    /\b(extra grande|extra grande|xxl)\b/i
  ];
  
  patronesTamanos.forEach(patron => {
    const match = consultaLower.match(patron);
    if (match) {
      variantes.tamanos.push(match[0]);
    }
  });

  // Extraer materiales
  const patronesMateriales = [
    /\b(sintético|sintetica|poliester|polyester)\b/i,
    /\b(pluma|plumas|feather|down)\b/i,
    /\b(seda|silk|satén|saten)\b/i,
    /\b(lana|wool)\b/i
  ];
  
  patronesMateriales.forEach(patron => {
    const match = consultaLower.match(patron);
    if (match) {
      variantes.materiales.push(match[0]);
    }
  });

  // Extraer atributos
  const patronesAtributos = [
    /\b(extra|especial|premium|deluxe)\b/i,
    /\b(simple|básico|basico|standard)\b/i,
    /\b(doble|double|king|queen)\b/i
  ];
  
  patronesAtributos.forEach(patron => {
    const match = consultaLower.match(patron);
    if (match) {
      variantes.atributos.push(match[0]);
    }
  });

  return variantes;
}

// Función para filtrar productos por variantes extraídas de la consulta
function filtrarPorVariantes(productos, variantes) {
  if (variantes.tamanos.length === 0 && variantes.materiales.length === 0 && variantes.atributos.length === 0) {
    return productos;
  }

  return productos.filter(producto => {
    const nombreLower = producto.NOMPROD.toLowerCase();
    
    // Verificar si coincide con algún tamaño especificado
    if (variantes.tamanos.length > 0) {
      const coincideTamano = variantes.tamanos.some(tamano => 
        nombreLower.includes(tamano.toLowerCase())
      );
      if (!coincideTamano) return false;
    }
    
    // Verificar si coincide con algún material especificado
    if (variantes.materiales.length > 0) {
      const coincideMaterial = variantes.materiales.some(material => 
        nombreLower.includes(material.toLowerCase())
      );
      if (!coincideMaterial) return false;
    }
    
    // Verificar si coincide con algún atributo especificado
    if (variantes.atributos.length > 0) {
      const coincideAtributo = variantes.atributos.some(atributo => 
        nombreLower.includes(atributo.toLowerCase())
      );
      if (!coincideAtributo) return false;
    }
    
    return true;
  });
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
  
  // Detectar materiales (sintético, pluma, seda, etc.) basados en lo que existe en la base de datos
  const patronesMateriales = [
    /\b(sintético|sintetica|poliester|polyester)\b/i,
    /\b(pluma|plumas|feather|down)\b/i,
    /\b(seda|silk|satén|saten)\b/i,
    /\b(lana|wool)\b/i
  ];
  
  const tienenMateriales = nombres.some(nombre => 
    patronesMateriales.some(patron => patron.test(nombre))
  );
  
  if (tienenMateriales) {
    return { tipo: "material", mensaje: "¿Qué material prefieres? (sintético, pluma, seda, lana)" };
  }
  
  // Detectar atributos especiales como "extra" para cobertores
  const patronesAtributos = [
    /\b(extra|especial|premium|deluxe)\b/i,
    /\b(simple|básico|basico|standard)\b/i,
    /\b(doble|double|king|queen)\b/i
  ];
  
  const tienenAtributos = nombres.some(nombre => 
    patronesAtributos.some(patron => patron.test(nombre))
  );
  
  if (tienenAtributos) {
    return { tipo: "atributo", mensaje: "¿Prefieres versión simple or extra? Tenemos opciones con y sin relleno adicional." };
  }
  
  // Detectar tipos específicos de productos
  if (nombres.some(nombre => nombre.includes('POLTRONA') || nombre.includes('SILLA') || nombre.includes('BUTACA'))) {
    return { tipo: "mueble", mensaje: "¿Para qué tipo de mueble necesitas el servicio? (poltrona, silla, butaca)" };
  }
  
  if (nombres.some(nombre => nombre.includes('COBERTOR') || nombre.includes('FRAZADA'))) {
    return { tipo: "cama", mensaje: "¿Qué tipo de cobertor necesitas? Tenemos simples, extra con relleno, y de diferentes materiales." };
  }
  
  if (nombres.some(nombre => nombre.includes('CORTINA'))) {
    return { tipo: "cortina", mensaje: "¿Qué tipo de cortina? Tenemos de diferentes telas, black out, roller, y medidas." };
  }
  
  // Si no se detecta variante específica, devolver opciones generales con lista de productos
  let respuesta = "Tenemos varias opciones disponibles:\n\n";
  productos.forEach((prod, index) => {
    respuesta += `${index + 1}. ${prod.NOMPROD}: ${formatearPrecio(prod.PRECIO)}\n`;
  });
  respuesta += "\n¿Podrías darme más detalles sobre lo que necesitas? Por ejemplo: tamaño, material, o características específicas.";
  
  return { tipo: "opciones", mensaje: respuesta };
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

// Función para obtener todas las categorías disponibles de la base de datos con nombres mejorados
async function obtenerCategoriasDisponibles() {
  try {
    const query = `
      SELECT DISTINCT c.NOMCAT 
      FROM CATEGORIAS c
      INNER JOIN PRODUCTOS p ON c.IDGRUPO = p.IDGRUPO
      WHERE p.IDUSUARIO = 'lavadisimo' AND p.NULO = 0
      ORDER BY c.NOMCAT
    `;
    
    const categorias = await databaseManager.executeQuery(query, []);
    
    // Mapear nombres de categorías a versiones más descriptivas y user-friendly
    const categoriasMejoradas = categorias.map(cat => {
      const nombre = cat.NOMCAT;
      const nombreLower = nombre.toLowerCase().trim();
      
      // Mejorar nombres específicos con coincidencia insensible a mayúsculas y espacios
      if (nombreLower.includes('muro') || nombreLower === 'muro a muro') {
        return 'alfombras muro a muro (limpieza de pisos de habitaciones y salones)';
      }
      if (nombreLower === 'otros') {
        return null; // Excluir "otros" de la lista principal
      }
      if (nombreLower.includes('cortina') || nombreLower.includes('visillo')) {
        return 'cortinas';
      }
      if (nombreLower.includes('tela') || nombreLower.includes('vestuario') || nombreLower.includes('ropa')) {
        return 'ropa y vestuario';
      }
      if (nombreLower.includes('sofá') || nombreLower.includes('silla') || nombreLower.includes('butaca') || nombreLower.includes('poltrona') || nombreLower.includes('mueble')) {
        return 'muebles (sofás, sillas, poltronas)';
      }
      if (nombreLower.includes('alfombra')) {
        return 'alfombras';
      }
      if (nombreLower.includes('vehículo') || nombreLower.includes('auto') || nombreLower.includes('coche')) {
        return 'vehículos';
      }
      if (nombreLower.includes('ropa de cama') || nombreLower.includes('colchón') || nombreLower.includes('almohada') || nombreLower.includes('cobertor')) {
        return nombre; // Mantener estos nombres como están
      }
      
      return nombre;
    }).filter(cat => cat !== null); // Filtrar categorías excluidas

    // Ordenar categorías: poner las más comunes primero
    const ordenPreferido = [
      'alfombras',
      'alfombras muro a muro (limpieza de pisos de habitaciones y salones)',
      'cortinas',
      'ropa y vestuario',
      'ropa de cama',
      'colchones',
      'muebles (sofás, sillas, poltronas)',
      'vehículos'
    ];

    // Ordenar según el orden preferido
    categoriasMejoradas.sort((a, b) => {
      const indexA = ordenPreferido.findIndex(item => a.toLowerCase().includes(item.toLowerCase()));
      const indexB = ordenPreferido.findIndex(item => b.toLowerCase().includes(item.toLowerCase()));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });

    // Añadir "otros servicios" al final si existe la categoría "otros"
    const tieneOtros = categorias.some(cat => cat.NOMCAT.toLowerCase() === 'otros');
    if (tieneOtros) {
      categoriasMejoradas.push('y otros servicios más');
    }

    return categoriasMejoradas;
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    // Fallback a categorías predefinidas si hay error
    return [
      "alfombras",
      "alfombras muro a muro (limpieza de pisos de habitaciones y salones)",
      "cortinas",
      "ropa y vestuario",
      "ropa de cama",
      "colchones",
      "muebles (sofás, sillas, poltronas)",
      "vehículos",
      "y otros servicios más"
    ];
  }
}

// Búsqueda por categoría principal - SIN límites y con JOIN para evitar duplicados
async function buscarPorCategoria(categoria) {
  try {
    const terminos = productCategories[categoria.toLowerCase()] || [categoria];
    
    const query = `
      SELECT
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
    const productos = await buscarPorCategoria(categoria);
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
      );
    }

    return productos.filter(p => p.NOMPROD.includes('ALFOMBRA'));
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
    
    return await buscarPorCategoria(categoria);
  }

// Crear la herramienta de precisión
const precisionSearchTool = new DynamicStructuredTool({
  name: "consultar_precio",
  description: "Consulta precios exactos de servicios con matching numérico preciso de medidas",
  schema: paramsSchema,
  func: async ({ producto, telefono }) => {
    try {
      console.log(`🎯 Búsqueda precisa para: "${producto}"`);

      // Manejar consultas generales de servicios
      const productoLower = producto.toLowerCase();
      if (productoLower.includes('servicio') || productoLower.includes('qué servicio') || 
          productoLower.includes('que servicio') || productoLower.includes('qué tienen') || 
          productoLower.includes('que tienen') || productoLower === 'servicios') {
        const categorias = await obtenerCategoriasDisponibles();
        if (categorias.length > 0) {
          return `Ofrecemos servicios de lavado para: ${categorias.join(', ')}. ¿Qué servicio específico te interesa?`;
        } else {
          return "Ofrecemos servicios de lavado para alfombras, cortinas, ropa, cobertores, poltronas, sillones, butacas, coches bebé y tapicería de vehículos. ¿Qué servicio te interesa?";
        }
      }

      // Extraer medidas del input para usar en respuestas personalizadas
      const medidasInput = extraerMedidasPrecisas(producto);

      const resultados = await busquedaInteligente(producto);

      // Extraer variantes de la consulta (tamaños, materiales, etc.)
      const variantesConsulta = extraerVariantesDeConsulta(producto);
      
      // Si se especificaron variantes en la consulta, filtrar los resultados
      let resultadosFiltrados = resultados;
      if (variantesConsulta.tamanos.length > 0 || variantesConsulta.materiales.length > 0 || variantesConsulta.atributos.length > 0) {
          resultadosFiltrados = filtrarPorVariantes(resultados, variantesConsulta);
      }

      if (resultadosFiltrados.length === 0) {
        // Si no hay resultados después de filtrar, mostrar opciones originales pero mencionando que no hay coincidencia con las variantes
        if (resultados.length > 0) {
          let respuesta = `No encontré "${producto}" exactamente, pero tenemos estas opciones:\n\n`;
          resultados.forEach((prod, index) => {
            const medidasProd = extraerMedidasDeProducto(prod.NOMPROD);
            const infoMedidas = medidasProd ? ` (${medidasProd.ancho} x ${medidasProd.largo} m)` : '';
            respuesta += `${index + 1}. ${prod.NOMPROD}: ${formatearPrecio(prod.PRECIO)}${infoMedidas}\n`;
          });
          respuesta += `\n¿Te interesa alguna de estas?`;
          return respuesta;
        }
        // If no results, but it's an alfombra search or measures were provided, show all alfombra options
        if (medidasInput || producto.toLowerCase().includes('alfombra')) {
          const alfombras = await buscarPorCategoria('alfombra');
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

      if (resultadosFiltrados.length === 1) {
        const prod = resultadosFiltrados[0];
        const precioFormateado = formatearPrecio(prod.PRECIO);
        return `${prod.NOMPROD}: ${precioFormateado}`;
      }

      // Si hay múltiples resultados, verificar si se proporcionaron medidas
      if (medidasInput) {
        // Medidas proporcionadas pero no coincidencia exacta, mostrar opciones disponibles
        let respuesta = `No encontré una alfombra exactamente de ${medidasInput.ancho} x ${medidasInput.largo} metros, pero tenemos estas opciones:\n\n`;
        resultadosFiltrados.forEach((prod, index) => {
          const medidasProd = extraerMedidasDeProducto(prod.NOMPROD);
          const infoMedidas = medidasProd ? ` (${medidasProd.ancho} x ${medidasProd.largo} m)` : '';
          respuesta += `${index + 1}. ${prod.NOMPROD}: ${formatearPrecio(prod.PRECIO)}${infoMedidas}\n`;
        });
        respuesta += `\n¿Te interesa alguna de estas?`;
        return respuesta;
      } else {
        // No se proporcionaron medidas, detectar variantes pero solo si no se especificaron en la consulta
        if (variantesConsulta.tamanos.length > 0 || variantesConsulta.materiales.length > 0 || variantesConsulta.atributos.length > 0) {
          // Variantes ya especificadas, mostrar opciones filtradas
          let respuesta = `Tenemos estas opciones para "${producto}":\n\n`;
          resultadosFiltrados.forEach((prod, index) => {
            respuesta += `${index + 1}. ${prod.NOMPROD}: ${formatearPrecio(prod.PRECIO)}\n`;
          });
          respuesta += `\n¿Te interesa alguna de estas?`;
          return respuesta;
        } else {
          // No variantes especificadas, detectar y preguntar
          const variante = detectarVariantes(resultadosFiltrados);
          return variante.mensaje;
        }
      }

    } catch (error) {
      console.error("Error en precisionSearchTool:", error);
      return "Disculpa, tuve un problema al consultar los precios. ¿Podrías intentar nuevamente?";
    }
  }
});

export default precisionSearchTool;
export { extraerMedidasDeProducto, buscarPorMedidasExactas };
