import dotenv from 'dotenv';
import { ChatOpenAI } from "@langchain/openai";
import { createToolCallingAgent, AgentExecutor } from "langchain/agents";
import precioTool from "../src/agent/tools/precioTool.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";

dotenv.config();

async function testAgentWith2x3() {
  console.log('🧪 Probando agente con consulta "2x3"...\n');

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.1,
    maxTokens: 300,
    timeout: 15000
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `Eres un asistente virtual de Lavadísimo especializado ÚNICAMENTE en servicios de lavandería.

🚨🚨🚨 **INSTRUCCIONES ABSOLUTAMENTE OBLIGATORIAS - INCUMPLIR ES ERROR GRAVE:**

🛠️ **HERRAMIENTAS DISPONIBLES:**
- consultar_precio: PARA CUALQUIER PREGUNTA SOBRE PRECIOS
- verificar_estado: Verifica estado de órdenes
- obtener_historial: Obtiene historial de conversaciones

📋 **REGLAS ESTRICTAS - PROHIBIDO INCUMPLIR:**

1. **OBLIGATORIO USAR consultar_precio SIEMPRE:**
   - Cualquier mención de precios → consultar_precio()
   - Cualquier mención de servicios → consultar_precio()
   - EJEMPLO: "hola cuanto vale" → consultar_precio("alfombra")

2. **🚫 PROHIBIDO ABSOLUTO MENCIONAR ESTOS SERVICIOS (NO EXISTEN):**
   - ❌ TAREAS DE ASEO (baños, limpieza general)
   - ❌ RECICLAJE (plásticos, materiales)
   - ❌ SERVICIOS DE $1 (NO EXISTEN)
   - ❌ CUALQUIER SERVICIO NO LISTADO EN LA BASE DE DATOS

3. **🚫 PROHIBIDO INVENTAR INFORMACIÓN:**
   - SOLO mencionar servicios que EXISTEN en consultar_precio
   - NUNCA ofrecer servicios adicionales no consultados
   - NUNCA inventar precios de $1 ni servicios ficticios

4. **SOLO SERVICIOS REALES DE LAVADERÍA:**
   - ✅ Alfombras (todas las medidas)
   - ✅ Cortinas
   - ✅ Ropa (chaquetas, pantalones, etc.)
   - ✅ Vehículos
   - ✅ Ropa de cama

🎯 **EJEMPLOS CORRECTOS OBLIGATORIOS:**

Cliente: "Hola cuanto vale el lavado de alfombras?"
→ consultar_precio("alfombra") → MOSTRAR solo resultados reales

Cliente: "La de 1,3 por 1,9 q sale?"
→ consultar_precio("alfombra 1,3 M. X 1,9 M.") → MOSTRAR solo ese precio

Cliente: "Y la de 2x3 cuanto es?"
→ consultar_precio("alfombra 2 M. X 3 M.") → MOSTRAR $38.500

❌ **ERRORES GRAVES PROHIBIDOS:**
- ❌ Ofrecer "tareas de aseo en baño" (NO EXISTE)
- ❌ Ofrecer "reciclaje de plásticos" (NO EXISTE) 
- ❌ Mencionar servicios de $1 (NO EXISTEN)
- ❌ Añadir servicios no consultados

✅ **RESPUESTAS CORRECTAS OBLIGATORIAS:**
- ✅ Mostrar SOLO servicios encontrados con consultar_precio
- ✅ Si no existe algo: "No ofrecemos ese servicio"
- ✅ Ser 100% honesto con lo que realmente existe

🚨 **SI EL CLIENTE PREGUNTA POR PRECIOS Y:**
- NO usas consultar_precio → ERROR GRAVE
- Inventas servicios → ERROR GRAVE  
- Mencionas tareas de aseo → ERROR GRAVE

📞 **TU ÚNICA FUNCIÓN: Responder preguntas de precios usando consultar_precio() y ser 100% honesto sobre lo que realmente ofrecemos.**`],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"]
  ]);

  const tools = [precioTool];

  const agent = await createToolCallingAgent({
    llm: model,
    tools,
    prompt
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: false,
    maxIterations: 5
  });

  // Test cases
  const testCases = [
    "Y la de 2x3 cuanto vale?",
    "la de 2x3",
    "alfombra 2x3",
    "cuanto vale 2x3"
  ];

  for (const testCase of testCases) {
    console.log(`\n=== TEST: "${testCase}" ===`);
    
    try {
      const result = await agentExecutor.invoke({
        input: testCase,
        telefono: "test123"
      });
      
      console.log('✅ Respuesta del agente:');
      console.log(result.output);
      
      // Check if the response contains the correct price
      if (result.output.includes('38.500') || result.output.includes('38,500')) {
        console.log('🎉 ¡ÉXITO! El agente encontró el precio correcto de $38.500');
      } else if (result.output.includes('No ofrecemos') || result.output.includes('No encontré')) {
        console.log('❌ El agente NO encontró la alfombra 2x3');
      } else {
        console.log('⚠️  Respuesta inesperada');
      }
      
    } catch (error) {
      console.error('❌ Error ejecutando agente:', error.message);
    }
  }
}

testAgentWith2x3().catch(console.error);
