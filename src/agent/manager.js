import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { precioTool, estadoTool } from "./tools/index.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function initializeAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0613", // <-- Cambia aquí
    temperature: 0,
    maxTokens: 100,
    timeout: 8000
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Eres un asistente de Lavadísimo. 
    Usa solo las herramientas consultar_precio y verificar_estado.
    Responde siempre en una sola línea.
    Formato precio: "[Producto]: $[Precio]"
    Formato estado: "Orden: [Estado]"`],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
  ]);

  const agent = await createToolCallingAgent({
    llm: model,
    tools: [precioTool, estadoTool],
    prompt
  });

  // Retorna un executor que se puede usar con .invoke
  return new AgentExecutor({
    agent,
    tools: [precioTool, estadoTool]
  });
}
