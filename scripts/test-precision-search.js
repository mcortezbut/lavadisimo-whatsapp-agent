import databaseManager from '../src/agent/tools/databaseManager.js';
import { extraerMedidasDeProducto, buscarPorMedidasExactas } from '../src/agent/tools/precisionSearchTool.js';

async function testPrecisionSearch() {
  try {
    console.log('🧪 Probando búsqueda por precisión para alfombra 1,6 x 2,3...');
    
    // Primero probar la extracción de medidas
    const testProducts = [
      'ALFOMBRA 1,6 M. X 2,3 M.',
      'ALFOMBRA 2 M. X 3 M.',
      'ALFOMBRA 1,5 M. X 3 M.',
      'ALFOMBRA 0,5 M. X 1 M.'
    ];
    
    console.log('\n📏 Probando extracción de medidas:');
    testProducts.forEach(product => {
      const medidas = extraerMedidasDeProducto(product);
      console.log(`${product} → ${medidas ? `${medidas.ancho} x ${medidas.largo}` : 'No medidas'}`);
    });
    
    // Probar búsqueda exacta para 1,6 x 2,3
    console.log('\n🔍 Buscando alfombra 1,6 x 2,3 exactamente...');
    const medidasTarget = { ancho: 1.6, largo: 2.3 };
    const resultados = await buscarPorMedidasExactas(medidasTarget, 'alfombra');
    
    console.log(`Resultados encontrados: ${resultados.length}`);
    
    if (resultados.length > 0) {
      console.log('\n✅ Productos encontrados:');
      resultados.forEach((prod, index) => {
        const medidas = extraerMedidasDeProducto(prod.NOMPROD);
        console.log(`${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')} ${medidas ? `(${medidas.ancho} x ${medidas.largo})` : ''}`);
      });
    } else {
      console.log('\n❌ No se encontraron productos exactos para 1,6 x 2,3');
      
      // Mostrar todas las alfombras disponibles para debugging
      console.log('\n📋 Todas las alfombras en la base de datos:');
      const todasAlfombras = await databaseManager.executeQuery(`
        SELECT NOMPROD, PRECIO 
        FROM PRODUCTOS 
        WHERE NOMPROD LIKE '%ALFOMBRA%' 
          AND NOMPROD LIKE '%M. X%' 
          AND NULO = 0 
          AND IDUSUARIO = 'lavadisimo'
        ORDER BY NOMPROD
      `, []);
      
      todasAlfombras.forEach((prod, index) => {
        const medidas = extraerMedidasDeProducto(prod.NOMPROD);
        console.log(`${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')} ${medidas ? `(${medidas.ancho} x ${medidas.largo})` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('Error en prueba:', error);
  } finally {
    await databaseManager.close();
  }
}

// Ejecutar la prueba
testPrecisionSearch();
