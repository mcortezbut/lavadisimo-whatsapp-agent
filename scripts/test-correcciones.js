// Script para probar que las correcciones funcionan localmente
import { precioTool } from '../src/agent/tools/index.js';

async function testCorrecciones() {
  console.log('🧪 Probando correcciones de invención de información y búsqueda de medidas...\n');

  // Test 1: Probar que no inventa información
  console.log('1. Probando que NO inventa "tareas de aseo":');
  try {
    const resultado1 = await precioTool.invoke({ producto: 'alfombra 1,6 x 2,2' });
    console.log('✅ Resultado:', resultado1.includes('tareas de aseo') ? '❌ MAL - Sigue inventando' : '✅ BIEN - No inventa información');
    console.log('Respuesta:', resultado1.slice(0, 100) + '...');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 2: Probar búsqueda de "la de 2x3"
  console.log('2. Probando búsqueda de "la de 2x3":');
  try {
    const resultado2 = await precioTool.invoke({ producto: 'la de 2x3' });
    console.log('✅ Resultado:', resultado2.includes('No encontré') ? '❌ MAL - No encuentra' : '✅ BIEN - Encuentra resultados');
    console.log('Respuesta:', resultado2.slice(0, 100) + '...');
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  console.log('');

  // Test 3: Probar búsqueda de medidas en frases
  console.log('3. Probando búsqueda de medidas en frases:');
  const frasesPrueba = [
    'la de 2x3',
    'Y la de 2x3 cuanto sale?',
    'Es una de 1,2 x 1,7',
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

testCorrecciones().catch(console.error);
