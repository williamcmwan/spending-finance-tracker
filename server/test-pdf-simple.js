const fs = require('fs');
const pdf = require('pdf-parse');

async function testPDFParsing() {
  try {
    const dataBuffer = fs.readFileSync('../202508.pdf');
    const data = await pdf(dataBuffer);
    
    console.log('PDF Text Content:');
    console.log('==================');
    console.log(data.text);
    console.log('==================');
    console.log(`Number of pages: ${data.numpages}`);
    console.log(`Number of characters: ${data.text.length}`);
    
    // Split into lines for analysis
    const lines = data.text.split('\n').filter(line => line.trim());
    console.log('\nLines (first 100):');
    lines.slice(0, 100).forEach((line, index) => {
      console.log(`${index + 1}: ${line.trim()}`);
    });
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
  }
}

testPDFParsing();
