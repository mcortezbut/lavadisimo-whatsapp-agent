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

async function getProducts() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa');

    // Analizar patrones de alfombras
    const alfombras = await datasource.query(`
      SELECT DISTINCT TOP 30 pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND pt.NOMPROD LIKE '%ALFOMBRA%'
      ORDER BY pt.PRECIO
    `);
    
    console.log('\n🏠 Patrones de alfombras:');
    alfombras.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });
    
    // Analizar productos de cama
    const cama = await datasource.query(`
      SELECT DISTINCT TOP 20 pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND (pt.NOMPROD LIKE '%COBERTOR%' OR pt.NOMPROD LIKE '%FRAZADA%' OR pt.NOMPROD LIKE '%EDREDON%' 
             OR pt.NOMPROD LIKE '%PLUMON%' OR pt.NOMPROD LIKE '%SABANA%' OR pt.NOMPROD LIKE '%PL%')
      ORDER BY pt.NOMPROD
    `);
    
    console.log('\n🛏️ Productos de cama:');
    cama.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });
    
    // Analizar cortinas
    const cortinas = await datasource.query(`
      SELECT DISTINCT TOP 15 pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND pt.NOMPROD LIKE '%CORTINA%'
      ORDER BY pt.PRECIO
    `);
    
    console.log('\n🪟 Productos de cortinas:');
    cortinas.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });
    
    console.log(`\n📊 Alfombras encontradas: ${alfombras.length}`);
    console.log(`📊 Productos de cama: ${cama.length}`);
    console.log(`📊 Cortinas: ${cortinas.length}`);
    
    await datasource.destroy();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getProducts();
