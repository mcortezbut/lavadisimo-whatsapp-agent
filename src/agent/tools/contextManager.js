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

// Function to extract context from message
function extraerContextoDeMensaje(mensaje, historial = []) {
  const contexto = {
    servicio: null,
    variantes: {
      tamaño: null,
      material: null,
      atributo: null
    }
  };

  const mensajeLower = mensaje.toLowerCase();

  // Detect service from message or history
  const servicios = ['alfombra', 'cortina', 'poltrona', 'silla', 'butaca', 'sofa', 'cobertor', 'coche', 'vehículo', 'ropa'];
  contexto.servicio = servicios.find(servicio => mensajeLower.includes(servicio));

      // If no service detected, check history
      if (!contexto.servicio && historial.length > 0) {
        const ultimoMensaje = historial[historial.length - 1].mensaje.toLowerCase();
        contexto.servicio = servicios.find(servicio => ultimoMensaje.includes(servicio));
      }

  // Detect variants
  const tamanos = ['chica', 'pequeña', 'mediana', 'media', 'grande', 'extra grande', 'xl'];
  const materiales = ['sintético', 'poliester', 'pluma', 'seda', 'lana', 'algodón'];
  const atributos = ['extra', 'simple', 'básico', 'premium', 'doble'];

  contexto.variantes.tamaño = tamanos.find(tamano => mensajeLower.includes(tamano));
  contexto.variantes.material = materiales.find(material => mensajeLower.includes(material));
  contexto.variantes.atributo = atributos.find(atributo => mensajeLower.includes(atributo));

  return contexto;
}

// Tool to manage conversation context
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
        historial: []
      };

      // Update context with new information
      if (mensaje) {
        const nuevoContexto = extraerContextoDeMensaje(mensaje, contexto.historial);
        
        // Only update if new information is detected
        if (nuevoContexto.servicio) contexto.servicio = nuevoContexto.servicio;
        if (nuevoContexto.variantes.tamaño) contexto.variantes.tamaño = nuevoContexto.variantes.tamaño;
        if (nuevoContexto.variantes.material) contexto.variantes.material = nuevoContexto.variantes.material;
        if (nuevoContexto.variantes.atributo) contexto.variantes.atributo = nuevoContexto.variantes.atributo;
        
        contexto.ultimoMensaje = mensaje;
        contexto.historial.push({ mensaje, timestamp: new Date() });
        
        // Keep only last 10 messages
        if (contexto.historial.length > 10) {
          contexto.historial = contexto.historial.slice(-10);
        }
      }

      // Override with explicit values if provided
      if (servicio) contexto.servicio = servicio;
      if (variantes) {
        if (variantes.tamaño) contexto.variantes.tamaño = variantes.tamaño;
        if (variantes.material) contexto.variantes.material = variantes.material;
        if (variantes.atributo) contexto.variantes.atributo = variantes.atributo;
      }

      // Save updated context
      activeContexts.set(telefonoLimpio, contexto);

      return JSON.stringify(contexto);
    } catch (error) {
      console.error("Error gestionando contexto:", error);
      return "Error al gestionar el contexto de conversación";
    }
  }
});

// Tool to get current context
const obtenerContextoTool = new DynamicStructuredTool({
  name: "obtener_contexto",
  description: "Obtiene el contexto actual de la conversación con un cliente",
  schema: z.object({
    telefono: z.string().min(8, "Teléfono debe tener al menos 8 dígitos")
  }),
  func: async ({ telefono }) => {
    try {
      const telefonoLimpio = telefono.replace(/\D/g, '');
      const contexto = activeContexts.get(telefonoLimpio);
      
      if (!contexto) {
        return "No hay contexto activo para este cliente";
      }

      return JSON.stringify(contexto);
    } catch (error) {
      console.error("Error obteniendo contexto:", error);
      return "Error al obtener el contexto de conversación";
    }
  }
});

// Function to build dynamic query based on context
function construirConsultaDinamica(contexto) {
  let consulta = "";
  
  if (contexto.servicio) {
    consulta += contexto.servicio + " ";
  }

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

export { contextManagerTool, obtenerContextoTool, construirConsultaDinamica, extraerContextoDeMensaje };
