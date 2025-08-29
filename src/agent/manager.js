import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { precioTool, estadoTool } from "./tools/index.js";

export async function initializeAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    maxTokens: 100,
    timeout: 8000
  });

  return await initializeAgentExecutorWithOptions([precioTool, estadoTool], model, {
    agentType: "zero-shot-react-description",
    verbose: false,
    maxIterations: 8,
    agentArgs: {
      prefix: `Eres un asistente de Lavadísimo. Reglas absolutas:
1. Usa las herramientas consultar_precio y verificar_estado
2. Respuestas breves (1 línea)
3. Formato: "[Producto]: $[Precio]" o "Orden: [Estado]"`
    }
  });
}
