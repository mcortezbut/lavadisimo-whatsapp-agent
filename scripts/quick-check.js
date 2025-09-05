import databaseManager from '../src/agent/tools/databaseManager.js';

async function quickCheck() {
  try {
    console.log('Quick check for alfombra products...');
    
    const results = await databaseManager.executeQuery(
      `SELECT NOMPROD, PRECIO 
       FROM PRODUCTOS 
       WHERE NOMPROD LIKE '%ALFOMBRA%' 
         AND NULO = 0 
         AND IDUSUARIO = 'lavadisimo'
       ORDER BY NOMPROD`,
      []
    );

    console.log(`Found ${results.length} alfombra products:\n`);
    
    results.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

    // Check if 1,6 x 2,3 exists
    const target = results.find(prod => 
      prod.NOMPROD.includes('1,6') && prod.NOMPROD.includes('2,3')
    );

    if (target) {
      console.log(`\n✅ FOUND: ${target.NOMPROD}: $${parseInt(target.PRECIO).toLocaleString('es-CL')}`);
    } else {
      console.log('\n❌ NOT FOUND: Alfombra 1,6 x 2,3');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await databaseManager.close();
  }
}

quickCheck();
