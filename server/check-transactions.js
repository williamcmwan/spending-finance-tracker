import { getRows } from './src/database/init.js';

async function checkTransactions() {
  try {
    console.log('🔍 Checking transactions in database...\n');
    
    // Get total count
    const countResult = await getRows('SELECT COUNT(*) as total FROM transactions');
    const totalTransactions = countResult[0].total;
    
    console.log(`📊 Total transactions in database: ${totalTransactions}\n`);
    
    if (totalTransactions > 0) {
      // Get some sample transactions
      const transactions = await getRows(`
        SELECT 
          t.id,
          t.date,
          t.description,
          t.income_amount,
          t.spending_amount,
          c.name as category_name,
          t.source
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT 5
      `);
      
      console.log('📋 Sample transactions:');
      console.log('=' .repeat(80));
      
      transactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.date} - ${tx.description}`);
        console.log(`   Category: ${tx.category_name || 'Unknown'}`);
        console.log(`   Income: $${tx.income_amount || 0}`);
        console.log(`   Spending: $${tx.spending_amount || 0}`);
        console.log(`   Source: ${tx.source}`);
        console.log('');
      });
      
      // Check transactions by month
      const monthlyStats = await getRows(`
        SELECT 
          strftime('%Y-%m', date) as month,
          COUNT(*) as count,
          SUM(income_amount) as total_income,
          SUM(spending_amount) as total_spending
        FROM transactions
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC
        LIMIT 6
      `);
      
      console.log('📅 Monthly statistics:');
      console.log('=' .repeat(80));
      
      monthlyStats.forEach(stat => {
        const netIncome = (stat.total_income || 0) - (stat.total_spending || 0);
        console.log(`${stat.month}: ${stat.count} transactions`);
        console.log(`   Income: $${stat.total_income || 0}`);
        console.log(`   Spending: $${stat.total_spending || 0}`);
        console.log(`   Net: $${netIncome}`);
        console.log('');
      });
      
    } else {
      console.log('❌ No transactions found in database');
      console.log('💡 You may need to:');
      console.log('   1. Import some transactions via CSV');
      console.log('   2. Add transactions manually');
      console.log('   3. Check if the database is properly initialized');
    }
    
  } catch (error) {
    console.error('❌ Error checking transactions:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkTransactions()
    .then(() => {
      console.log('✅ Check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
}

export { checkTransactions };

