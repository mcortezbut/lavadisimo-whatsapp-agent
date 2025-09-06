import precioTool from '../src/agent/tools/precioTool.js';

async function testPrecioFix() {
  console.log('🧪 Probando corrección de precios para alfombras...\n');

  // Test case 1: 1,6 x 2,3
  console.log('=== TEST CASE 1: "alfombra 1,6 x 2,3" ===');
  const result1 = await precioTool.func({ producto: "alfombra 1,6 x 2,3" });
  console.log('Resultado:', result1);
  console.log('==========================================\n');

  // Test case 2: 2x3
  console.log('=== TEST CASE 2: "alfombra 2x3" ===');
  const result2 = await precioTool.func({ producto: "alfombra 2x3" });
  console.log('Resultado:', result2);
  console.log('==========================================\n');

  // Test case 3: La de 1,6 x 2,3
  console.log('=== TEST CASE 3: "La de 1,6 x 2,3" ===');
  const result3 = await precioTool.func({ producto: "La de 1,6 x 2,3" });
  console.log('Resultado:', result3);
  console.log('==========================================\n');

  // Test case 4: 2x3 cuanto vale
  console.log('=== TEST CASE 4: "2x3 cuanto vale" ===');
  const result4 = await precioTool.func({ producto: "2x3 cuanto vale" });
  console.log('Resultado:', result4);
  console.log('==========================================\n');
}

testPrecioFix().catch(console.error);
