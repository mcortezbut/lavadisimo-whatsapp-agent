import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutor } from "@langchain/core/agents";
import { precioTool } from "./tools/index.js";

export async function initializeAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    maxTokens: 100,
    timeout: 8000
  });

  const executor = await initializeAgentExecutor({
    tools: [precioTool],
    llm: model,
    agentType: "structured-chat-zero-shot-react-description",
    agentArgs: {
      prefix: `Eres un asistente de Lavadísimo. Reglas absolutas:
1. Usa SOLO la herramienta consultar_precio
2. Respuestas breves (1 línea)
3. Formato: "[Producto]: $[Precio]"`
    }
  });

  return executor;
}
