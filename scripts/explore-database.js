import { DataSource } from "typeorm";
import fs from 'fs';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env
config();

// Script para explorar la estructura de la base de datos y generar contexto para desarrollo

const datasource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
  extra: { driver: "tedious", requestTimeout: 10000 }
});

async function exploreDatabase() {
  console.log('🔍 Explorando estructura de la base de datos...\n');
  
  // Verificar que las variables de entorno estén configuradas
  console.log('📋 Verificando configuración...');
  console.log(`DB_HOST: ${process.env.DB_HOST || 'NO CONFIGURADO'}`);
  console.log(`DB_USER: ${process.env.DB_USER || 'NO CONFIGURADO'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME || 'NO CONFIGURADO'}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO'}\n`);
  
  // Verificar si las credenciales son valores de ejemplo
  if (!process.env.DB_HOST || 
      process.env.DB_HOST === 'tu_servidor_sql_server' ||
      !process.env.DB_USER || 
      process.env.DB_USER === 'tu_usuario_db' ||
      !process.env.DB_PASSWORD || 
      process.env.DB_PASSWORD === 'tu_password_db') {
    
    console.log('❌ ERROR: Las credenciales de base de datos no están configuradas correctamente.\n');
    console.log('📝 INSTRUCCIONES:');
    console.log('1. Abre el archivo .env en tu editor');
    console.log('2. Reemplaza los valores de ejemplo con tus credenciales reales:');
    console.log('   DB_HOST=tu-servidor-real.database.windows.net');
    console.log('   DB_USER=tu_usuario_real');
    console.log('   DB_PASSWORD=tu_password_real');
    console.log('   DB_NAME=tu_base_datos_real');
    console.log('3. Guarda el archivo y ejecuta nuevamente: npm run explore-db\n');
    console.log('💡 TIP: Revisa SETUP-GUIDE.md para más detalles sobre formatos de credenciales.');
    return;
  }
  
  try {
    await datasource.initialize();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Listar todas las tablas
    console.log('📋 TABLAS DISPONIBLES:');
    console.log('=' .repeat(50));
    
    const tables = await datasource.query(`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    let dbContext = '# Contexto de Base de Datos - Lavadísimo\n\n';
    dbContext += '## Tablas Disponibles\n\n';
    
    for (const table of tables) {
      console.log(`📊 ${table.TABLE_NAME}`);
      dbContext += `### ${table.TABLE_NAME}\n`;
      
      // Obtener estructura de cada tabla
      const columns = await datasource.query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = @0
        ORDER BY ORDINAL_POSITION
      `, [table.TABLE_NAME]);
      
      console.log('   Columnas:');
      dbContext += '\n**Columnas:**\n';
      
      for (const col of columns) {
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}`);
        dbContext += `- **${col.COLUMN_NAME}**: ${col.DATA_TYPE}${length} ${nullable}\n`;
      }
      
      // Obtener algunos datos de ejemplo
      try {
        const sampleData = await datasource.query(`SELECT TOP 3 * FROM ${table.TABLE_NAME}`);
        if (sampleData.length > 0) {
          console.log('   Datos de ejemplo:');
          dbContext += '\n**Datos de ejemplo:**\n```json\n';
          sampleData.forEach((row, index) => {
            console.log(`   ${index + 1}.`, JSON.stringify(row, null, 2).substring(0, 100) + '...');
          });
          dbContext += JSON.stringify(sampleData, null, 2) + '\n```\n';
        }
      } catch (error) {
        console.log('   (No se pudieron obtener datos de ejemplo)');
      }
      
      console.log('');
      dbContext += '\n---\n\n';
    }

    // 2. Buscar relaciones/foreign keys
    console.log('🔗 RELACIONES ENTRE TABLAS:');
    console.log('=' .repeat(50));
    
    const foreignKeys = await datasource.query(`
      SELECT 
        fk.name AS FK_NAME,
        tp.name AS PARENT_TABLE,
        cp.name AS PARENT_COLUMN,
        tr.name AS REFERENCED_TABLE,
        cr.name AS REFERENCED_COLUMN
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
      INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
      INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
      INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
    `);

    dbContext += '## Relaciones entre Tablas\n\n';
    
    if (foreignKeys.length > 0) {
      for (const fk of foreignKeys) {
        console.log(`🔗 ${fk.PARENT_TABLE}.${fk.PARENT_COLUMN} -> ${fk.REFERENCED_TABLE}.${fk.REFERENCED_COLUMN}`);
        dbContext += `- **${fk.PARENT_TABLE}.${fk.PARENT_COLUMN}** → **${fk.REFERENCED_TABLE}.${fk.REFERENCED_COLUMN}**\n`;
      }
    } else {
      console.log('No se encontraron foreign keys definidas');
      dbContext += 'No se encontraron relaciones definidas explícitamente.\n';
    }

    // 3. Generar queries útiles para el agente
    console.log('\n💡 QUERIES SUGERIDAS PARA EL AGENTE:');
    console.log('=' .repeat(50));
    
    dbContext += '\n## Queries Útiles para el Agente\n\n';
    
    // Buscar tablas que podrían contener productos
    const productTables = tables.filter(t => 
      t.TABLE_NAME.toLowerCase().includes('product') ||
      t.TABLE_NAME.toLowerCase().includes('servicio') ||
      t.TABLE_NAME.toLowerCase().includes('item')
    );
    
    if (productTables.length > 0) {
      console.log('📦 Tablas de productos encontradas:');
      dbContext += '### Consultas de Productos\n\n';
      
      for (const table of productTables) {
        console.log(`   - ${table.TABLE_NAME}`);
        dbContext += `**Tabla: ${table.TABLE_NAME}**\n`;
        dbContext += '```sql\n';
        dbContext += `SELECT * FROM ${table.TABLE_NAME} WHERE [columna_nombre] LIKE '%producto%'\n`;
        dbContext += '```\n\n';
      }
    }

    // Buscar tablas que podrían contener órdenes
    const orderTables = tables.filter(t => 
      t.TABLE_NAME.toLowerCase().includes('order') ||
      t.TABLE_NAME.toLowerCase().includes('orden') ||
      t.TABLE_NAME.toLowerCase().includes('pedido')
    );
    
    if (orderTables.length > 0) {
      console.log('📋 Tablas de órdenes encontradas:');
      dbContext += '### Consultas de Órdenes\n\n';
      
      for (const table of orderTables) {
        console.log(`   - ${table.TABLE_NAME}`);
        dbContext += `**Tabla: ${table.TABLE_NAME}**\n`;
        dbContext += '```sql\n';
        dbContext += `SELECT * FROM ${table.TABLE_NAME} WHERE [numero_orden] = 'ORDEN123'\n`;
        dbContext += '```\n\n';
      }
    }

    // Guardar contexto en archivo
    fs.writeFileSync('database/database-context.md', dbContext);
    console.log('\n✅ Contexto de base de datos guardado en database/database-context.md');
    
    console.log('\n🎯 RECOMENDACIONES:');
    console.log('1. Revisa el archivo database-context.md para contexto completo');
    console.log('2. Actualiza las herramientas del agente según la estructura real');
    console.log('3. Considera agregar índices para mejorar performance');
    
  } catch (error) {
    console.error('❌ Error explorando base de datos:', error);
  } finally {
    if (datasource.isInitialized) {
      await datasource.destroy();
    }
  }
}

// Ejecutar exploración
exploreDatabase();
