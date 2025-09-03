// Script para debuggear por qué no se detecta "2x3"
function extraerMedidasDeFrase(texto) {
  console.log(`🔍 Analizando: "${texto}"`);
  
  // Primero, intentar encontrar cualquier patrón de medidas en el texto
  const patronGeneral = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  const matches = [...texto.matchAll(patronGeneral)];
  
  console.log('📊 Patrón general matches:', matches);
  
  if (matches.length > 0) {
    // Tomar la primera coincidencia de medidas
    const match = matches[0];
    const ancho = match[1].replace('.', ',');
    const largo = match[2].replace('.', ',');
    const resultado = `${ancho} M. X ${largo} M.`;
    console.log('✅ Medidas extraídas:', resultado);
    return resultado;
  }
  
  // Si no se encuentra con el patrón general, intentar con patrones contextuales
  const patronesContextuales = [
    // "la de 1,3 x 1,9" - incluso con palabras intermedias
    /(?:la|el|de|una|un).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    
    // "medida 1,3x1,9" o "tamaño 1.3x1.9" con palabras antes
    /(?:medidas?|tamaño|dimensiones?).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    
    // "cuanto vale 1,3x1,9" con palabras alrededor
    /(?:cuanto|cual|precio|valor).*?(?:vale|es|de|para).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i
  ];
  
  for (const patron of patronesContextuales) {
    const match = texto.match(patron);
    if (match) {
      const ancho = match[1].replace('.', ',');
      const largo = match[2].replace('.', ',');
      const resultado = `${ancho} M. X ${largo} M.`;
      console.log('✅ Medidas extraídas con patrón contextual:', resultado);
      return resultado;
    }
  }
  
  console.log('❌ No se pudieron extraer medidas');
  return null;
}

// Casos de prueba
const testCases = [
  "La de 1,6 x 2,3?",
  "Y la de 2x3 cuanto vale?",
  "la de 2x3",
  "2x3",
  "alfombra 2x3",
  "cuanto vale la de 2x3",
  "si q sale la de 1,3 x 1,9"
];

console.log('🧪 Probando extracción de medidas...\n');

testCases.forEach((testCase, index) => {
  console.log(`=== TEST CASE ${index + 1} ===`);
  const resultado = extraerMedidasDeFrase(testCase);
  console.log('Resultado final:', resultado);
  console.log('='.repeat(50));
  console.log('');
});
