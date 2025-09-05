import { contextManagerTool, obtenerContextoTool, registrarMensajeAgente, limpiarContexto } from '../src/agent/tools/contextManager.js';

async function testContextManager() {
  console.log('🧪 Testing Context Manager...\n');

  const testPhone = '12345678';

  // Clear any existing context for this test
  limpiarContexto(testPhone);

  // Test 1: Initial context should be empty
  console.log('1. Testing initial context...');
  const initialContext = await obtenerContextoTool.func({ telefono: testPhone });
  console.log('Initial context:', initialContext);
  console.log('✅ Expected: historialVacio: true\n');

  // Test 2: Process a message about poltronas
  console.log('2. Processing message about poltronas...');
  const poltronaResult = await contextManagerTool.func({
    telefono: testPhone,
    mensaje: 'Y cuanto vale lavar una poltrona?',
    servicio: 'poltrona'
  });
  console.log('Poltrona context result:', poltronaResult);
  console.log('✅ Expected: servicio: "poltrona"\n');

  // Test 3: Record agent's question about size
  console.log('3. Recording agent question about size...');
  registrarMensajeAgente(testPhone, '¿Qué tamaño necesitas para la poltrona? (chica, mediana, grande)');
  console.log('✅ Agent question recorded\n');

  // Test 4: Get context to see current state
  console.log('4. Getting current context after agent question...');
  const contextAfterQuestion = await obtenerContextoTool.func({ telefono: testPhone });
  console.log('Context after agent question:', contextAfterQuestion);
  console.log('✅ Expected: servicio: "poltrona", ultimoMensaje should be agent question\n');

  // Test 5: Process client response with just size
  console.log('5. Processing client size response "Creo q es mediana"...');
  const sizeResponse = await contextManagerTool.func({
    telefono: testPhone,
    mensaje: 'Creo q es mediana'
  });
  console.log('Size response context result:', sizeResponse);
  console.log('✅ Expected: servicio: "poltrona", variantes: { tamaño: "mediana" }, esRespuestaContextual: true\n');

  // Test 6: Final context check
  console.log('6. Final context check...');
  const finalContext = await obtenerContextoTool.func({ telefono: testPhone });
  console.log('Final context:', finalContext);
  console.log('✅ Expected: servicio: "poltrona", variantes: { tamaño: "mediana" }, esRespuestaDirecta: true\n');

  console.log('🎯 Context Manager Test Completed!');
  console.log('The system should now correctly handle "es mediana" responses by maintaining poltrona context.');
}

// Run the test
testContextManager().catch(console.error);
