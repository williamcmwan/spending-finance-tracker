import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

async function testPDFParsing() {
  try {
    const dataBuffer = fs.readFileSync('../202508.pdf');
    
    // Load the PDF
    const loadingTask = pdfjsLib.getDocument({
      data: dataBuffer,
      verbosity: 0
    });
    
    const pdfDocument = await loadingTask.promise;
    console.log(`PDF loaded. Number of pages: ${pdfDocument.numPages}`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      console.log(`\nPage ${pageNum}:`);
      console.log('==================');
      
      let pageText = '';
      textContent.items.forEach((item) => {
        pageText += item.str + ' ';
      });
      
      console.log(pageText);
      fullText += pageText + '\n';
    }
    
    // Split into lines for analysis
    const lines = fullText.split('\n').filter(line => line.trim());
    console.log('\n\nAll Lines:');
    console.log('==================');
    lines.forEach((line, index) => {
      if (line.trim()) {
        console.log(`${index + 1}: ${line.trim()}`);
      }
    });
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
  }
}

testPDFParsing();
