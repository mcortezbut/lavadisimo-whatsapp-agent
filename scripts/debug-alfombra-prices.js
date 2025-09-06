import { DataSource } from "typeorm";
import dotenv from 'dotenv';

// Cargar variables de entorno
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

async function debugAlfombraPrices() {
  try {
    await datasource.initialize();
    console.log('🔍 Checking alfombra prices in database...\n');

    // Check for 1,6 x 2,3 specifically
    console.log('📊 Products with 1,6 x 2,3 pattern:');
    const results1 = await datasource.query(
      `SELECT NOMPROD, PRECIO 
       FROM PRODUCTOS 
       WHERE NOMPROD LIKE '%1,6%2,3%' 
         AND NOMPROD LIKE '%ALFOMBRA%'
         AND NULO = 0 
         AND IDUSUARIO = 'lavadisimo'`
    );
    
    if (results1.length > 0) {
      results1.forEach(prod => {
        console.log(`   - ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
    } else {
      console.log('   ❌ No products found with exact 1,6 x 2,3 pattern');
    }

    // Check for 2x3 specifically
    console.log('\n📊 Products with 2x3 pattern:');
    const results2 = await datasource.query(
      `SELECT NOMPROD, PRECIO 
       FROM PRODUCTOS 
       WHERE (NOMPROD LIKE '%2 M. X 3 M.%' OR NOMPROD LIKE '%2X3%' OR NOMPROD LIKE '%2 x 3%')
         AND NOMPROD LIKE '%ALFOMBRA%'
         AND NULO = 0 
         AND IDUSUARIO = 'lavadisimo'`
    );
    
    if (results2.length > 0) {
      results2.forEach(prod => {
        console.log(`   - ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
    } else {
      console.log('   ❌ No products found with exact 2x3 pattern');
    }

    // Check all alfombra products for context
    console.log('\n📋 All alfombra products:');
    const allAlfombras = await datasource.query(
      `SELECT NOMPROD, PRECIO 
       FROM PRODUCTOS 
       WHERE NOMPROD LIKE '%ALFOMBRA%'
         AND NULO = 0 
         AND IDUSUARIO = 'lavadisimo'
       ORDER BY NOMPROD`
    );
    
    allAlfombras.forEach(prod => {
      console.log(`   - ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (datasource.isInitialized) {
      await datasource.destroy();
    }
  }
}

debugAlfombraPrices();
