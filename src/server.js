import express from 'express';
import twilio from 'twilio';
const { Twilio } = twilio;
import { initializeAgent } from './agent/manager.js';
import { ConsoleCallbackHandler } from "@langchain/core/callbacks"; // ✅ Nueva ruta

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración Twilio
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Handler para logs mínimos
const minimalHandler = new ConsoleCallbackHandler({
  alwaysVerbose: false,
  verboseMethods: [],
  ignoreLLM: true,       // 👈 Nuevo: Omite logs del modelo
  ignoreChain: true,    // 👈 Nuevo: Omite procesos internos
  ignoreAgent: true      // 👈 Nuevo: Omite pasos del Agent
});


// -----------------------------------------------
// ¡CORRECCIÓN CLAVE! (Elimina la duplicación)
// -----------------------------------------------
let lavanderiaAgent;

(async () => {
  try {
    lavanderiaAgent = await initializeAgent({
      callbacks: [minimalConsoleHandler] // Configuración única aquí
    });
    console.log('✅ Agent inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Agent:', error);
    process.exit(1);
  }
})();

// Ruta de health check
app.get('/', (req, res) => {
  res.status(200).send('🛠️ Agent de Lavadísimo funcionando | Webhook: POST /webhook');
});

// Webhook de Twilio
app.post('/webhook', async (req, res) => {
  const { Body, From } = req.body;
  
  if (!Body || !From) {
    return res.status(400).send('<Response><Message>Faltan parámetros</Message></Response>');
  }

  try {
    console.log(`📩 Mensaje recibido de ${From}: "${Body.substring(0, 50)}${Body.length > 50 ? '...' : ''}"`);
    
    const agentResponse = await lavanderiaAgent.invoke({
      input: Body,
      telefono: From.replace('whatsapp:+56', '')
    }, {
      callbacks: [minimalHandler],
      metadata: { reduceVerbosity: true } // 👈 Nueva opción
    });

    console.log(`📤 Respuesta a ${From}: "${agentResponse.output.substring(0, 50)}${agentResponse.output.length > 50 ? '...' : ''}"`);
    
    await twilioClient.messages.create({
      body: agentResponse.output,
      from: process.env.TWILIO_SANDBOX_NUMBER,
      to: From
    });

    res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('❌ Error en webhook:', error.message); // Solo mensaje
    res.status(500).send('<Response><Message>Error procesando mensaje</Message></Response>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🦜 Agent escuchando en puerto ${PORT}`));
