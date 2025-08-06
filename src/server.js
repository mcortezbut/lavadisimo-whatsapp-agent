import express from 'express';
import { Twilio } from 'twilio';
import { initializeAgent } from './agent/manager.js';

const app = express();
app.use(express.urlencoded({ extended: true }));

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Agent pre-inicializado
const lavanderiaAgent = await initializeAgent();

app.post('/webhook', async (req, res) => {
  const { Body, From } = req.body;
  
  try {
    // Ejecutar Agent
    const agentResponse = await lavanderiaAgent.invoke({
      input: Body,
      telefono: From
    });

    // Enviar respuesta por WhatsApp
    await twilioClient.messages.create({
      from: process.env.TWILIO_SANDBOX_NUMBER,
      to: From,
      body: agentResponse.output
    });

    res.status(200).send('<Response></Response>');
  } catch (error) {
    console.error('Error en Agent:', error);
    res.status(500).end();
  }
});

app.listen(3000, () => console.log('🦜 Agent escuchando en 3000'));
