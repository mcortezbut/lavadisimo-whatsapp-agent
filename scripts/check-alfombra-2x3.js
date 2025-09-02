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

async function checkAlfombra2x3() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa\n');

    // Verificar si existe alfombra 2x3 en la base de datos
    const resultado = await datasource.query(`
      SELECT NOMPROD, PRECIO 
      FROM PRODUCTOS 
      WHERE NOMPROD LIKE '%2 M. X 3 M.%' 
        AND IDUSUARIO = 'lavadisimo' 
        AND NULO = 0
    `);
    
    console.log('Resultados para alfombra 2 M. X 3 M.:');
    console.log(resultado);
    
    // Verificar todas las alfombras que contengan '2' y '3'
    const todasAlfombras = await datasource.query(`
      SELECT NOMPROD, PRECIO 
      FROM PRODUCTOS 
      WHERE NOMPROD LIKE '%ALFOMBRA%' 
        AND (NOMPROD LIKE '%2%' OR NOMPROD LIKE '%3%')
        AND IDUSUARIO = 'lavadisimo' 
        AND NULO = 0
      ORDER BY NOMPROD
    `);
    
    console.log('\nTodas las alfombras con 2 o 3:');
    todasAlfombras.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });
    
    await datasource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAlfombra2x3();
