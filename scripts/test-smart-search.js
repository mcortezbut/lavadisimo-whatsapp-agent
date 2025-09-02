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

// Mapeo de sinónimos (igual que en precioTool)
const sinonimos = {
  "chaqueta": ["CHAQ", "JACKET"],
  "chaquetas": ["CHAQ", "JACKET"],
  "cuero": ["CUERO", "CUERINA"],
  "cuerina": ["CUERINA", "CUERO"]
};

function expandirBusqueda(termino) {
  const terminoLower = termino.toLowerCase().trim();
  const palabras = terminoLower.split(' ');
  
  let terminosExpandidos = [termino];
  
  palabras.forEach(palabra => {
    if (sinonimos[palabra]) {
      terminosExpandidos = terminosExpandidos.concat(sinonimos[palabra]);
    }
  });
  
  return [...new Set(terminosExpandidos)];
}

async function testSmartSearch() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa\n');

    // Casos de prueba
    const casosPrueba = [
      "chaqueta",
      "chaqueta de cuero", 
      "cuero",
      "blusa",
      "cortina"
    ];

    for (const caso of casosPrueba) {
      console.log(`🔍 Probando búsqueda: "${caso}"`);
      
      const terminosExpandidos = expandirBusqueda(caso);
      console.log(`📝 Términos expandidos: ${terminosExpandidos.join(', ')}`);
      
      const condicionesBusqueda = terminosExpandidos.map((_, index) => 
        `pt.NOMPROD LIKE '%' + @${index} + '%'`
      ).join(' OR ');
      
      const productos = await datasource.query(`
        SELECT TOP 5 
          pt.NOMPROD, 
          pt.PRECIO
        FROM PRODUCTOS pt
        INNER JOIN (SELECT idprod, MAX(fechaupdate) AS maxdate FROM productos WHERE idusuario = 'lavadisimo' GROUP BY idprod) mt
        ON pt.FECHAUPDATE = mt.maxdate AND pt.IDPROD = mt.IDPROD
        WHERE (${condicionesBusqueda})
          AND pt.NULO = 0
          AND pt.IDUSUARIO = 'lavadisimo'
        ORDER BY pt.PRECIO
      `, terminosExpandidos);
      
      console.log(`📊 Resultados encontrados: ${productos.length}`);
      productos.forEach((prod, index) => {
        console.log(`  ${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
      });
      console.log('');
    }
    
    await datasource.destroy();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSmartSearch();
