import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { precioTool, estadoTool } from "./tools/index.js";
import { ConsoleCallbackHandler } from "langchain/callbacks";

export async function initializeAgent() {
  const tools = [precioTool, estadoTool];
  
  const model = new ChatOpenAI({ 
    model: "gpt-3.5-turbo",
    temperature: 0,
    maxRetries: 2, // 👈 Nuevo: reintentos para errores de API
    maxConcurrency: 1, // 👈 Evita sobrecarga
    configuration: {
      baseOptions: {
        headers: {
          "Accept-Language": "es-ES"
        }
      }
    }
  });

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: process.env.NODE_ENV === 'development',
    maxIterations: 10, // 👈 Mantenemos un valor razonable
    returnIntermediateSteps: false,
    handleParsingErrors: (error) => { // 👈 Manejo personalizado
      console.error("Error de parsing:", error);
      return "Por favor reformula tu pregunta de manera más clara.";
    },
    earlyStoppingMethod: "generate", // 👈 Mejor control de parada
    agentArgs: {
      prefix: `Eres el asistente de Lavadísimo. Reglas estrictas:
1. Usa EXCLUSIVAMENTE las herramientas proporcionadas
2. Si no encuentras información, di "No tengo ese dato. ¿Deseas consultar otro servicio?"
3. Nunca inventes precios
4. Respuestas breves (máximo 2 líneas)
5. Moneda CLP (ej: $15.000)`,
      suffix: `¡Importante! Si la herramienta no devuelve resultados:
- Pide confirmación o más detalles
- Nunca inventes respuestas
- Usa exactamente una de estas opciones:
  • "No tengo ese dato registrado"
  • "¿Te refieres a [producto similar]?"
  • "Por favor describe mejor el servicio"`
    }
  });

  return executor;
}
