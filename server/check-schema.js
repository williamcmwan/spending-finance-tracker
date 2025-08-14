import { getRows } from './src/database/init.js';

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    // Get table schema
    const schema = await getRows("PRAGMA table_info(transactions)");
    
    console.log('📋 Transactions table schema:');
    console.log('=' .repeat(80));
    
    schema.forEach(column => {
      console.log(`${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n📊 Sample transactions with correct column names:');
    console.log('=' .repeat(80));
    
    const transactions = await getRows(`
      SELECT 
        t.id,
        t.date,
        t.description,
        t.incomeAmount,
        t.spendingAmount,
        c.name as category_name,
        t.source
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.date DESC
      LIMIT 5
    `);
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. ${tx.date} - ${tx.description}`);
      console.log(`   Category: ${tx.category_name || 'Unknown'}`);
      console.log(`   Income: $${tx.incomeAmount || 0}`);
      console.log(`   Spending: $${tx.spendingAmount || 0}`);
      console.log(`   Source: ${tx.source}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkSchema()
    .then(() => {
      console.log('✅ Schema check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Schema check failed:', error);
      process.exit(1);
    });
}

export { checkSchema };

