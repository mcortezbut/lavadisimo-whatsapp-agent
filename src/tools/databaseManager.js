import { DataSource } from "typeorm";

class DatabaseManager {
  constructor() {
    this.datasource = null;
    this.isInitializing = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  async initialize() {
    if (this.datasource && this.datasource.isInitialized) {
      return this.datasource;
    }

    if (this.isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.initialize();
    }

    this.isInitializing = true;

    try {
      const connectionConfig = {
        type: "mssql",
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        options: { 
          encrypt: false, 
          trustServerCertificate: true,
          enableArithAbort: true,
          connectTimeout: 15000,
          requestTimeout: 30000
        },
        extra: { 
          driver: "tedious", 
          connectionTimeout: 15000,
          requestTimeout: 30000,
          pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000,
            acquireTimeoutMillis: 30000
          }
        }
      };

      if (process.env.DB_PORT) {
        connectionConfig.port = parseInt(process.env.DB_PORT);
      }

      this.datasource = new DataSource(connectionConfig);
      await this.datasource.initialize();
      console.log("✅ Conexión a base de datos establecida");
      this.connectionAttempts = 0;
      this.isInitializing = false;
      return this.datasource;

    } catch (error) {
      this.isInitializing = false;
      this.connectionAttempts++;

      if (this.connectionAttempts <= this.maxRetries) {
        console.warn(`⚠️ Intento ${this.connectionAttempts}/${this.maxRetries} fallido. Reintentando...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.initialize();
      } else {
        console.error("❌ Error conectando a la base de datos", error);
        throw new Error("No se pudo conectar a la base de datos");
      }
    }
  }

  async executeQuery(query, parameters = []) {
    try {
      if (!this.datasource || !this.datasource.isInitialized) {
        await this.initialize();
      }

      const result = parameters.length === 0 
        ? await this.datasource.query(query)
        : await this.datasource.query(query, parameters);
      return result;

    } catch (error) {
      console.error("Error ejecutando query:", error);
      throw error;
    }
  }

  async close() {
    if (this.datasource && this.datasource.isInitialized) {
      await this.datasource.destroy();
      console.log("🔌 Conexión cerrada");
    }
  }
}

const databaseManager = new DatabaseManager();
export default databaseManager;
