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

async function checkAlfombra2x3() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa');

    // Buscar específicamente alfombra 2x3 o variaciones
    const searchTerms = [
      '2 M. X 3 M.',
      '2X3',
      '2 x 3',
      '2,0 x 3,0',
      '2.0 x 3.0',
      '200 x 300',
      '2 metros x 3 metros'
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

    // Verificar todas las alfombras disponibles
    console.log('\n📋 Listando todas las alfombras disponibles:');
    const allAlfombras = await datasource.query(`
      SELECT pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND pt.NOMPROD LIKE '%ALFOMBRA%'
      ORDER BY pt.PRECIO
    `);

    console.log(`📊 Total de alfombras: ${allAlfombras.length}`);
    allAlfombras.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

    await datasource.destroy();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAlfombra2x3();
