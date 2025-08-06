import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { SQLDatabase } from "langchain/sql_db";
import { DataSource } from "typeorm";

// Conexión a tu BD existente
const datasource = new DataSource({
  type: "mssql",
  host: "200.63.96.20",
  username: "lavadisimo",
  password: "rb26GTR2jz",
  database: "lavadisimo"
});

const db = await SQLDatabase.fromDataSourceParams({
  appDataSource: datasource
});

// Herramientas (Tools) Específicas

// Tool 1: Consultar precios
const precioTool = new DynamicStructuredTool({
  name: "consultar_precio",
  description: "Busca precios de servicios/productos en la base de datos",
  schema: z.object({
    producto: z.string().describe("Nombre del producto/servicio ej: 'poltrona grande'")
  }),
  func: async ({ producto }) => {
    const query = `SELECT PRECIO FROM PRODUCTOS WHERE NOMPROD LIKE '%${producto}%'`;
    const result = await db.run(query);
    return result[0]?.PRECIO 
      ? `El servicio "${producto}" cuesta $${result[0].PRECIO}` 
      : `No encontré el precio para "${producto}"`;
  }
});

// Tool 2: Verificar estado de orden
const estadoTool = new DynamicStructuredTool({
  name: "verificar_estado",
  description: "Consulta el estado de una orden o servicio",
  schema: z.object({
    orden: z.string().optional().describe("Número de orden ej: '123'"),
    telefono: z.string().optional().describe("Teléfono del cliente")
  }),
  func: async ({ orden, telefono }) => {
    let query;
    if (orden) {
      query = `SELECT ESTADO FROM VENTAS WHERE NROVENTA = '${orden}'`;
    } else {
      query = `SELECT V.NROVENTA, V.ESTADO 
               FROM VENTAS V
               JOIN CLIENTES C ON V.IDCTE = C.IDCTE
               WHERE C.CELCTE LIKE '%${telefono}%'`;
    }
    const result = await db.run(query);
    // Procesar respuesta...
    return JSON.stringify(result);
  }
});

// Sistema de Memoria Conversacional

import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: "chat_history",
  inputKey: "input"
});

// Ejemplo de almacenamiento por cliente
const memorias = new Map(); // { telefono: BufferMemory }

app.post('/webhook', async (req, res) => {
  const telefono = req.body.From;
  if (!memorias.has(telefono)) {
    memorias.set(telefono, new BufferMemory());
  }
  const memoriaCliente = memorias.get(telefono);
});

// Agent Personalizado

const prompt = ChatPromptTemplate.fromMessages([
  ["system", `Eres el asistente de Lavadísimo. 
  Acciones permitidas:
  - Consultar precios
  - Verificar estado de órdenes
  - Agendar servicios
  
  Reglas:
  1. SI el cliente menciona un producto y pregunta por precio → Usa consultar_precio
  2. SI pregunta por una orden → Usa verificar_estado
  3. SI combina ambas → Responde en un solo mensaje combinado
  4. NUNCA inventes precios o estados`],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"]
]);

const agent = createToolCallingAgent({
  llm: new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 }),
  tools: [precioTool, estadoTool],
  prompt
});

const executor = new AgentExecutor({
  agent,
  tools: [precioTool, estadoTool],
  memory: memoriaCliente // Del paso anterior
});

// Modificación mínima a tu endpoint /webhook
app.post('/webhook', async (req, res) => {
  const { Body, From } = req.body;
  
  // Obtener memoria del cliente
  const memoriaCliente = obtenerMemoria(From); 

  // Ejecutar el agent
  const result = await executor.invoke({
    input: Body,
    chat_history: await memoriaCliente.loadMemoryVariables({})
  });

  // Enviar respuesta por Twilio
  await client.messages.create({
    from: FROM_WHATSAPP,
    to: From,
    body: result.output
  });

  // Guardar interacción en tu BD
  guardarConversacion({
    telefono: From,
    mensaje: Body,
    respuesta: result.output
  });
});
