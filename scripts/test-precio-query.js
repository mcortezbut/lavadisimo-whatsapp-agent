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

async function testPrecioQuery() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa');

    console.log('\n🔍 Probando consulta de precios con JOIN correcto...');
    
    const productos = await datasource.query(`
      SELECT TOP 5 
        pt.IDPROD,
        pt.NOMPROD, 
        pt.PRECIO,
        c.NOMCAT as CATEGORIA
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      LEFT JOIN CATEGORIAS c ON pt.IDGRUPO = c.IDGRUPO
      WHERE pt.NOMPROD LIKE '%poltrona%' 
        AND pt.NULO = 0
        AND pt.IDUSUARIO = 'lavadisimo'
      ORDER BY pt.PRECIO
    `);

    console.log(`📊 Encontrados ${productos.length} productos:`);
    productos.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')} (${prod.CATEGORIA || 'Sin categoría'})`);
    });

    console.log('\n🧪 Probando consulta sin filtros específicos...');
    const todosProductos = await datasource.query(`
      SELECT TOP 3
        pt.IDPROD,
        pt.NOMPROD, 
        pt.PRECIO
      FROM PRODUCTOS pt
      INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
      ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
      WHERE pt.NULO = 0
        AND pt.IDUSUARIO = 'lavadisimo'
      ORDER BY pt.PRECIO
    `);

    console.log(`📋 Productos disponibles (muestra): ${todosProductos.length}`);
    todosProductos.forEach((prod, index) => {
      console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Código de error:', error.code);
    
    if (error.code === 'ESOCKET') {
      console.log('\n💡 Sugerencias para error de conexión:');
      console.log('- Verificar que la IP del servidor esté en la whitelist');
      console.log('- Verificar que el puerto 1433 esté abierto');
      console.log('- Verificar las credenciales de conexión');
      console.log('- Verificar que el servidor SQL Server esté ejecutándose');
    }
  } finally {
    if (datasource.isInitialized) {
      await datasource.destroy();
      console.log('🔌 Conexión cerrada');
    }
  }
}

testPrecioQuery();
