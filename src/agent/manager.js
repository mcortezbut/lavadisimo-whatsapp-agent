import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "@langchain/agents";
import { precioTool } from "./tools/index.js";

export async function initializeAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    maxTokens: 100,
    timeout: 8000
  });

  return await initializeAgentExecutorWithOptions([precioTool], model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: false,
    maxIterations: 8,
    agentArgs: {
      prefix: `Eres un asistente de Lavadísimo. Reglas absolutas:
1. Usa SOLO la herramienta consultar_precio
2. Respuestas breves (1 línea)
3. Formato: "[Producto]: $[Precio]"`
    }
  });
}
