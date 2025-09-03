import databaseManager from '../src/agent/tools/databaseManager.js';

async function testDatabaseManager() {
  console.log("🧪 Probando Database Manager...");
  
  try {
    // Test health check
    console.log("🩺 Realizando health check...");
    const isHealthy = await databaseManager.healthCheck();
    console.log(isHealthy ? "✅ Health check exitoso" : "❌ Health check falló");
    
    if (isHealthy) {
      // Test simple query
      console.log("🔍 Ejecutando consulta simple...");
      const result = await databaseManager.executeQuery(
        "SELECT TOP 3 NOMPROD, PRECIO FROM PRODUCTOS WHERE IDUSUARIO = 'lavadisimo' AND NULO = 0 ORDER BY NOMPROD"
      );
      
      console.log("✅ Resultados de consulta:");
      result.forEach((prod, index) => {
        console.log(`${index + 1}. ${prod.NOMPROD}: $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error en Database Manager:", error.message);
  } finally {
    // Clean up
    await databaseManager.close();
    console.log("🧹 Conexión cerrada");
  }
}

testDatabaseManager().catch(console.error);
