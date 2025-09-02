import express from 'express';
import twilio from 'twilio';
const { Twilio } = twilio;
import { initializeAgent } from './agent/manager.js';
import { guardarConversacionTool } from './agent/tools/memoriaTool.js';
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";

// Configuración SUPER reducida de logs
const minimalHandler = new ConsoleCallbackHandler({
  alwaysVerbose: false,  // ← Desactiva logs internos
  ignoreLLM: true,       // ← Omite detalles del modelo AI
  ignoreChain: true,     // ← Oculta pasos intermedios
  ignoreAgent: true      // ← Elimina trazas del Agent
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

// Verificar formato de credenciales
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
    console.error('Código de error:', error.code);
    console.error('Más info:', error.moreInfo);
  }
})();

// Configuración del handler de logs (antes de inicializar el Agent)
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
  res.status(200).send('🛠️ Agent de Lavadísimo funcionando');
});

// Agrega esto ANTES del endpoint /webhook
const formatAgentResponse = (rawResponse) => {
  if (typeof rawResponse === 'string') {
    return rawResponse;
  }
  
  if (rawResponse.output?.includes('Agent stopped')) {
    return "No logré encontrar esa información. ¿Necesitas otro servicio?";
  }

  return "Por favor pregunta por servicios de lavandería específicos";
};

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
        tipo: 0, // 0 = mensaje entrante (cliente)
        intencion: null,
        contexto: null
      });
    } catch (error) {
      console.log('⚠️ No se pudo guardar mensaje entrante:', error.message);
    }

    const agentResponse = await lavanderiaAgent.invoke({
      input: Body.trim(),
      telefono: telefonoLimpio
    });
    console.log("🟡 agentResponse:", agentResponse);
  
    const responseText = agentResponse.output || "No se pudo procesar la consulta.";
    console.log(`📤 Respuesta: ${responseText.substring(0, 50)}...`);
    
    // Guardar respuesta del agente
    try {
      await guardarConversacionTool.func({
        telefono: telefonoLimpio,
        mensaje: responseText,
        tipo: 1, // 1 = mensaje saliente (agente)
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
      console.log('🔄 Intentando respuesta alternativa con TwiML...');
      
      // Respuesta alternativa usando TwiML
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
