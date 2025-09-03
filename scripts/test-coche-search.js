// Test script to verify that "lavado de coche" finds "COCHE BEBE" in the database
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { 
    encrypt: false, 
    trustServerCertificate: true,
    enableArithAbort: true
  },
  extra: { 
    driver: "tedious", 
    requestTimeout: 30000,
    connectionTimeout: 30000
  }
});

async function testCocheSearch() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa\n');

    // Simulate the search for "lavado de coche" - expanded terms should be ['lavado de coche', 'COCHE']
    const terminosExpandidos = ['lavado de coche', 'COCHE'];
    
    console.log('🔍 Términos expandidos para "lavado de coche":', terminosExpandidos);
    
    // Build the search query like precioTool does
    const condicionesBusqueda = terminosExpandidos.map((_, index) => 
      `pt.NOMPROD LIKE '%' + @${index} + '%'`
    ).join(' OR ');
    
    console.log('📝 Condición de búsqueda:', condicionesBusqueda);
    
    // Execute the query
    const productos = await datasource.query(`
      SELECT TOP 5
        pt.NOMPROD, 
        pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE (${condicionesBusqueda})
        AND pt.NULO = 0
        AND pt.IDUSUARIO = 'lavadisimo'
      ORDER BY pt.NOMPROD
    `, terminosExpandidos);

    console.log('\n📊 Resultados de la búsqueda:');
    if (productos.length > 0) {
      productos.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
      
      // Check if "COCHE BEBE" was found
      const foundCocheBebe = productos.some(prod => prod.NOMPROD.includes('COCHE'));
      console.log(`\n✅ "COCHE BEBE" encontrado: ${foundCocheBebe ? 'SÍ' : 'NO'}`);
      
      if (foundCocheBebe) {
        console.log('🎯 El agente debería responder con el precio correcto ($25.000)');
      } else {
        console.log('❌ Problema: "COCHE BEBE" no se encuentra en los resultados');
      }
    } else {
      console.log('❌ No se encontraron productos');
    }

    await datasource.destroy();
    console.log('\n🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testCocheSearch();
