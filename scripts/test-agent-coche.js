// Test script to simulate the agent processing "lavado de coche"
import { initializeAgent } from '../src/agent/manager.js';

async function testAgentCoche() {
  try {
    console.log('🧪 Probando agente con "lavado de coche"...\n');
    
    const agent = await initializeAgent();
    
    const testQueries = [
      'lavado de coche',
      'coche',
      'choche', // common typo
      'coche bebé',
      'carrito de bebé'
    ];
    
    for (const query of testQueries) {
      console.log(`🔍 Query: "${query}"`);
      
      try {
        const response = await agent.invoke({
          input: query,
          telefono: '123456789'
        });
        
        console.log(`📤 Respuesta: ${response.output}`);
        console.log('---');
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log('---');
      }
    }
    
  } catch (error) {
    console.error('❌ Error inicializando agente:', error.message);
  }
}

testAgentCoche();
