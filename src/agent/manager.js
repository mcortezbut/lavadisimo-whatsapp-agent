import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { precioTool, estadoTool } from "./tools/index.js";

export async function initializeAgent() {
  const tools = [precioTool, estadoTool];
  
  const model = new ChatOpenAI({ 
    model: "gpt-3.5-turbo",
    temperature: 0,
    configuration: {
      baseOptions: {
        headers: {
          "Accept-Language": "es-ES" // Fuerza respuestas en español
        }
      }
    }
  });

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: false,
    maxIterations: 15, // 👈 Aumentamos el límite de iteraciones (default: 10)
    returnIntermediateSteps: false,
    handleParsingErrors: true, // 👈 Manejo mejorado de errores
    agentArgs: {
      prefix: `Eres el asistente de Lavadísimo. Reglas estrictas:
1. Responde SOLO en español chileno
2. Usa CLP (ej: $15.000) 
3. Sé breve y profesional
4. Si no sabes el precio, di "Consultaré con el equipo y te aviso"
5. Si no entiendes algo, pide clarificación`
    }
  });

  return executor;
}
