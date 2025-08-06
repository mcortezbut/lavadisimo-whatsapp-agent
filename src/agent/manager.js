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
          "Accept-Language": "es-ES"
        }
      }
    }
  });

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: false,
    maxIterations: 10,
    returnIntermediateSteps: false,
    handleParsingErrors: (error) => {
      return "Por favor reformula tu pregunta de manera más clara.";
    },
    agentArgs: {
      prefix: `Eres el asistente de Lavadísimo. Reglas estrictas:
1. Siempre procesa las respuestas de las herramientas antes de responder al cliente
2. Nunca muestres respuestas JSON crudas
3. Si una herramienta devuelve NO_ENCONTRADO, pregunta si el cliente quiere consultar otro servicio
4. Si una herramienta devuelve ERROR_TECNICO, pide disculpas y solicita intentarlo más tarde
5. Usa formato claro: "Producto: Precio" cuando muestres resultados`
    }
  });

  return executor;
}
