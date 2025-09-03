// Test script to verify numerical parsing of measures without database dependency
import { parsearMedidasANumeros } from '../src/agent/tools/precioTool.js';

function testParsing() {
  console.log('🧪 Probando parseo de medidas (sin base de datos)...\n');
  
  // Test parsing function with various formats
  console.log('🧪 Probando parseo de medidas:');
  const testCases = [
    '2 M. X 3 M.',
    '1,5 M. X 2,2 M.',
    '2.5 M. X 3.5 M.',
    'ALFOMBRA 2 M. X 3 M. - $38.500',
    '1 M. X 2 M.',
    '0,5 M. X 1 M.',
    '1.9 M. X 3.0 M.'
  ];
  
  testCases.forEach(testCase => {
    const medidas = parsearMedidasANumeros(testCase);
    if (medidas) {
      console.log(`✅ "${testCase}" → ${medidas.ancho} x ${medidas.largo}`);
    } else {
      console.log(`❌ "${testCase}" → No se pudo parsear`);
    }
  });

  // Test extraction from phrases
  console.log('\n🧪 Probando extracción de medidas de frases:');
  const frases = [
    'la de 2x3',
    'medida 1.5x2.2',
    'cuanto vale 1,3 x 1,9',
    'y la de 2x2.90?',
    'alfombra 1.6 x 2.2'
  ];

  frases.forEach(frase => {
    const medidaExtraida = extraerMedidasDeFrase(frase);
    if (medidaExtraida) {
      const medidas = parsearMedidasANumeros(medidaExtraida);
      if (medidas) {
        console.log(`✅ "${frase}" → ${medidas.ancho} x ${medidas.largo} (${medidaExtraida})`);
      } else {
        console.log(`❌ "${frase}" → Extraída: ${medidaExtraida}, pero no se pudo parsear`);
      }
    } else {
      console.log(`❌ "${frase}" → No se pudo extraer medidas`);
    }
  });
}

// Local function to extract measures from phrases (copied from precioTool.js for testing)
function extraerMedidasDeFrase(texto) {
  const patronGeneral = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  const matches = [...texto.matchAll(patronGeneral)];
  
  if (matches.length > 0) {
    const match = matches[0];
    const ancho = match[1].replace('.', ',');
    const largo = match[2].replace('.', ',');
    return `${ancho} M. X ${largo} M.`;
  }
  
  const patronesContextuales = [
    /(?:la|el|de|una|un).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(?:medidas?|tamaño|dimensiones?).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(?:cuanto|cual|precio|valor).*?(?:vale|es|de|para).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i
  ];
  
  for (const patron of patronesContextuales) {
    const match = texto.match(patron);
    if (match) {
      const ancho = match[1].replace('.', ',');
      const largo = match[2].replace('.', ',');
      return `${ancho} M. X ${largo} M.`;
    }
  }
  
  return null;
}

testParsing();
