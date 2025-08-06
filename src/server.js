import express from 'express';
import twilio from 'twilio';
const { Twilio } = twilio;
import { initializeAgent } from './agent/manager.js';

const app = express();
app.use(express.urlencoded({ extended: true })); // Para parsear form-data de Twilio
app.use(express.json());

// Configuración Twilio
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Ruta de health check
app.get('/', (req, res) => {
  res.status(200).send('🛠️ Agent de Lavadísimo funcionando | Webhook: POST /webhook');
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

// Webhook de Twilio
app.post('/webhook', async (req, res) => {
  const { Body, From } = req.body; // Body = mensaje, From = número de WhatsApp
  
  if (!Body || !From) {
    return res.status(400).send('<Response><Message>Faltan parámetros</Message></Response>');
  }

  try {
    console.log(`📩 Mensaje recibido de ${From}: "${Body}"`);
    
    const agentResponse = await lavanderiaAgent.invoke({
      input: Body,
      telefono: From.replace('whatsapp:+56', '') // Limpia el prefijo
    });

    console.log('🛠️ Respuesta del Agent:', agentResponse.output);
    
    await twilioClient.messages.create({
      body: agentResponse.output,
      from: process.env.TWILIO_SANDBOX_NUMBER, // Ej: whatsapp:+14155238886
      to: From
    });

    res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.status(500).send('<Response><Message>Error procesando mensaje</Message></Response>');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🦜 Agent escuchando en puerto ${PORT}`));
