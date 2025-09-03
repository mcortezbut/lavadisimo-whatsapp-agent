// Script para probar la función de sanitización de respuestas
function sanitizarRespuesta(respuesta) {
  if (typeof respuesta !== 'string') return respuesta;
  
  // Lista de servicios prohibidos que NO deben mencionarse
  const serviciosProhibidos = [
    'tareas de aseo',
    'tarea de aseo',
    'reciclaje',
    'reciclaje de plásticos',
    'baño de mujer',
    'baño de hombre',
    '\\$1', // Servicios de $1
    'por \\$1',
    'cada uno por \\$1'
  ];
  
  // Eliminar menciones de servicios prohibidos
  let respuestaSanitizada = respuesta;
  serviciosProhibidos.forEach(prohibido => {
    const regex = new RegExp(prohibido, 'gi');
    respuestaSanitizada = respuestaSanitizada.replace(regex, '');
  });
  
  // Eliminar frases que contengan servicios prohibidos
  const lineas = respuestaSanitizada.split('\n');
  const lineasFiltradas = lineas.filter(linea => {
    const lowerLinea = linea.toLowerCase();
    return !lowerLinea.includes('aseo') && 
           !lowerLinea.includes('reciclaje') && 
           !lowerLinea.includes('baño') &&
           !lowerLinea.match(/por \$1|\$1 cada|cada uno por \$1/);
  });
  
  respuestaSanitizada = lineasFiltradas.join('\n');
  
  // Limpiar dobles espacios y saltos de línea innecesarios
  respuestaSanitizada = respuestaSanitizada
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Si después de sanitizar queda vacío, devolver mensaje genérico
  if (!respuestaSanitizada || respuestaSanitizada.length < 10) {
    return "No logré encontrar información sobre ese servicio. ¿Necesitas consultar sobre algún otro servicio de lavandería?";
  }
  
  return respuestaSanitizada;
}

// Casos de prueba basados en los logs problemáticos
const testCases = [
  {
    input: 'La alfombra de 1,3 metros por 1,9 metros tiene un costo de $26.400. Además, te puedo ofrecer otros servicios como la tarea de aseo en baño de mujer, la tarea de aseo en baño de hombre y la tarea de reciclaje de plásticos vacíos, cada uno por $1. ¿Te gustaría agendar alguno de estos servicios?',
    expected: 'Solo debería quedar información sobre la alfombra'
  },
  {
    input: 'El precio para lavar una alfombra de 2 metros por 3 metros es de $38.500. Además, te puedo ofrecer otros servicios como tareas de aseo en baños por $1 cada uno. ¿Te gustaría agendar el servicio de lavado de la alfombra?',
    expected: 'Solo debería quedar información sobre la alfombra'
  },
  {
    input: 'Tenemos varias opciones para el lavado de alfombras:\n\n1. ALFOMBRA REDONDA : $29.700\n2. ALFOMBRA 1,5 X 3 M: $33.000\n3. ALFOMBRA 1 M. X 2 M.: $22.000\n4. ALFOMBRA REDONDA 1.3: $27.000\n5. ALFOMBRA 1,5 X 3,2 M: $33.000\n6. ALFOMBRA 1,5 X 3,4 M: $35.000\n7. ALFOMBRA REDONDA 2,3 : $37.500\n8. ALFOMBRA 2 M. X 3 M.: $38.500\n9. ALFOMBRA 3 M. X 4 M.: $49.500\n10. ALFOMBRA 1,9 M. X 3,0 : $38.500\n11. ALFOMBRA 0,5 M. X 1 M.: $12.700\n12. ALFOMBRA 0,6 M. X 1 M.: $13.100\n13. ALFOMBRA 0,9 M. X 1 M.: $13.200\n14. ALFOMBRA 0,7 M. X 1 M.: $13.',
    expected: 'Debería mantenerse toda la lista de alfombras (sin cambios)'
  }
];

console.log('🧪 Probando función de sanitización...\n');

testCases.forEach((testCase, index) => {
  console.log(`=== TEST CASE ${index + 1} ===`);
  console.log('INPUT:');
  console.log(testCase.input);
  console.log('\nEXPECTED:');
  console.log(testCase.expected);
  
  const resultado = sanitizarRespuesta(testCase.input);
  console.log('\nRESULTADO:');
  console.log(resultado);
  
  // Verificar si se eliminaron servicios prohibidos
  const tieneProhibidos = 
    resultado.toLowerCase().includes('aseo') ||
    resultado.toLowerCase().includes('reciclaje') ||
    resultado.toLowerCase().includes('baño') ||
    resultado.match(/por \$1|\$1 cada|cada uno por \$1/i);
  
  console.log('\n✅ RESULTADO:');
  if (tieneProhibidos) {
    console.log('❌ FALLO - Todavía contiene servicios prohibidos');
  } else {
    console.log('✅ ÉXITO - Servicios prohibidos eliminados correctamente');
  }
  
  console.log('='.repeat(50));
  console.log('');
});
