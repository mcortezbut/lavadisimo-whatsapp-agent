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

async function debug2x3() {
  try {
    console.log('🔍 Probando búsqueda exacta de alfombra 2x3...');
    await datasource.initialize();

    // Probar la búsqueda exacta que debería funcionar
    const resultado = await datasource.query(`
      SELECT NOMPROD, PRECIO 
      FROM PRODUCTOS 
      WHERE NOMPROD LIKE '%2 M. X 3 M.%' 
        AND IDUSUARIO = 'lavadisimo' 
        AND NULO = 0
    `);
    
    console.log('Resultados encontrados:', resultado.length);
    resultado.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

    // Probar también con formato alternativo
    console.log('\n🔍 Probando búsqueda con formato alternativo...');
    const resultadoAlt = await datasource.query(`
      SELECT NOMPROD, PRECIO 
      FROM PRODUCTOS 
      WHERE NOMPROD LIKE '%2%' AND NOMPROD LIKE '%3%' AND NOMPROD LIKE '%ALFOMBRA%'
        AND IDUSUARIO = 'lavadisimo' 
        AND NULO = 0
    `);
    
    console.log('Resultados alternativos encontrados:', resultadoAlt.length);
    resultadoAlt.slice(0, 10).forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

    await datasource.destroy();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debug2x3();
