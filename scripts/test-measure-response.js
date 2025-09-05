// Test script to verify the precisionSearchTool response for "Es una de 2x3"
import precisionSearchTool from '../src/agent/tools/precisionSearchTool.js';

async function testMeasureResponse() {
  console.log('🧪 Testing precisionSearchTool with "Es una de 2x3"...\n');
  
  try {
    // Simulate the input that's causing issues
    const response = await precisionSearchTool.func({
      producto: "Es una de 2x3",
      telefono: "123456789"
    });
    
    console.log('✅ Response from precisionSearchTool:');
    console.log(response);
    console.log('\n📋 Response length:', response.length);
    
    // Check if the response contains the expected list of options
    if (response.includes('No encontré una alfombra exactamente') && response.includes('opciones')) {
      console.log('🎉 SUCCESS: Response shows available options as expected!');
    } else {
      console.log('❌ ISSUE: Response does not show available options. Needs debugging.');
    }
    
  } catch (error) {
    console.error('💥 Error testing precisionSearchTool:', error.message);
  }
}

testMeasureResponse();
