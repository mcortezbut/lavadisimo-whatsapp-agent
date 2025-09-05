import databaseManager from '../src/agent/tools/databaseManager.js';

async function checkAlfombraProducts() {
  try {
    console.log('🔍 Checking all alfombra products in database...');
    
    const results = await databaseManager.executeQuery(
      `SELECT NOMPROD, PRECIO 
       FROM PRODUCTOS 
       WHERE NOMPROD LIKE '%ALFOMBRA%' 
         AND NULO = 0 
         AND IDUSUARIO = 'lavadisimo'
       ORDER BY NOMPROD`,
      []
    );

    console.log(`📊 Found ${results.length} alfombra products:\n`);
    
    results.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

    // Check specifically for 1,6 x 2,3
    console.log('\n🔎 Specifically checking for 1,6 x 2,3 pattern:');
    const targetProducts = results.filter(prod => 
      prod.NOMPROD.includes('1,6') && prod.NOMPROD.includes('2,3')
    );

    if (targetProducts.length > 0) {
      console.log('✅ Found matching products:');
      targetProducts.forEach(prod => {
        console.log(`   - ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
    } else {
      console.log('❌ No products found with 1,6 x 2,3 pattern');
      
      // Show similar products for debugging
      console.log('\n📋 Products with similar patterns:');
      const similar = results.filter(prod => 
        prod.NOMPROD.includes('1,6') || prod.NOMPROD.includes('2,3')
      );
      
      similar.forEach(prod => {
        console.log(`   - ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
    }

  } catch (error) {
    console.error('Error checking products:', error);
  } finally {
    await databaseManager.close();
  }
}

// Run the check
checkAlfombraProducts();
