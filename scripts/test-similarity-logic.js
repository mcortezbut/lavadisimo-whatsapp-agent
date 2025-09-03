// Test script to verify numerical similarity logic with mock database data
import { parsearMedidasANumeros } from '../src/agent/tools/precioTool.js';

// Mock database data representing actual products
const mockProductos = [
  { NOMPROD: 'ALFOMBRA 2 M. X 3 M.', PRECIO: 38500 },
  { NOMPROD: 'ALFOMBRA 1,5 M. X 2,2 M.', PRECIO: 30800 },
  { NOMPROD: 'ALFOMBRA 1,9 M. X 3,0 M.', PRECIO: 38500 },
  { NOMPROD: 'ALFOMBRA 1 M. X 2 M.', PRECIO: 22000 },
  { NOMPROD: 'ALFOMBRA 0,5 M. X 1 M.', PRECIO: 12700 },
  { NOMPROD: 'ALFOMBRA 1,5 M. X 3 M.', PRECIO: 33000 },
  { NOMPROD: 'ALFOMBRA 1,5 M. X 3,2 M.', PRECIO: 33000 },
  { NOMPROD: 'ALFOMBRA 1,5 M. X 3,4 M.', PRECIO: 35000 },
  { NOMPROD: 'ALFOMBRA 3 M. X 4 M.', PRECIO: 49500 }
];

function encontrarMedidaCercanaMock(anchoTarget, largoTarget) {
  let mejorMatch = null;
  let menorDiferencia = Infinity;

  for (const prod of mockProductos) {
    const medidas = parsearMedidasANumeros(prod.NOMPROD);
    if (medidas) {
      const diferenciaAncho = Math.abs(medidas.ancho - anchoTarget);
      const diferenciaLargo = Math.abs(medidas.largo - largoTarget);
      const diferenciaTotal = diferenciaAncho + diferenciaLargo;

      if (diferenciaTotal < menorDiferencia) {
        menorDiferencia = diferenciaTotal;
        mejorMatch = { ...prod, diferenciaTotal };
      }
    }
  }

  return mejorMatch;
}

function testSimilarityLogic() {
  console.log('🧪 Probando lógica de similitud numérica con datos mock...\n');
  
  // Test cases that should find closest matches
  const testCases = [
    { input: '2x2.90', expected: '2 M. X 3 M.', ancho: 2.0, largo: 2.9 },
    { input: '1.6x2.2', expected: '1,5 M. X 2,2 M.', ancho: 1.6, largo: 2.2 },
    { input: '1.8x2.8', expected: '1,9 M. X 3,0 M.', ancho: 1.8, largo: 2.8 },
    { input: '0.6x1.1', expected: '0,5 M. X 1 M.', ancho: 0.6, largo: 1.1 },
    { input: '3.1x4.1', expected: '3 M. X 4 M.', ancho: 3.1, largo: 4.1 }
  ];

  testCases.forEach(({ input, expected, ancho, largo }) => {
    console.log(`🔍 Buscando medida más cercana a: ${ancho} x ${largo} (de "${input}")`);
    
    const mejorMatch = encontrarMedidaCercanaMock(ancho, largo);
    
    if (mejorMatch) {
      const medidas = parsearMedidasANumeros(mejorMatch.NOMPROD);
      console.log(`✅ Mejor match: ${mejorMatch.NOMPROD} - $${mejorMatch.PRECIO.toLocaleString('es-CL')}`);
      console.log(`   📏 Medidas: ${medidas.ancho} x ${medidas.largo}`);
      console.log(`   📊 Diferencia total: ${mejorMatch.diferenciaTotal.toFixed(2)}`);
      
      if (mejorMatch.NOMPROD.includes(expected)) {
        console.log(`   🎯 CORRECTO: Coincide con el esperado "${expected}"`);
      } else {
        console.log(`   ⚠️  DIFERENTE: Esperaba "${expected}", pero encontró "${mejorMatch.NOMPROD}"`);
      }
    } else {
      console.log('❌ No se encontró ninguna medida cercana');
    }
    console.log('');
  });

  // Test edge cases
  console.log('🧪 Probando casos extremos:');
  const edgeCases = [
    { input: '2x3', ancho: 2, largo: 3 }, // Exact match
    { input: '10x10', ancho: 10, largo: 10 }, // No existe
    { input: '0.1x0.1', ancho: 0.1, largo: 0.1 } // Muy pequeño
  ];

  edgeCases.forEach(({ input, ancho, largo }) => {
    const mejorMatch = encontrarMedidaCercanaMock(ancho, largo);
    console.log(`🔍 "${input}": ${mejorMatch ? mejorMatch.NOMPROD : 'No encontrado'}`);
  });
}

testSimilarityLogic();
