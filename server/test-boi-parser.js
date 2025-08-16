import fs from 'fs';
import { parseBoiStatement, suggestCategory } from './src/utils/boiParser.js';

async function testBoiParser() {
  try {
    console.log('Testing BOI Statement Parser...\n');
    
    const pdfBuffer = fs.readFileSync('../202508.pdf');
    const transactions = await parseBoiStatement(pdfBuffer);
    
    console.log(`Found ${transactions.length} transactions:\n`);
    
    // Sample categories for testing
    const sampleCategories = [
      { name: 'Groceries' },
      { name: 'Food & Dining' },
      { name: 'Transport' },
      { name: 'Insurance' },
      { name: 'Bank Fees' },
      { name: 'Phone' },
      { name: 'Entertainment' },
      { name: 'Home & Garden' },
      { name: 'Other' }
    ];
    
    transactions.forEach((transaction, index) => {
      const suggestedCategory = suggestCategory(
        transaction.description, 
        sampleCategories, 
        []
      );
      
      console.log(`${index + 1}. Date: ${transaction.date}`);
      console.log(`   Description: ${transaction.description}`);
      console.log(`   Amount: €${transaction.amount.toFixed(2)}`);
      console.log(`   Type: ${transaction.type}`);
      console.log(`   Suggested Category: ${suggestedCategory}`);
      console.log(`   Balance: €${transaction.balance ? transaction.balance.toFixed(2) : 'N/A'}`);
      console.log(`   Source: ${transaction.source}`);
      console.log('');
    });
    
    // Summary
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    console.log('=== SUMMARY ===');
    console.log(`Total transactions: ${transactions.length}`);
    console.log(`Income transactions: ${incomeTransactions.length}`);
    console.log(`Expense transactions: ${expenseTransactions.length}`);
    console.log(`Total income: €${incomeTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
    console.log(`Total expenses: €${expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}`);
    
  } catch (error) {
    console.error('Error testing BOI parser:', error);
  }
}

testBoiParser();
