// Script para probar las correcciones localmente
import { precioTool } from '../src/agent/tools/index.js';

async function testLocalFixes() {
  console.log('🧪 Probando correcciones localmente...\n');

  // Test 1: Probar que no inventa información
  console.log('1. Probando que NO inventa "tareas de aseo":');
  try {
    const resultado1 = await precioTool.invoke({ producto: 'alfombra 1,6 x 2,2' });
    const inventaInfo = resultado1.includes('tareas de aseo') || resultado1.includes('reciclaje');
    console.log('✅ Resultado:', inventaInfo ? '❌ MAL - Sigue inventando' : '✅ BIEN - No inventa información');
    console.log('Respuesta:', resultado1.slice(0, 100) + '...');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 2: Probar búsqueda de "2x3"
  console.log('2. Probando búsqueda de "2x3":');
  try {
    const resultado2 = await precioTool.invoke({ producto: '2x3' });
    const encuentra = !resultado2.includes('No encontré') && resultado2.includes('$');
    console.log('✅ Resultado:', encuentra ? '✅ BIEN - Encuentra resultados' : '❌ MAL - No encuentra');
    console.log('Respuesta:', resultado2.slice(0, 100) + '...');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 3: Probar búsqueda de medidas en frases
  console.log('3. Probando búsqueda de medidas en frases:');
  const frasesPrueba = [
    'la de 2x3',
    'Una de 2x3',
    'alfombra 2x3',
    'quiero una alfombra de 2.5x3'
  ];

  for (const frase of frasesPrueba) {
    try {
      const resultado = await precioTool.invoke({ producto: frase });
      const tienePrecio = resultado.includes('$') && !resultado.includes('No encontré');
      console.log(`   "${frase}": ${tienePrecio ? '✅' : '❌'} ${tienePrecio ? 'Encuentra' : 'No encuentra'}`);
    } catch (error) {
      console.log(`   "${frase}": ❌ Error: ${error.message}`);
    }
  }
}

// Ejecutar prueba
testLocalFixes().catch(console.error);
