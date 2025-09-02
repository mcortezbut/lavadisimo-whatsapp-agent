import { DataSource } from "typeorm";
import { config } from 'dotenv';

// Cargar variables de entorno desde .env
config();

// Script para probar conexión directa a la base de datos
const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: true, trustServerCertificate: true },
  extra: { driver: "tedious", requestTimeout: 10000 }
});

async function testConnection() {
  console.log('🔍 Probando conexión directa a la base de datos...\n');
  
  console.log('📋 Credenciales detectadas:');
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '[CONFIGURADO]' : '[NO CONFIGURADO]'}\n`);
  
  try {
    console.log('🔄 Intentando conectar...');
    await datasource.initialize();
    console.log('✅ ¡Conexión exitosa!\n');
    
    // Probar una query simple
    console.log('📊 Probando query básica...');
    const result = await datasource.query('SELECT @@VERSION as version');
    console.log('✅ Query exitosa:', result[0]?.version?.substring(0, 50) + '...\n');
    
    // Listar tablas disponibles
    console.log('📋 Listando tablas disponibles...');
    const tables = await datasource.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log(`✅ Encontradas ${tables.length} tablas:`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });
    
    console.log('\n🎉 ¡La conexión funciona perfectamente!');
    console.log('💡 Ahora puedes ejecutar: npm run explore-db');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que las credenciales sean correctas');
    console.log('2. Confirma que el servidor esté accesible');
    console.log('3. Revisa la configuración de firewall');
    console.log('4. Verifica que el usuario tenga permisos');
  } finally {
    if (datasource.isInitialized) {
      await datasource.destroy();
    }
  }
}

// Ejecutar prueba
testConnection();
