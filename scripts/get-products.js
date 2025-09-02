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

    // Buscar chaquetas específicamente
    const chaquetas = await datasource.query(`
      SELECT DISTINCT pt.NOMPROD, pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND (pt.NOMPROD LIKE '%CHAQ%' OR pt.NOMPROD LIKE '%JACKET%' OR pt.NOMPROD LIKE '%CUERO%')
      ORDER BY pt.NOMPROD
    `);
    
    console.log('\n🧥 Productos relacionados con chaquetas/cuero:');
    chaquetas.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });
    
    // Buscar otros productos comunes con abreviaciones
    const otrosProductos = await datasource.query(`
      SELECT DISTINCT TOP 20 pt.NOMPROD
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0 AND pt.IDUSUARIO = 'lavadisimo'
        AND (pt.NOMPROD LIKE '%PANT%' OR pt.NOMPROD LIKE '%BLUS%' OR pt.NOMPROD LIKE '%CORT%' 
             OR pt.NOMPROD LIKE '%VEST%' OR pt.NOMPROD LIKE '%CAMI%' OR pt.NOMPROD LIKE '%POLO%')
      ORDER BY pt.NOMPROD
    `);
    
    console.log('\n👕 Otros productos de ropa:');
    otrosProductos.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD}`);
    });
    
    console.log(`\n📊 Chaquetas encontradas: ${chaquetas.length}`);
    console.log(`📊 Otros productos de ropa: ${otrosProductos.length}`);
    
    await datasource.destroy();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getProducts();
