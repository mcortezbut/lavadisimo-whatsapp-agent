import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import databaseManager from './databaseManager.js';

// Schema for context management
const contextSchema = z.object({
  telefono: z.string().min(8, "Teléfono debe tener al menos 8 dígitos"),
  mensaje: z.string().optional(),
  servicio: z.string().optional(),
  variantes: z.object({
    tamaño: z.string().optional(),
    material: z.string().optional(),
    atributo: z.string().optional()
  }).optional()
});

// Context storage - in production this would be a database table
const activeContexts = new Map();

// Get all available services from database for dynamic detection
async function obtenerServiciosDeBaseDeDatos() {
  try {
    const result = await databaseManager.executeQuery(
      `SELECT DISTINCT UPPER(LEFT(CATEGORIA, 1)) + LOWER(SUBSTRING(CATEGORIA, 2, LEN(CATEGORIA))) as categoria 
       FROM PRODUCTOS 
       WHERE CATEGORIA IS NOT NULL AND CATEGORIA != ''`
    );
    
    const servicios = result.map(row => row.categoria.toLowerCase());
    return [...new Set(servicios)]; // Remove duplicates
  } catch (error) {
    console.error("Error obteniendo servicios de base de datos:", error);
    // Fallback to basic services
    return ['alfombra', 'cortina', 'poltrona', 'silla', 'butaca', 'sofa', 'cobertor', 'coche', 'vehículo', 'ropa', 'colchón', 'mueble'];
  }
}

// Enhanced context extraction with AI-powered intent recognition
async function extraerContextoInteligente(mensaje, historial = [], telefono) {
  const contexto = {
    servicio: null,
    variantes: {
      tamaño: null,
      material: null,
      atributo: null
    },
    intencion: null,
    esRespuestaContextual: false
  };

  const mensajeLower = mensaje.toLowerCase().trim();

  // Get dynamic services from database
  const servicios = await obtenerServiciosDeBaseDeDatos();

  // 1. Check if current message contains a service
  contexto.servicio = servicios.find(servicio => 
    mensajeLower.includes(servicio) && mensajeLower.length > servicio.length + 2
  );

  // 2. If no service detected, analyze conversation context
  if (!contexto.servicio && historial.length > 0) {
    const ultimoMensajeAgente = historial.filter(msg => msg.tipo === 'agente').pop();
    const ultimoMensajeCliente = historial.filter(msg => msg.tipo === 'cliente').pop();

    // Check if this is a response to agent's question about size/material
    if (ultimoMensajeAgente && 
        (ultimoMensajeAgente.mensaje.toLowerCase().includes('tamaño') ||
         ultimoMensajeAgente.mensaje.toLowerCase().includes('medida') ||
         ultimoMensajeAgente.mensaje.toLowerCase().includes('material'))) {
      
      // Extract service from agent's last question
      const servicioEnPregunta = servicios.find(servicio => 
        ultimoMensajeAgente.mensaje.toLowerCase().includes(servicio)
      );
      
      if (servicioEnPregunta) {
        contexto.servicio = servicioEnPregunta;
        contexto.esRespuestaContextual = true;
      }
    }

    // Check last client message for service context
    if (!contexto.servicio && ultimoMensajeCliente) {
      contexto.servicio = servicios.find(servicio => 
        ultimoMensajeCliente.mensaje.toLowerCase().includes(servicio)
      );
    }
  }

  // 3. Detect variants with improved pattern matching
  const tamanos = ['chica', 'pequeña', 'mediana', 'media', 'grande', 'extra grande', 'xl', 'pequeño', 'mediano', 'grande'];
  const materiales = ['sintético', 'poliester', 'pluma', 'seda', 'lana', 'algodón', 'cuero', 'piel', 'spandex', 'lino'];
  const atributos = ['extra', 'simple', 'básico', 'premium', 'doble', 'individual', 'familiar'];

  // Improved variant detection with context awareness
  contexto.variantes.tamaño = tamanos.find(tamano => 
    mensajeLower.includes(tamano) && !contexto.esRespuestaContextual
  );

  contexto.variantes.material = materiales.find(material => 
    mensajeLower.includes(material)
  );

  contexto.variantes.atributo = atributos.find(atributo => 
    mensajeLower.includes(atributo)
  );

  // 4. Detect intent
  if (mensajeLower.includes('cuanto') || mensajeLower.includes('precio') || 
      mensajeLower.includes('cuesta') || mensajeLower.includes('valor')) {
    contexto.intencion = 'consulta_precio';
  } else if (mensajeLower.includes('servicio') || mensajeLower.includes('ofrecen') || 
             mensajeLower.includes('tienen')) {
    contexto.intencion = 'consulta_servicios';
  } else if (contexto.variantes.tamaño || contexto.variantes.material) {
    contexto.intencion = 'especificacion_variante';
  } else {
    contexto.intencion = 'conversacion_general';
  }

  return contexto;
}

