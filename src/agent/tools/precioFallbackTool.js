import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

// Schema Zod para validación
const paramsSchema = z.object({
  producto: z.string().min(2, "Mínimo 2 caracteres"),
  telefono: z.string().optional()
});

// Base de datos temporal de precios comunes mientras se resuelve la conectividad
const preciosComunes = {
  // Servicios de limpieza automotriz
  "pulido de focos": { precio: 15000, categoria: "Servicios Automotriz" },
  "focos": { precio: 15000, categoria: "Servicios Automotriz" },
  "pulido focos": { precio: 15000, categoria: "Servicios Automotriz" },
  
  // Servicios de tapicería
  "poltrona": { precio: 25000, categoria: "Tapicería" },
  "sillon": { precio: 25000, categoria: "Tapicería" },
  "sofa": { precio: 35000, categoria: "Tapicería" },
  "sofá": { precio: 35000, categoria: "Tapicería" },
  
  // Cortinas
  "cortina": { precio: 18000, categoria: "Cortinas" },
  "cortinas": { precio: 18000, categoria: "Cortinas" },
  
  // Alfombras
  "alfombra": { precio: 20000, categoria: "Alfombras" },
  "alfombras": { precio: 20000, categoria: "Alfombras" },
  
  // Cobertores
  "cobertor": { precio: 12000, categoria: "Ropa de Cama" },
  "frazada": { precio: 12000, categoria: "Ropa de Cama" },
  "edredon": { precio: 15000, categoria: "Ropa de Cama" },
  "edredón": { precio: 15000, categoria: "Ropa de Cama" },
  
  // Servicios generales
  "lavado": { precio: 8000, categoria: "Servicios Generales" },
  "limpieza": { precio: 10000, categoria: "Servicios Generales" },
  "planchado": { precio: 5000, categoria: "Servicios Generales" }
};

// Crear la herramienta de fallback
const precioFallbackTool = new DynamicStructuredTool({
  name: "consultar_precio_fallback",
  description: "Consulta precios de servicios de lavandería usando base de datos local cuando la conexión principal falla",
  schema: paramsSchema,
  func: async ({ producto, telefono }) => {
    try {
      const productoLower = producto.toLowerCase().trim();
      
      // Buscar coincidencia exacta
      if (preciosComunes[productoLower]) {
        const item = preciosComunes[productoLower];
        return `${producto}: $${item.precio.toLocaleString('es-CL')} (${item.categoria})\n\n¿Te gustaría agendar este servicio o necesitas información sobre otros servicios?`;
      }
      
      // Buscar coincidencias parciales
      const coincidencias = [];
      for (const [key, value] of Object.entries(preciosComunes)) {
        if (key.includes(productoLower) || productoLower.includes(key)) {
          coincidencias.push({ nombre: key, ...value });
        }
      }
      
      if (coincidencias.length > 0) {
        let respuesta = `Encontré estos servicios relacionados con "${producto}":\n\n`;
        coincidencias.forEach((item, index) => {
          respuesta += `${index + 1}. ${item.nombre}: $${item.precio.toLocaleString('es-CL')} (${item.categoria})\n`;
        });
        respuesta += `\n¿Cuál de estos servicios te interesa?`;
        return respuesta;
      }
      
      // Si no encuentra nada, mostrar servicios populares
      const serviciosPopulares = [
        { nombre: "Pulido de focos", precio: 15000, categoria: "Automotriz" },
        { nombre: "Poltrona", precio: 25000, categoria: "Tapicería" },
        { nombre: "Cortina", precio: 18000, categoria: "Cortinas" },
        { nombre: "Alfombra", precio: 20000, categoria: "Alfombras" }
      ];
      
      let respuesta = `No encontré "${producto}" en nuestros servicios principales. Estos son algunos de nuestros servicios más populares:\n\n`;
      serviciosPopulares.forEach((item, index) => {
        respuesta += `${index + 1}. ${item.nombre}: $${item.precio.toLocaleString('es-CL')} (${item.categoria})\n`;
      });
      respuesta += `\n¿Alguno de estos servicios es lo que buscas? También puedes ser más específico con tu consulta.`;
      
      return respuesta;
      
    } catch (error) {
      console.error("Error en precioFallbackTool:", error);
      return "Disculpa, tuve un problema al consultar los precios. ¿Podrías intentar nuevamente?";
    }
  }
});

export default precioFallbackTool;
