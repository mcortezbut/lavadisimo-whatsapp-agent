// Script para probar la función mejorada de extracción de medidas
import { precioTool } from '../src/agent/tools/index.js';

// Función de prueba local para extraerMedidasDeFrase
function testExtraerMedidasDeFrase() {
  console.log('🧪 Probando función extraerMedidasDeFrase...\n');
  
  const testCases = [
    "la de 1,3 x 1,9",
    "Cuanto vale la de 1,3 x 1,9",
    "una de 2x3",
    "la de 2x3 cuanto vale",
    "alfombra 1,3x1,9",
    "quiero una alfombra 1,3x1,9",
    "1,3x1,9 cuanto vale",
    "medida 1,3 x 1,9",
    "tamaño 1.3x1.9",
    "1,3 x 1,9 metros"
  ];

  testCases.forEach((testCase, index) => {
    // Simular la función extraerMedidasDeFrase
    const patrones = [
      /(?:la|el|de|una|un)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
      /(?:medidas?|tamaño|dimensiones?)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
      /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:metros|m\.?)/i,
      /(?:cuanto|cual|precio|valor)\s+(?:vale|es|de|para)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
      /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)$/i,
      /^(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i
    ];
    
    let resultado = null;
    for (const patron of patrones) {
      const match = testCase.match(patron);
      if (match) {
        const ancho = match[1].replace('.', ',');
        const largo = match[2].replace('.', ',');
        resultado = `${ancho} M. X ${largo} M.`;
        break;
      }
    }
    
    console.log(`${index + 1}. "${testCase}" → ${resultado || '❌ No detectado'}`);
  });
}

// Probar la herramienta completa
async function testPrecioTool() {
  console.log('\n🧪 Probando precioTool con casos reales...\n');
  
  const testCases = [
    "la de 1,3 x 1,9",
    "Cuanto vale la de 1,3 x 1,9",
    "una de 2x3",
    "alfombra 1,3x1,9"
  ];

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Probando: "${testCase}"`);
      const resultado = await precioTool.invoke({ producto: testCase });
      
      if (resultado.includes('No encontré')) {
        console.log('❌ Resultado: No encontró el producto');
        console.log('Respuesta:', resultado.slice(0, 100) + '...');
      } else if (resultado.includes('$')) {
        console.log('✅ Resultado: Encontró productos con precios');
        console.log('Respuesta:', resultado.slice(0, 100) + '...');
      } else {
        console.log('⚠️ Resultado: Respuesta genérica');
        console.log('Respuesta:', resultado.slice(0, 100) + '...');
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error con "${testCase}":`, error.message);
      console.log('');
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de extracción de medidas...\n');
  
  // Probar función de extracción
  testExtraerMedidasDeFrase();
  
  // Esperar un momento y luego probar la herramienta completa
  setTimeout(() => {
    testPrecioTool().catch(console.error);
  }, 1000);
}

runTests().catch(console.error);
