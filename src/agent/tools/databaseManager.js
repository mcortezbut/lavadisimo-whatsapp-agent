import { DataSource } from "typeorm";

// Database connection manager with robust error handling and connection pooling
class DatabaseManager {
  constructor() {
    this.datasource = null;
    this.isInitializing = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  // Initialize connection with retry logic
  async initialize() {
    if (this.datasource && this.datasource.isInitialized) {
      return this.datasource;
    }

    if (this.isInitializing) {
      // Wait for ongoing initialization
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

      // Solo agregar puerto si está definido en las variables de entorno
      if (process.env.DB_PORT) {
        connectionConfig.port = parseInt(process.env.DB_PORT);
      }

      this.datasource = new DataSource(connectionConfig);

      await this.datasource.initialize();
      console.log("✅ Conexión a base de datos establecida exitosamente");
      this.connectionAttempts = 0;
      this.isInitializing = false;
      return this.datasource;

    } catch (error) {
      this.isInitializing = false;
      this.connectionAttempts++;

      if (this.connectionAttempts <= this.maxRetries) {
        console.warn(`⚠️ Intento ${this.connectionAttempts}/${this.maxRetries} fallido. Reintentando en ${this.retryDelay/1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.initialize();
      } else {
        console.error("❌ Error crítico: No se pudo conectar a la base de datos después de múltiples intentos", error);
        throw new Error("No se pudo conectar a la base de datos. Por favor, verifica la conexión y configuración.");
      }
    }
  }

  // Safe query execution with error handling
  async executeQuery(query, parameters = []) {
    try {
      if (!this.datasource || !this.datasource.isInitialized) {
        await this.initialize();
      }

      const result = await this.datasource.query(query, parameters);
      return result;

    } catch (error) {
      console.error("Error ejecutando query:", error);
      
      // Check if connection is dead and try to reconnect
      if (error.message.includes('socket') || error.message.includes('connection')) {
        console.warn("⚡ Conexión perdida, intentando reconectar...");
        try {
          if (this.datasource) {
            await this.datasource.destroy();
          }
          this.datasource = null;
          await this.initialize();
          // Retry the query after reconnection
          return await this.datasource.query(query, parameters);
        } catch (retryError) {
          console.error("❌ Error en reconexión:", retryError);
          throw new Error("Error de conexión a la base de datos. Por favor, intenta nuevamente.");
        }
      }
      
      throw error;
    }
  }

  // Close connection gracefully
  async close() {
    if (this.datasource && this.datasource.isInitialized) {
      await this.datasource.destroy();
      console.log("🔌 Conexión a base de datos cerrada");
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.datasource || !this.datasource.isInitialized) {
        await this.initialize();
      }
      await this.datasource.query("SELECT 1 as health_check");
      return true;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
const databaseManager = new DatabaseManager();

export default databaseManager;
