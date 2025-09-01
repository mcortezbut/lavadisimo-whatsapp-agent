import { initializeAgent } from '../src/agent/manager.js';

// Script de prueba para el agente sin necesidad de WhatsApp
async function testAgent() {
  console.log('🧪 Iniciando pruebas del agente...\n');
  
  try {
    // Inicializar el agente
    const agent = await initializeAgent();
    console.log('✅ Agente inicializado correctamente\n');

    // Prueba 1: Consulta de precio
    console.log('📋 Prueba 1: Consulta de precio');
    console.log('Entrada: "¿Cuánto cuesta lavar una camisa?"');
    
    const response1 = await agent.invoke({
      input: "¿Cuánto cuesta lavar una camisa?",
      telefono: "56912345678"
    });
    
    console.log('Respuesta:', response1.output);
    console.log('---\n');

    // Prueba 2: Verificación de estado por orden
    console.log('📋 Prueba 2: Verificación de estado por orden');
    console.log('Entrada: "¿Cómo va mi orden 12345?"');
    
    const response2 = await agent.invoke({
      input: "¿Cómo va mi orden 12345?",
      telefono: "56912345678"
    });
    
    console.log('Respuesta:', response2.output);
    console.log('---\n');

    // Prueba 3: Verificación de estado por teléfono
    console.log('📋 Prueba 3: Verificación de estado por teléfono');
    console.log('Entrada: "¿Tienes alguna orden mía?"');
    
    const response3 = await agent.invoke({
      input: "¿Tienes alguna orden mía?",
      telefono: "56912345678"
    });
    
    console.log('Respuesta:', response3.output);
    console.log('---\n');

    // Prueba 4: Consulta general
    console.log('📋 Prueba 4: Consulta general');
    console.log('Entrada: "Hola, ¿qué servicios tienen?"');
    
    const response4 = await agent.invoke({
      input: "Hola, ¿qué servicios tienen?",
      telefono: "56912345678"
    });
    
    console.log('Respuesta:', response4.output);
    console.log('---\n');

    console.log('✅ Todas las pruebas completadas');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar las pruebas
testAgent();