// Enhanced context manager with database integration
const contextManagerTool = new DynamicStructuredTool({
  name: "gestionar_contexto",
  description: "Gestiona el contexto de la conversación para mantener coherencia en diálogos",
  schema: contextSchema,
  func: async ({ telefono, mensaje, servicio, variantes }) => {
    try {
      const telefonoLimpio = telefono.replace(/\D/g, '');
      
      // Get or create context for this phone number
      let contexto = activeContexts.get(telefonoLimpio) || {
        servicio: null,
        variantes: { tamaño: null, material: null, atributo: null },
        ultimoMensaje: null,
        ultimaPreguntaAgente: null,
        historial: [],
        timestamp: new Date()
      };

      // Update context with new information
      if (mensaje) {
        const nuevoContexto = await extraerContextoInteligente(mensaje, contexto.historial, telefonoLimpio);
        
        // Update context with intelligent detection
        if (nuevoContexto.servicio) contexto.servicio = nuevoContexto.servicio;
        if (nuevoContexto.variantes.tamaño) contexto.variantes.tamaño = nuevoContexto.variantes.tamaño;
        if (nuevoContexto.variantes.material) contexto.variantes.material = nuevoContexto.variantes.material;
        if (nuevoContexto.variantes.atributo) contexto.variantes.atributo = nuevoContexto.variantes.atributo;
        
        contexto.ultimoMensaje = mensaje;
        contexto.historial.push({ 
          mensaje, 
          tipo: 'cliente',
          timestamp: new Date(),
          contexto: { ...nuevoContexto }
        });
        
        // Keep only last 20 messages for better context
        if (contexto.historial.length > 20) {
          contexto.historial = contexto.historial.slice(-20);
        }
      }

      // Override with explicit values if provided
      if (servicio) contexto.servicio = servicio;
      if (variantes) {
        if (variantes.tamaño) contexto.variantes.tamaño = variantes.tamaño;
        if (variantes.material) contexto.variantes.material = variantes.material;
        if (variantes.atributo) contexto.variantes.atributo = variantes.atributo;
      }

      contexto.timestamp = new Date();
      
      // Save updated context
      activeContexts.set(telefonoLimpio, contexto);

      return JSON.stringify({
        servicio: contexto.servicio,
        variantes: contexto.variantes,
        ultimoMensaje: contexto.ultimoMensaje,
        esRespuestaContextual: contexto.historial.length > 0 ? 
          contexto.historial[contexto.historial.length - 1].contexto?.esRespuestaContextual : false
      });
    } catch (error) {
      console.error("Error gestionando contexto:", error);
      return "Error al gestionar el contexto de conversación";
    }
  }
});

// Enhanced context retrieval with conversation analysis
const obtenerContextoTool = new DynamicStructuredTool({
  name: "obtener_contexto",
  description: "Obtiene el contexto actual de la conversación con análisis inteligente",
  schema: z.object({
    telefono: z.string().min(8, "Teléfono debe tener al menos 8 dígitos")
  }),
  func: async ({ telefono }) => {
    try {
      const telefonoLimpio = telefono.replace(/\D/g, '');
      const contexto = activeContexts.get(telefonoLimpio);
      
      if (!contexto) {
        return JSON.stringify({
          servicio: null,
          variantes: { tamaño: null, material: null, atributo: null },
          historialVacio: true
        });
      }

      // Analyze conversation to provide intelligent context
      const ultimoMensajeCliente = contexto.historial
        .filter(msg => msg.tipo === 'cliente')
        .pop();
      
      const ultimaPreguntaAgente = contexto.historial
        .filter(msg => msg.tipo === 'agente')
        .pop();

      const esRespuestaDirecta = ultimaPreguntaAgente && ultimoMensajeCliente &&
        (ultimaPreguntaAgente.mensaje.toLowerCase().includes('tamaño') ||
         ultimaPreguntaAgente.mensaje.toLowerCase().includes('medida') ||
         ultimaPreguntaAgente.mensaje.toLowerCase().includes('material'));

      return JSON.stringify({
        servicio: contexto.servicio,
        variantes: contexto.variantes,
        ultimoMensaje: contexto.ultimoMensaje,
        esRespuestaDirecta: esRespuestaDirecta,
        timestamp: contexto.timestamp,
        cantidadMensajes: contexto.historial.length
      });
    } catch (error) {
      console.error("Error obteniendo contexto:", error);
      return "Error al obtener el contexto de conversación";
    }
  }
});

// Function to record agent messages for better context tracking
function registrarMensajeAgente(telefono, mensaje) {
  try {
    const telefonoLimpio = telefono.replace(/\D/g, '');
    let contexto = activeContexts.get(telefonoLimpio);
    
    if (!contexto) {
      contexto = {
        servicio: null,
        variantes: { tamaño: null, material: null, atributo: null },
        ultimoMensaje: null,
        ultimaPreguntaAgente: mensaje,
        historial: [],
        timestamp: new Date()
      };
    } else {
      contexto.ultimaPreguntaAgente = mensaje;
    }
    
    contexto.historial.push({
      mensaje,
      tipo: 'agente',
      timestamp: new Date()
    });
    
    activeContexts.set(telefonoLimpio, contexto);
  } catch (error) {
    console.error("Error registrando mensaje de agente:", error);
  }
}

// Intelligent query builder with context awareness
function construirConsultaContextual(contexto) {
  if (!contexto.servicio) return "";

  let consulta = contexto.servicio + " ";

  // Add variants only if they make sense in context
  if (contexto.variantes.tamaño) {
    consulta += contexto.variantes.tamaño + " ";
  }

  if (contexto.variantes.material) {
    consulta += contexto.variantes.material + " ";
  }

  if (contexto.variantes.atributo) {
    consulta += contexto.variantes.atributo + " ";
  }

  return consulta.trim();
}

// Clear context for a phone number (useful for testing)
function limpiarContexto(telefono) {
  const telefonoLimpio = telefono.replace(/\D/g, '');
  activeContexts.delete(telefonoLimpio);
}

export { 
  contextManagerTool, 
  obtenerContextoTool, 
  construirConsultaContextual, 
  registrarMensajeAgente,
  limpiarContexto
};
