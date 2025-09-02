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

// Función para normalizar medidas (igual que en precioTool)
function normalizarMedidas(texto) {
  const patronMedidas = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  return texto.replace(patronMedidas, (match, ancho, largo) => {
    // Convertir a formato de base de datos (usar comas)
    const anchoNorm = ancho.replace('.', ',');
    const largoNorm = largo.replace('.', ',');
    return `${anchoNorm} M. X ${largoNorm} M.`;
  });
}

// Función para probar búsquedas específicas con medidas
async function testMeasuresSearch() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa\n');

    // Casos de prueba específicos con medidas
    const casosPrueba = [
      "alfombra 1,6 x 2,3",
      "alfombra 1.6x2.3",
      "alfombra 0.5x1",
      "alfombra 2x3"
    ];

    for (const caso of casosPrueba) {
      console.log(`🔍 Probando búsqueda específica: "${caso}"`);
      
      // Normalizar medidas como lo hace precioTool
      const terminoNormalizado = normalizarMedidas(caso);
      console.log(`📝 Término normalizado: "${terminoNormalizado}"`);
      
      // Simular la lógica de búsqueda del precioTool
      const terminos = [terminoNormalizado];
      
      // Detectar si tiene medidas específicas
      const tieneMedidasEspecificas = terminos.some(termino => 
        termino.includes('M. X') || /\d+[.,]?\d*\s*[xX×]\s*\d+[.,]?\d*/.test(termino)
      );
      
      let condicionesBusqueda;
      
      if (tieneMedidasEspecificas) {
        // Búsqueda específica con AND
        condicionesBusqueda = terminos.map((_, index) => 
          `pt.NOMPROD LIKE '%' + @${index} + '%'`
        ).join(' AND ');
      } else {
        // Búsqueda general con OR
        condicionesBusqueda = terminos.map((_, index) => 
          `pt.NOMPROD LIKE '%' + @${index} + '%'`
        ).join(' OR ');
      }
      
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
      `, terminos);
      
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

testMeasuresSearch();
