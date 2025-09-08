import { initializeAgent } from '../src/agent/manager.js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Script de prueba específico para búsqueda contextual
async function testContextualSearch() {
  console.log('🧪 Iniciando prueba de búsqueda contextual...\n');
  
  try {
    // Inicializar el agente
    const agent = await initializeAgent();
    console.log('✅ Agente inicializado correctamente\n');

    // Simular conversación completa
    const chatHistory = [];
    
    // Paso 1: Preguntar por poltronas
    console.log('📋 Paso 1: Preguntar por poltronas');
    console.log('Entrada: "Y lavan poltronas?"');
    
    const response1 = await agent.invoke({
      input: "Y lavan poltronas?",
      telefono: "56912345678",
      historialChat: chatHistory
    });
    
    console.log('Respuesta:', response1.output);
    chatHistory.push("Y lavan poltronas?");
    chatHistory.push(response1.output);
    console.log('---\n');

    // Paso 2: Responder "Es mediana"
    console.log('📋 Paso 2: Respuesta contextual');
    console.log('Entrada: "Es mediana"');
    
    const response2 = await agent.invoke({
      input: "Es mediana",
      telefono: "56912345678",
      historialChat: chatHistory
    });
    
    console.log('Respuesta:', response2.output);
    console.log('---\n');

    console.log('✅ Prueba de contexto completada');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    process.exit(1);
  }
}

// Ejecutar la prueba
testContextualSearch();
