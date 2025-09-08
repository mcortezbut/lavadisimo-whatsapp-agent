import precioTool from '../src/agent/tools/precioTool.js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

// Script de prueba directa para la herramienta precioTool con historial
async function testPrecioToolConHistorial() {
  console.log('🧪 Iniciando prueba directa de precioTool con historial...\n');
  
  try {
    // Simular historial de conversación
    const historialChat = [
      "Hola, lavan poltronas?",
      "Sí, lavamos poltronas. ¿De qué tamaño es la poltrona que deseas lavar?",
      "Es mediana"
    ];

    console.log('📋 Historial de chat simulado:');
    console.log(JSON.stringify(historialChat, null, 2));
    console.log('---\n');

    // Llamar directamente a la herramienta con historial
    console.log('📋 Llamando a precioTool con: producto="Es mediana", historialChat=[historial completo]');
    
    const resultado = await precioTool.func({
      producto: "Es mediana",
      telefono: "56912345678",
      historialChat: historialChat
    });
    
    console.log('✅ Resultado de precioTool:');
    console.log(resultado);
    console.log('---\n');

    console.log('✅ Prueba directa completada');

  } catch (error) {
    console.error('❌ Error durante la prueba directa:', error);
    process.exit(1);
  }
}

// Ejecutar la prueba
testPrecioToolConHistorial();
