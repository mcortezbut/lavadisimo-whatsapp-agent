import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { precioTool, estadoTool } from "./tools/index.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function initializeAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
    maxTokens: 150,
    timeout: 10000
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Eres un asistente de Lavadísimo, una lavandería profesional. 
    
    Tienes acceso a dos herramientas:
    - consultar_precio: para consultar precios de productos
    - verificar_estado: para verificar el estado de órdenes
    
    Instrucciones:
    - Responde de manera amigable y profesional
    - Si te preguntan por precios, usa la herramienta consultar_precio
    - Si te preguntan por el estado de una orden, usa verificar_estado
    - Para verificar estado puedes usar el número de orden o el teléfono del cliente
    - Mantén las respuestas concisas pero informativas`],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
  ]);

  const tools = [precioTool, estadoTool];

  const agent = await createToolCallingAgent({
    llm: model,
    tools,
    prompt
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: false,
    maxIterations: 3
  });
}
