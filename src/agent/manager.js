import { AgentExecutor, createToolCallingAgent } from '@langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { precioTool, estadoTool } from './tools/index.js';

export async function initializeAgent() {
  const tools = [precioTool, estadoTool];
  
  const agent = createToolCallingAgent({
    llm: new ChatOpenAI({ 
      model: "gpt-3.5-turbo",
      temperature: 0 
    }),
    tools,
    prompt: `Eres un asistente especializado en lavandería...` // Personaliza
  });

  return new AgentExecutor({ agent, tools });
}
