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

async function testExactQuery() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa');

    // Simulate the exact query that would be generated for "2x3"
    const searchTerms = ['2x3', '2 M. X 3 M.'];
    
    console.log(`\n🔍 Ejecutando consulta exacta con términos:`, searchTerms);
    
    const query = `
      SELECT TOP 5
        pt.IDPROD,
        pt.NOMPROD, 
        pt.PRECIO,
        c.NOMCAT as CATEGORIA
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
      WHERE (pt.NOMPROD LIKE '%' + @0 + '%' OR pt.NOMPROD LIKE '%' + @1 + '%')
        AND pt.NULO = 0
        AND pt.IDUSUARIO = 'lavadisimo'
      ORDER BY 
        CASE WHEN pt.NOMPROD LIKE @0 + '%' THEN 1 ELSE 2 END,
        LEN(pt.NOMPROD),
        pt.PRECIO
    `;

    console.log('📋 Query:');
    console.log(query);
    console.log('📋 Parámetros:', searchTerms);

    const results = await datasource.query(query, searchTerms);
    
    console.log(`\n📊 Resultados encontrados: ${results.length}`);
    
    if (results.length > 0) {
      results.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
    } else {
      console.log('❌ No se encontraron resultados con esta consulta exacta');
      
      // Let's debug why - check what each term finds individually
      console.log('\n🔍 Debug: Probando cada término individualmente...');
      
      for (let i = 0; i < searchTerms.length; i++) {
        const term = searchTerms[i];
        console.log(`\nBuscando solo: "${term}"`);
        
        const individualResults = await datasource.query(`
          SELECT pt.NOMPROD, pt.PRECIO
          FROM PRODUCTOS pt
          INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
          ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
          WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
            AND pt.NOMPROD LIKE '%' + @0 + '%'
        `, [term]);
        
        console.log(`Resultados: ${individualResults.length}`);
        individualResults.forEach((prod, idx) => {
          console.log(`${idx + 1}. ${prod.NOMPROD}`);
        });
      }
    }

    await datasource.destroy();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExactQuery();
