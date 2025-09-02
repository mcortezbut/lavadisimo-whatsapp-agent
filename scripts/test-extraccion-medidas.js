// Probar la nueva función de extracción de medidas
function extraerMedidasDeFrase(texto) {
  // Patrones comunes en frases con medidas
  const patrones = [
    /(?:es|la|de|una)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(?:medidas?|tamaño)\s+(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(?:metros|m\.?)/i
  ];
  
  for (const patron of patrones) {
    const match = texto.match(patron);
    if (match) {
      const ancho = match[1].replace('.', ',');
      const largo = match[2].replace('.', ',');
      return `${ancho} M. X ${largo} M.`;
    }
  }
  
  return null;
}

// Probar diferentes casos
const casosPrueba = [
  'la de 2x3',
  'Y la de 2x3 cuanto sale?',
  'Es una de 1,2 x 1,7',
  'alfombra 2x3',
  'quiero una alfombra de 2.5x3',
  'medida 1.5 x 2 metros',
  'la alfombra de 2x3 metros',
  'es de 2.5 x 3.0'
];

console.log('🔍 Probando extracción de medidas de frases:');
casosPrueba.forEach((caso, index) => {
  const resultado = extraerMedidasDeFrase(caso);
  console.log(`${index + 1}. '${caso}' → ${resultado || 'No detectado'}`);
});
