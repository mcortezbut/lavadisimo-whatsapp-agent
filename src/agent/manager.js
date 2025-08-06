import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { precioTool, estadoTool } from "./tools/index.js";

export async function initializeAgent() {
  const tools = [precioTool, estadoTool];
  const model = new ChatOpenAI({ 
    model: "gpt-3.5-turbo",
    temperature: 0
  });

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: true // Opcional para ver logs detallados
  });

  return executor;
}
