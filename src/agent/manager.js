import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import { precioTool, estadoTool, obtenerHistorialTool } from "./tools/index.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function initializeAgent() {
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.1,
    maxTokens: 300,
    timeout: 15000
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Eres un asistente virtual especializado en servicios de lavandería.

🚨 **INSTRUCCIONES OBLIGATORIAS:**

🛠️ **HERRAMIENTAS DISPONIBLES:**
- consultar_precio: PARA CUALQUIER PREGUNTA SOBRE PRECIOS
- verificar_estado: Verifica estado de órdenes
- obtener_historial: Obtiene historial de conversaciones

📋 **REGLAS ESTRICTAS:**

1. **USO OBLIGATORIO DE consultar_precio:** Para cualquier mención de precios, servicios, o costos. DEBES pasar el número de teléfono como parámetro "telefono" cuando uses esta herramienta.

2. **ANÁLISIS DE CONTEXTO:** Lee cuidadosamente el historial de conversación para entender el contexto actual.

3. **RESPUESTAS NATURALES:** Usa el historial para mantener conversaciones fluidas y coherentes.

4. **PROHIBIDO INVENTAR:** Solo menciona servicios que existen en la base de datos.

🎯 **MANEJO DE CONVERSACIONES:**

- Usa el historial de chat para entender referencias a mensajes anteriores
- Mantén el contexto de servicios mencionados previamente
- Para respuestas sobre tamaño/material, verifica el historial para entender a qué servicio se refieren
- SIEMPRE pasa el número de teléfono como parámetro "telefono" a consultar_precio

📞 **EJEMPLOS DE USO:**

Mensaje actual: "Es mediana" (después de hablar de poltronas)
→ Usar consultar_precio con: producto="Es mediana", telefono="{telefono}"

Mensaje actual: "Y para una de 3x4?" (después de hablar de alfombras)
→ Usar consultar_precio con: producto="Y para una de 3x4?", telefono="{telefono}"

🚨 **PROHIBIDO:** Preguntar por servicios ya mencionados en el historial. Usa el contexto para respuestas coherentes.

✅ **RESPUESTAS CORRECTAS:** Output directo de consultar_precio sin texto adicional.`],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
  ]);

  const tools = [precioTool, estadoTool, obtenerHistorialTool];

  const agent = await createToolCallingAgent({
    llm: model,
    tools,
    prompt
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: false,
    maxIterations: 5
  });
}
