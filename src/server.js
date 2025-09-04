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

// Ruta de health check con información de versión
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: '🛠️ Agent de Lavadísimo funcionando',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'Búsqueda inteligente de medidas',
      'Sin invención de información',
      'Uso obligatorio de herramientas'
    ]
  });
});

// Endpoint para verificar versión del código
app.get('/version', (req, res) => {
  res.json({
    version: '2.0.0',
    last_commit: '81c8d14d - Forzar uso obligatorio de herramientas',
    deployment_time: new Date().toISOString(),
    features: [
      'extraerMedidasDeFrase implementado',
      'Instrucciones críticas anti-invención',
      'Uso obligatorio consultar_precio'
    ]
  });
});

  // Función para sanitizar respuestas y eliminar servicios prohibidos sin dañar precios
function sanitizarRespuesta(respuesta) {
  if (typeof respuesta !== 'string') return respuesta;
  
  // Primero, proteger los precios legítimos reemplazando $ con un marcador temporal
  // Usamos un marcador más específico para evitar conflictos
  const respuestaConMarcadores = respuesta.replace(/\$([\d.,]+)/g, 'PRECIO_LEGITIMO_$1');
  
  // Lista de servicios prohibidos que NO deben mencionarse
  const serviciosProhibidos = [
    'tareas de aseo',
    'tarea de aseo', 
    'reciclaje',
    'reciclaje de plásticos',
    'baño de mujer',
    'baño de hombre',
    'PRECIO_1', // Servicios de $1 convertidos
    'por PRECIO_1',
    'cada uno por PRECIO_1'
  ];
  
  // Eliminar menciones de servicios prohibidos
  let respuestaSanitizada = respuestaConMarcadores;
  serviciosProhibidos.forEach(prohibido => {
    const regex = new RegExp(prohibido, 'gi');
    respuestaSanitizada = respuestaSanitizada.replace(regex, '');
  });
  
  // Eliminar frases completas que contengan servicios prohibidos
  const lineas = respuestaSanitizada.split('\n');
  const lineasFiltradas = lineas.filter(linea => {
    const lowerLinea = linea.toLowerCase();
    return !lowerLinea.includes('aseo') && 
           !lowerLinea.includes('reciclaje') && 
           !lowerLinea.includes('baño') &&
           !lowerLinea.match(/por PRECIO_1|PRECIO_1 cada|cada uno por PRECIO_1/);
  });
  
  respuestaSanitizada = lineasFiltradas.join('\n');
  
  // Restaurar precios legítimos manteniendo el formato original
  respuestaSanitizada = respuestaSanitizada.replace(/PRECIO_LEGITIMO_([\d.,]+)/g, '$$$1');
  
  // Limpiar dobles espacios y saltos de línea innecesarios
  respuestaSanitizada = respuestaSanitizada
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Si después de sanitizar queda vacío o muy corto, devolver mensaje genérico
  if (!respuestaSanitizada || respuestaSanitizada.length < 20) {
    return "No logré encontrar información sobre ese servicio. ¿Necesitas consultar sobre algún otro servicio de lavandería?";
  }
  
  return respuestaSanitizada;
}

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
  
    let responseText = agentResponse.output || "No se pudo procesar la consulta.";
    console.log(`📤 Respuesta: ${responseText.substring(0, 50)}...`);
    
    // Aplicar sanitización para eliminar servicios prohibidos
    responseText = sanitizarRespuesta(responseText);
    console.log(`🔄 Respuesta sanitizada: ${responseText.substring(0, 50)}...`);
    
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
