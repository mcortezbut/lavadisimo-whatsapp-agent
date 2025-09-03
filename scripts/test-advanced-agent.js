import { initializeAgent } from '../src/agent/manager.js';

// Test cases for the advanced search functionality
const testCases = [
  // Basic product searches
  "alfombra",
  "cortina",
  "cobertor",
  "chaqueta",
  
  // Specific measurements and formats
  "alfombra 2x3",
  "alfombra 2 x 3",
  "alfombra 2,0 x 3,0",
  "alfombra 2.0 x 3.0",
  "la de 2x3",
  "medida 2x3",
  "tamaño 2x3",
  
  // Complex queries with measurements
  "alfombra 1,6 x 2,2",
  "alfombra 1.6 x 2.2", 
  "alfombra de 1,6 por 2,2",
  "la alfombra de 1.6x2.2",
  
  // Synonyms and variations
  "tapete",
  "tapices",
  "coche bebé",
  "carrito de bebé",
  "cochecito",
  "frazada",
  "cobertores",
  
  // Bed sizes
  "cobertor 2 plazas",
  "cobertor king",
  "cobertor super king",
  
  // Curtain sizes
  "cortina mediana",
  "cortina grande",
  "cortina extra grande",
  
  // Material types
  "chaqueta de cuero",
  "chaqueta de cuerina",
  "chaqueta de gamuza"
];

async function testAdvancedAgent() {
  console.log("🧪 Probando agente avanzado con búsqueda inteligente...\n");
  
  try {
    const agent = await initializeAgent();
    
    for (const testCase of testCases) {
      console.log(`🔍 Test: "${testCase}"`);
      console.log("─".repeat(50));
      
      try {
        const result = await agent.invoke({
          input: testCase
        });
        
        console.log(`✅ Resultado:`);
        console.log(result.output);
        console.log("\n" + "─".repeat(50) + "\n");
        
        // Small delay between tests to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error en test "${testCase}":`, error.message);
        console.log("\n" + "─".repeat(50) + "\n");
      }
    }
    
    console.log("🎯 Todos los tests completados!");
    
  } catch (error) {
    console.error("❌ Error inicializando el agente:", error);
  }
}

// Run the tests
testAdvancedAgent().catch(console.error);
