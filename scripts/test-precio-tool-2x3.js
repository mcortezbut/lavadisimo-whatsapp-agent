import dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

// Simulate the exact functions from precioTool.js
function normalizarMedidas(texto) {
  const patronMedidas = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  return texto.replace(patronMedidas, (match, ancho, largo) => {
    const anchoNorm = ancho.replace('.', ',');
    const largoNorm = largo.replace('.', ',');
    return `${anchoNorm} M. X ${largoNorm} M.`;
  });
}

function extraerMedidasDeFrase(texto) {
  const patronGeneral = /(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/g;
  const matches = [...texto.matchAll(patronGeneral)];
  
  if (matches.length > 0) {
    const match = matches[0];
    const ancho = match[1].replace('.', ',');
    const largo = match[2].replace('.', ',');
    return `${ancho} M. X ${largo} M.`;
  }
  
  const patronesContextuales = [
    /(?:la|el|de|una|un).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(?:medidas?|tamaño|dimensiones?).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i,
    /(?:cuanto|cual|precio|valor).*?(?:vale|es|de|para).*?(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)/i
  ];
  
  for (const patron of patronesContextuales) {
    const match = texto.match(patron);
    if (match) {
      const ancho = match[1].replace('.', ',');
      const largo = match[2].replace('.', ',');
      return `${ancho} M. X ${largo} M.`;
    }
  }
  
  return null;
}

const sinonimos = {
  "alfombra": ["ALFOMBRA"],
  "alfombras": ["ALFOMBRA"]
};

function expandirBusqueda(termino) {
  let terminoNormalizado = normalizarMedidas(termino);
  const terminoLower = terminoNormalizado.toLowerCase().trim();
  
  let terminosExpandidos = [termino, terminoNormalizado];
  
  const medidaExtraida = extraerMedidasDeFrase(termino);
  if (medidaExtraida) {
    terminosExpandidos.push(medidaExtraida);
  }
  
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

// Test the complete flow
async function testPrecioTool() {
  const testCases = [
    "2x3",
    "la de 2x3",
    "alfombra 2x3",
    "Y la de 2x3 cuanto vale?"
  ];

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

  try {
    console.log('🔌 Conectando a la base de datos...');
    await datasource.initialize();
    console.log('✅ Conexión exitosa');

    for (const testCase of testCases) {
      console.log(`\n=== TESTING: "${testCase}" ===`);
      
      // Step 1: Expand search terms
      const terminosExpandidos = expandirBusqueda(testCase);
      console.log('Términos expandidos:', terminosExpandidos);
      
      // Step 2: Detect if it has specific measures
      const tieneMedidasEspecificas = terminosExpandidos.some(termino => 
        termino.includes('M. X') || /\d+[.,]?\d*\s*[xX×]\s*\d+[.,]?\d*/.test(termino)
      );
      console.log('Tiene medidas específicas:', tieneMedidasEspecificas);
      
      // Step 3: Generate search conditions
      const condicionesBusqueda = terminosExpandidos.map((_, index) => 
        `pt.NOMPROD LIKE '%' + @${index} + '%'`
      ).join(' OR ');
      
      const parametrosBusqueda = terminosExpandidos;
      
      console.log('Condiciones:', condicionesBusqueda);
      console.log('Parámetros:', parametrosBusqueda);
      
      // Step 4: Execute the query
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
        WHERE (${condicionesBusqueda})
          AND pt.NULO = 0
          AND pt.IDUSUARIO = 'lavadisimo'
        ORDER BY 
          CASE WHEN pt.NOMPROD LIKE @0 + '%' THEN 1 ELSE 2 END,
          LEN(pt.NOMPROD),
          pt.PRECIO
      `, parametrosBusqueda);
      
      console.log('Resultados encontrados:', productos.length);
      if (productos.length > 0) {
        productos.forEach((prod, index) => {
          console.log(`${index + 1}. ${prod.NOMPROD} - $${parseInt(prod.PRECIO).toLocaleString('es-CL')}`);
        });
      } else {
        console.log('❌ No se encontraron resultados');
      }
    }

    await datasource.destroy();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPrecioTool();
