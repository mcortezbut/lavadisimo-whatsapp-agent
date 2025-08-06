import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { precioTool } from "./tools/index.js";

export async function initializeAgent() {
  const tools = [precioTool];
  
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    maxRetries: 1,
    timeout: 10000, // 10 segundos de timeout
  });

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: process.env.NODE_ENV === 'development',
    maxIterations: 8, // Reducimos iteraciones pero con mejor control
    earlyStoppingMethod: "force", // Fuerza finalización después de maxIterations
    returnIntermediateSteps: false,
    handleParsingErrors: (error) => {
      return "Por favor reformula tu pregunta de manera más clara.";
    },
    agentArgs: {
      prefix: `Eres el asistente de Lavadísimo. Reglas absolutas:
1. Usa EXCLUSIVAMENTE la herramienta 'consultar_precio' para responder sobre precios
2. Si no hay resultados, responde: "No tengo información sobre ese servicio. ¿Necesitas consultar otro?"
3. Nunca inventes precios
4. Respuestas MUY breves (1 línea)
5. Formato: "[Producto]: $[Precio]" o mensaje de no encontrado`,
    }
  });

  return executor;
}
