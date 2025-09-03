// Test the search expansion and SQL query generation for "2x3"
import dotenv from 'dotenv';
dotenv.config();

// Import the functions from precioTool
function normalizarMedidas(texto) {
  const patronMedidas = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  return texto.replace(patronMedidas, (match, ancho, largo) => {
    const anchoNorm = ancho.replace('.', ',');
    const largoNorm = largo.replace('.', ',');
    return `${anchoNorm} M. X ${largoNorm} M.`;
  });
}

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

const sinonimos = {
  "alfombra": ["ALFOMBRA"],
  "alfombras": ["ALFOMBRA"]
};

function expandirBusqueda(termino) {
  let terminoNormalizado = normalizarMedidas(termino);
  const terminoLower = terminoNormalizado.toLowerCase().trim();
  
  let terminosExpandidos = [termino, terminoNormalizado];
  
  const medidaExtraida = extraerMedidasDeFrase(termino);
  if (medidaExtraida) {
    terminosExpandidos.push(medidaExtraida);
  }
  
  const palabras = terminoLower.split(/\s+/);
  palabras.forEach(palabra => {
    if (sinonimos[palabra]) {
      terminosExpandidos = terminosExpandidos.concat(sinonimos[palabra]);
    }
  });
  
  if (sinonimos[terminoLower]) {
    terminosExpandidos = terminosExpandidos.concat(sinonimos[terminoLower]);
  }
  
  return [...new Set(terminosExpandidos)].filter(t => t && t.trim());
}

// Test cases
const testCases = [
  "2x3",
  "la de 2x3",
  "alfombra 2x3",
  "Y la de 2x3 cuanto vale?"
];

console.log('🧪 Probando expansión de búsqueda para "2x3"...\n');

testCases.forEach((testCase, index) => {
  console.log(`=== TEST CASE ${index + 1} ===`);
  console.log('Input:', testCase);
  
  const expanded = expandirBusqueda(testCase);
  console.log('Términos expandidos:', expanded);
  
  // Check if "2 M. X 3 M." is in the expanded terms
  const has2x3 = expanded.includes('2 M. X 3 M.');
  console.log('¿Incluye "2 M. X 3 M."?', has2x3 ? '✅ SÍ' : '❌ NO');
  
  console.log('');
});

// Test the SQL query generation
console.log('📊 Probando generación de consulta SQL...\n');
const testTerm = "2x3";
const expandedTerms = expandirBusqueda(testTerm);
console.log('Términos para "2x3":', expandedTerms);

// Simulate the SQL query generation
const condicionesBusqueda = expandedTerms.map((_, index) => 
  `pt.NOMPROD LIKE '%' + @${index} + '%'`
).join(' OR ');

console.log('Condición SQL generada:');
console.log(condicionesBusqueda);
console.log('Parámetros:', expandedTerms);
