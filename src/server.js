import express from 'express';
import twilio from 'twilio';
const { Twilio } = twilio;
import { initializeAgent } from './agent/manager.js';
import { ConsoleCallbackHandler } from "langchain/callbacks";

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

// Configura Twilio
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

  try {
    console.log(`📩 Mensaje de ${From}: ${Body.substring(0, 50)}...`);
    
    const agentResponse = await lavanderiaAgent.invoke({
      input: Body.trim().substring(0, 100), // Limita entrada
      telefono: From.replace('whatsapp:+56', '')
    }, {
      callbacks: [minimalHandler]
    });

    const cleanResponse = formatAgentResponse(agentResponse);

    console.log(`📤 Respuesta: ${agentResponse.output.substring(0, 50)}...`);
    
    await twilioClient.messages.create({
      body: agentResponse.output,
      from: process.env.TWILIO_SANDBOX_NUMBER,
      to: From
    });

    res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).send('<Response><Message>Error procesando mensaje</Message></Response>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🦜 Agent escuchando en puerto ${PORT}`));
