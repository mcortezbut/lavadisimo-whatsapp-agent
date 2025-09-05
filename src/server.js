import express from 'express';
import twilio from 'twilio';
const { Twilio } = twilio;
import { initializeAgent } from './agent/manager.js';
import { guardarConversacionTool } from './agent/tools/memoriaTool.js';
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Configuración SUPER reducida de logs
const minimalHandler = new ConsoleCallbackHandler({
  alwaysVerbose: false,
  ignoreLLM: true,
  ignoreChain: true,
  ignoreAgent: true
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Almacenamiento de historial de conversación por número de teléfono
const conversationHistories = new Map();

// Función para obtener o crear historial de conversación
function getOrCreateHistory(telefono) {
  if (!conversationHistories.has(telefono)) {
    conversationHistories.set(telefono, []);
  }
  return conversationHistories.get(telefono);
}

// Función para formatear el historial de conversación para el prompt
function formatChatHistory(history) {
  return history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
}

// LOG GLOBAL para todas las peticiones
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path} - body:`, req.body);
  next();
});

// Configura Twilio con validación detallada
console.log('🔍 Verificando credenciales de Twilio...');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? `Configurado (${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...)` : 'No configurado');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? `Configurado (${process.env.TWILIO_AUTH_TOKEN.substring(0, 10)}...)` : 'No configurado');
console.log('TWILIO_SANDBOX_NUMBER:', process.env.TWILIO_SANDBOX_NUMBER || 'No configurado');

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.error('❌ Error: Faltan credenciales de Twilio');
  process.exit(1);
}

if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  console.error('❌ Error: TWILIO_ACCOUNT_SID debe comenzar con "AC"');
  process.exit(1);
}

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Probar conexión con Twilio al iniciar
(async () => {
  try {
    console.log('🔍 Probando conexión con Twilio...');
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log('✅ Conexión con Twilio exitosa:', account.friendlyName);
  } catch (error) {
    console.error('❌ Error probando conexión con Twilio:', error.message);
  }
})();

// Configuración del handler de logs
const minimalConsoleHandler = new ConsoleCallbackHandler({
  alwaysVerbose: false,
  verboseMethods: []
});

// Inicialización asíncrona
let lavanderiaAgent;
(async () => {
  try {
    lavanderiaAgent = await initializeAgent();
    console.log('✅ Agent inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Agent:', error);
    process.exit(1);
  }
})();

// Ruta de health check
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: '🛠️ Agent de WhatsApp funcionando',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Memoria conversacional con LangChain',
      'Contexto inteligente nativo',
      'Base de datos dinámica'
    ]
  });
});

// Función para sanitizar respuestas
function sanitizarRespuesta(respuesta) {
  if (typeof respuesta !== 'string') return respuesta;
  
  const respuestaConMarcadores = respuesta.replace(/\$([\d.,]+)/g, 'PRECIO_LEGITIMO_$1');
  
  const serviciosProhibidos = [
    'tareas de aseo',
    'tarea de aseo', 
    'reciclaje',
    'reciclaje de plásticos',
    'baño de mujer',
    'baño de hombre',
    'PRECIO_1',
    'por PRECIO_1',
    'cada uno por PRECIO_1'
  ];
  
  let respuestaSanitizada = respuestaConMarcadores;
  serviciosProhibidos.forEach(prohibido => {
    const regex = new RegExp(prohibido, 'gi');
    respuestaSanitizada = respuestaSanitizada.replace(regex, '');
  });
  
  const lineas = respuestaSanitizada.split('\n');
  const lineasFiltradas = lineas.filter(linea => {
    const lowerLinea = linea.toLowerCase();
    return !lowerLinea.includes('aseo') && 
           !lowerLinea.includes('reciclaje') && 
           !lowerLinea.includes('baño') &&
           !lowerLinea.match(/por PRECIO_1|PRECIO_1 cada|cada uno por PRECIO_1/);
  });
  
  respuestaSanitizada = lineasFiltradas.join('\n');
  respuestaSanitizada = respuestaSanitizada.replace(/PRECIO_LEGITIMO_([\d.,]+)/g, '$$$1');
  
  respuestaSanitizada = respuestaSanitizada
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  if (!respuestaSanitizada || respuestaSanitizada.length < 20) {
    return "No logré encontrar información sobre ese servicio. ¿Necesitas consultar sobre algún otro servicio?";
  }
  
  return respuestaSanitizada;
}

// Webhook de Twilio
app.post('/webhook', async (req, res) => {
  const { Body, From } = req.body;
  
  if (!Body || !From) {
    return res.status(400).send('<Response><Message>Faltan parámetros</Message></Response>');
  }

  const telefonoLimpio = From.replace('whatsapp:', '').replace('+', '');

  try {
    console.log(`📩 Mensaje de ${From}: ${Body.substring(0, 50)}...`);
    
    // Guardar mensaje entrante del cliente
    try {
      await guardarConversacionTool.func({
        telefono: telefonoLimpio,
        mensaje: Body,
        tipo: 0,
        intencion: null,
        contexto: null
      });
    } catch (error) {
      console.log('⚠️ No se pudo guardar mensaje entrante:', error.message);
    }

    // Obtener historial de conversación para este número
    const chatHistory = getOrCreateHistory(telefonoLimpio);
    
    // Agregar mensaje del cliente al historial
    chatHistory.push({ role: "human", content: Body });

    // Formatear historial para el agente
    const formattedHistory = formatChatHistory(chatHistory);

    const agentResult = await lavanderiaAgent.invoke({
      input: Body.trim(),
      telefono: telefonoLimpio,
      chat_history: formattedHistory
    });

    console.log("🟡 agentResponse:", agentResult);
  
    let responseText = agentResult.output || "No se pudo procesar la consulta.";
    console.log(`📤 Respuesta: ${responseText.substring(0, 50)}...`);
    
    // Agregar respuesta del agente al historial
    chatHistory.push({ role: "ai", content: responseText });
    
    // Aplicar sanitización
    responseText = sanitizarRespuesta(responseText);
    console.log(`🔄 Respuesta sanitizada: ${responseText.substring(0, 50)}...`);
    
    // Guardar respuesta del agente en base de datos
    try {
      await guardarConversacionTool.func({
        telefono: telefonoLimpio,
        mensaje: responseText,
        tipo: 1,
        intencion: null,
        contexto: null
      });
    } catch (error) {
      console.log('⚠️ No se pudo guardar respuesta del agente:', error.message);
    }
    
    // Intentar enviar con Twilio API
    try {
      await twilioClient.messages.create({
        body: responseText,
        from: process.env.TWILIO_SANDBOX_NUMBER,
        to: From
      });
      console.log('✅ Mensaje enviado exitosamente via Twilio API');
      res.status(200).send('<Response></Response>');
    } catch (twilioError) {
      console.error('❌ Error enviando con Twilio API:', twilioError.message);
      
      const twimlResponse = `
        <Response>
          <Message>${responseText}</Message>
        </Response>
      `;
      res.status(200).type('text/xml').send(twimlResponse);
      console.log('✅ Respuesta enviada via TwiML');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message, error);
    res.status(500).send('<Response><Message>Error procesando mensaje</Message></Response>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🦜 Agent escuchando en puerto ${PORT}`));
