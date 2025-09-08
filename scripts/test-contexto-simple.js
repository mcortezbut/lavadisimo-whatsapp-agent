// Script de prueba simple para verificar la lógica de contexto sin base de datos
function extraerContextoDelHistorial(historialChat) {
  if (!historialChat || !Array.isArray(historialChat) || historialChat.length === 0) return null;
  
  // Buscar en el historial las últimas menciones de productos
  const productosClave = ['poltrona', 'alfombra', 'cortina', 'chaqueta', 'pantalon', 'blusa', 'cobertor'];
  
  // Recorrer el historial de más reciente a más antiguo
  for (let i = historialChat.length - 1; i >= 0; i--) {
    const mensaje = historialChat[i];
    let contenido = mensaje;
    
    // Manejar diferentes formatos de mensaje
    if (typeof mensaje === 'object') {
      // LangChain BaseMessage format
      if (mensaje.content) {
        contenido = mensaje.content;
      } else if (mensaje.lc_kwargs && mensaje.lc_kwargs.content) {
        // Alternative LangChain format
        contenido = mensaje.lc_kwargs.content;
      } else {
        continue; // Skip if we can't extract content
      }
    }
    
    if (typeof contenido === 'string') {
      for (const producto of productosClave) {
        if (contenido.toLowerCase().includes(producto)) {
          return producto;
        }
      }
    }
  }
  
  return null;
}

function esRespuestaCortaNecesitaContexto(texto, historialChat) {
  const textoLimpio = texto.toLowerCase().trim();
  
  // Palabras que indican respuestas cortas a preguntas previas
  const indicadoresRespuestaCorta = [
    'es', 'es una', 'es un', 'la', 'el', 'una', 'un', 
    'mediana', 'pequeña', 'grande', 'xl', 'l', 'm', 's'
  ];
  
  const esRespuestaCorta = indicadoresRespuestaCorta.some(indicator => 
    textoLimpio === indicator || textoLimpio.startsWith(indicator + ' ')
  );
  
  if (!esRespuestaCorta) return false;
  
  // Verificar si hay contexto en el historial
  return extraerContextoDelHistorial(historialChat) !== null;
}

// Prueba de la lógica de contexto
console.log('🧪 Probando lógica de contexto sin base de datos...\n');

// Test 1: Historial con poltronas
const historialPoltrona = [
  "Hola, lavan poltronas?",
  "Sí, lavamos poltronas. ¿De qué tamaño es la poltrona que deseas lavar?",
  "Es mediana"
];

console.log('📋 Test 1 - Historial con poltronas:');
console.log('Historial:', JSON.stringify(historialPoltrona, null, 2));

const contexto1 = extraerContextoDelHistorial(historialPoltrona);
const necesitaContexto1 = esRespuestaCortaNecesitaContexto("Es mediana", historialPoltrona);

console.log('Contexto extraído:', contexto1);
console.log('¿Necesita contexto?', necesitaContexto1);
console.log('Producto final esperado:', contexto1 ? `${contexto1} mediana` : 'No se detectó contexto');
console.log('---\n');

// Test 2: Historial con alfombras
const historialAlfombra = [
  "Cuánto vale lavar una alfombra?",
  "¿De qué tamaño es la alfombra?",
  "2x3"
];

console.log('📋 Test 2 - Historial con alfombras:');
console.log('Historial:', JSON.stringify(historialAlfombra, null, 2));

const contexto2 = extraerContextoDelHistorial(historialAlfombra);
const necesitaContexto2 = esRespuestaCortaNecesitaContexto("2x3", historialAlfombra);

console.log('Contexto extraído:', contexto2);
console.log('¿Necesita contexto?', necesitaContexto2);
console.log('Producto final esperado:', contexto2 ? `${contexto2} 2x3` : 'No se detectó contexto');
console.log('---\n');

// Test 3: Sin historial relevante
const historialVacio = [
  "Hola, cómo estás?",
  "Bien, gracias. ¿En qué puedo ayudarte?"
];

console.log('📋 Test 3 - Sin historial relevante:');
console.log('Historial:', JSON.stringify(historialVacio, null, 2));

const contexto3 = extraerContextoDelHistorial(historialVacio);
const necesitaContexto3 = esRespuestaCortaNecesitaContexto("Es mediana", historialVacio);

console.log('Contexto extraído:', contexto3);
console.log('¿Necesita contexto?', necesitaContexto3);
console.log('Producto final esperado:', 'No debería detectar contexto');
console.log('---\n');

console.log('✅ Pruebas de lógica de contexto completadas');
