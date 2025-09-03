// Test script to verify synonym expansion for "coche"
import { expandirBusqueda } from '../src/agent/tools/precioTool.js';

console.log('🧪 Probando expansión de términos para "coche"...\n');

// Test cases for Chilean context (coche = baby stroller)
const testCases = [
  'lavado de coche',
  'coche',
  'coche bebé',
  'carrito de bebé',
  'cochecito'
];

testCases.forEach(term => {
  const expanded = expandirBusqueda(term);
  console.log(`🔍 Término: "${term}"`);
  console.log(`📦 Expandido:`, expanded);
  console.log('---');
});

// Also test if "COCHE" is in the expanded terms for relevant cases
const hasCoche = testCases.some(term => {
  const expanded = expandirBusqueda(term);
  return expanded.some(t => t.includes('COCHE'));
});

console.log(`✅ "COCHE" encontrado en expansiones: ${hasCoche ? 'SÍ' : 'NO'}`);

if (hasCoche) {
  console.log('🎯 La expansión debería encontrar "COCHE BEBE" en la base de datos');
} else {
  console.log('❌ Problema: "COCHE" no se expande correctamente');
}
