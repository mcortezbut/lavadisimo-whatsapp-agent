import databaseManager from '../src/agent/tools/databaseManager.js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function checkPoltronaProducts() {
  console.log('🔍 Buscando productos de poltronas en la base de datos...\n');
  
  try {
    // Buscar productos que contengan "POLTRONA", "SILLA", "BUTACA"
    const query = `
      SELECT
        pt.IDPROD,
        pt.NOMPROD, 
        pt.PRECIO,
        c.NOMCAT as CATEGORIA
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND (pt.NOMPROD LIKE '%POLTRONA%' OR pt.NOMPROD LIKE '%SILLA%' OR pt.NOMPROD LIKE '%BUTACA%')
      ORDER BY pt.NOMPROD
    `;

    const resultados = await databaseManager.executeQuery(query, []);
    
    console.log(`📊 Encontrados ${resultados.length} productos relacionados con poltronas/sillas/butacas:\n`);
    
    if (resultados.length > 0) {
      resultados.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.NOMPROD}: $${prod.PRECIO}${prod.CATEGORIA ? ` (${prod.CATEGORIA})` : ''}`);
      });
    } else {
      console.log('❌ No se encontraron productos de poltronas, sillas o butacas en la base de datos');
      
      // Buscar otros tipos de muebles
      console.log('\n🔍 Buscando otros tipos de muebles...');
      const queryMuebles = `
        SELECT DISTINCT NOMPROD 
        FROM PRODUCTOS 
        WHERE IDUSUARIO = 'lavadisimo' AND NULO = 0
        AND (NOMPROD LIKE '%SOFA%' OR NOMPROD LIKE '%SILLON%' OR NOMPROD LIKE '%ASIENTO%')
        ORDER BY NOMPROD
      `;
      
      const muebles = await databaseManager.executeQuery(queryMuebles, []);
      if (muebles.length > 0) {
        console.log('\n📋 Otros muebles encontrados:');
        muebles.forEach((mueble, index) => {
          console.log(`${index + 1}. ${mueble.NOMPROD}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error al consultar la base de datos:', error.message);
  }
}

// Ejecutar la función
checkPoltronaProducts();
