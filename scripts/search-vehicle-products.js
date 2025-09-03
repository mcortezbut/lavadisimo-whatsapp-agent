import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

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

async function searchVehicleProducts() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa');

    // Search for vehicle-related products
    const searchTerms = [
      'COCHE',
      'AUTO',
      'VEHICULO',
      'VEHÍCULO',
      'CARRO',
      'SEDAN',
      'SUV',
      'VAN',
      'PICKUP',
      'CAMIONETA'
    ];

    for (const term of searchTerms) {
      console.log(`\n🔍 Buscando: "${term}"`);
      
      const results = await datasource.query(`
        SELECT pt.NOMPROD, pt.PRECIO
        FROM PRODUCTOS pt
        INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
        ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
        WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
          AND pt.NOMPROD LIKE '%' + @0 + '%'
        ORDER BY pt.NOMPROD
      `, [term]);

      if (results.length > 0) {
        console.log(`✅ Encontrados ${results.length} resultados:`);
        results.forEach((prod, index) => {
          console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
        });
      } else {
        console.log('❌ No se encontraron resultados');
      }
    }

    // Also search for "lavado" to see if there are washing services
    console.log('\n🔍 Buscando servicios de lavado:');
    const lavadoResults = await datasource.query(`
      SELECT pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND pt.NOMPROD LIKE '%LAVADO%'
      ORDER BY pt.NOMPROD
    `);

    if (lavadoResults.length > 0) {
      console.log(`✅ Encontrados ${lavadoResults.length} resultados para lavado:`);
      lavadoResults.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
    } else {
      console.log('❌ No se encontraron servicios de lavado');
    }

    await datasource.destroy();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

searchVehicleProducts();
