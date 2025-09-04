// Test the improved measure extraction
function extraerMedidasPrecisas(texto) {
  const patrones = [
    /(\d+[.,]?\d*)\s*M\.\s*X\s*(\d+[.,]?\d*)\s*M\./,
    /(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)/,
    /(\d+[.,]?\d*)\s*por\s*(\d+[.,]?\d*)/i,
    /(?:la|el|de|una|un)\s+.*?(\d+[.,]?\d*)\s*[xX×]\s*(\d+[.,]?\d*)/i
  ];

  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      const ancho = parseFloat(match[1].replace(',', '.'));
      const largo = parseFloat(match[2].replace(',', '.'));
      
      if (!isNaN(ancho) && !isNaN(largo) && ancho > 0 && largo > 0) {
        return { ancho, largo, original: match[0] };
      }
    }
  }
  return null;
}

// Test cases
const testCases = [
  '2x3',
  'una de 2x3',
  '2,0 x 3,0',
  '1,6 x 2,3',
  'alfombra 2x3',
  'Y una de 2x3?'
];

console.log('Testing improved measure extraction:');
testCases.forEach(test => {
  const result = extraerMedidasPrecisas(test);
  console.log('"' + test + '" -> ', result);
});
