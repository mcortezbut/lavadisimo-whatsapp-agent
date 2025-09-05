import { initializeAgent } from '../src/agent/manager.js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Script de prueba específico para variantes de poltronas
async function testPoltronaVariants() {
  console.log('🧪 Iniciando prueba de variantes para poltronas...\n');
  
  try {
    // Inicializar el agente
    const agent = await initializeAgent();
    console.log('✅ Agente inicializado correctamente\n');

    // Prueba: Consulta de poltrona mediana
    console.log('📋 Prueba: "poltrona mediana"');
    console.log('Entrada: "¿Cuánto cuesta lavar una poltrona mediana?"');
    
    const response = await agent.invoke({
      input: "¿Cuánto cuesta lavar una poltrona mediana?",
      telefono: "56912345678"
    });
    
    console.log('Respuesta:', response.output);
    console.log('---\n');

    // Prueba adicional: cobertor extra
    console.log('📋 Prueba adicional: "cobertor extra"');
    console.log('Entrada: "Lavado de cobertor extra"');
    
    const response2 = await agent.invoke({
      input: "Lavado de cobertor extra",
      telefono: "56912345678"
    });
    
    console.log('Respuesta:', response2.output);
    console.log('---\n');

    console.log('✅ Pruebas de variantes completadas');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    process.exit(1);
  }
}

// Ejecutar las pruebas
testPoltronaVariants();
