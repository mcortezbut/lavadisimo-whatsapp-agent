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

// Sistema robusto de búsqueda (igual que en precioTool)
const sinonimos = {
  "alfombra": ["ALFOMBRA"],
  "alfombras": ["ALFOMBRA"],
  "cobertor": ["COBERTOR"],
  "cobertores": ["COBERTOR"],
  "frazada": ["COBERTOR", "FRAZADA"],
  "dos plazas": ["2 PL"],
  "2 plazas": ["2 PL"],
  "king": ["KING"],
  "chaqueta": ["CHAQ"],
  "cuero": ["CUERO", "CUERINA"]
};

function normalizarMedidas(texto) {
  const patronMedidas = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  return texto.replace(patronMedidas, (match, ancho, largo) => {
    const anchoNorm = ancho.replace(',', '.');
    const largoNorm = largo.replace(',', '.');
    return `${anchoNorm} M. X ${largoNorm} M.`;
  });
}

function expandirBusqueda(termino) {
  let terminoNormalizado = normalizarMedidas(termino);
  const terminoLower = terminoNormalizado.toLowerCase().trim();
  
  let terminosExpandidos = [termino, terminoNormalizado];
  
  const palabras = terminoLower.split(/\s+/);
  palabras.forEach(palabra => {
    if (sinonimos[palabra]) {
      terminosExpandidos = terminosExpandidos.concat(sinonimos[palabra]);
    }
  });
  
  if (sinonimos[terminoLower]) {
    terminosExpandidos = terminosExpandidos.concat(sinonimos[terminoLower]);
  }
  
  return [...new Set(terminosExpandidos)].filter(t => t && t.trim());
}

async function testRobustSearch() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa\n');

    // Casos de prueba robustos
    const casosPrueba = [
      "alfombra 2x3",
      "alfombra de 1.5 x 2",
      "cobertor dos plazas",
      "cobertor 2 plazas",
      "cobertor king",
      "chaqueta de cuero",
      "alfombra 0.5x1"
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

testRobustSearch();
