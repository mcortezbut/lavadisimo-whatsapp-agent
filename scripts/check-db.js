// Simple script to check database content with ES modules
import { DataSource } from "typeorm";
import dotenv from "dotenv";
dotenv.config();

async function checkDb() {
  const datasource = new DataSource({
    type: "mssql",
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: { 
      encrypt: false, 
      trustServerCertificate: true,
      enableArithAbort: true,
    },
    extra: { 
      driver: "tedious", 
    }
  });

  try {
    await datasource.initialize();
    console.log('✅ Connected to database');
    
    // Check all alfombra products
    const results = await datasource.query(`
      SELECT TOP 10 NOMPROD, PRECIO 
      FROM PRODUCTOS 
      WHERE NOMPROD LIKE '%ALFOMBRA%' 
        AND NULO = 0 
        AND IDUSUARIO = 'lavadisimo'
      ORDER BY NOMPROD
    `);

    console.log(`📊 Found ${results.length} alfombra products:\n`);
    
    results.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (datasource.isInitialized) {
      await datasource.destroy();
      console.log('🔌 Connection closed');
    }
  }
}

checkDb();
