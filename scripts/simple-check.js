// Simple script to check database content without ES6 modules
const { DataSource } = require('typeorm');
require('dotenv').config();

async function simpleCheck() {
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
      SELECT NOMPROD, PRECIO 
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

    // Check specifically for 1,6 x 2,3 pattern
    console.log('\n🔍 Searching for 1,6 x 2,3 pattern...');
    const target = results.find(prod => 
      prod.NOMPROD.includes('1,6') && prod.NOMPROD.includes('2,3')
    );

    if (target) {
      console.log(`✅ FOUND: ${target.NOMPROD}: $${parseInt(target.PRECIO).toLocaleString('es-CL')}`);
    } else {
      console.log('❌ NOT FOUND: Alfombra 1,6 x 2,3');
      
      // Show what patterns actually exist
      console.log('\n📋 Available patterns in database:');
      const patterns = results.map(p => {
        const match = p.NOMPROD.match(/(\d+,\d+)\s*M\.\s*X\s*(\d+,\d+)\s*M\./);
        return match ? `${match[1]} x ${match[2]}` : 'No pattern';
      }).filter(p => p !== 'No pattern');
      
      patterns.forEach(p => console.log(`   - ${p}`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (datasource.isInitialized) {
      await datasource.destroy();
      console.log('🔌 Connection closed');
    }
  }
}

simpleCheck();
