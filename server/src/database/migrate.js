import { db, getRows, runQuery } from './init.js';

// Function to capitalize first letter of a string
function capitalizeFirstLetter(string) {
  if (!string || typeof string !== 'string') return string;
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Migration to capitalize category names
async function migrateCategoryNames() {
  try {
    console.log('Starting category name capitalization migration...');

    // Get all categories
    const categories = await getRows('SELECT id, name FROM categories');
    console.log(`Found ${categories.length} categories to process`);

    let updatedCount = 0;
    for (const category of categories) {
      const originalName = category.name;
      const capitalizedName = capitalizeFirstLetter(originalName);
      
      // Only update if the name actually needs to be changed
      if (originalName !== capitalizedName) {
        await runQuery('UPDATE categories SET name = ? WHERE id = ?', [capitalizedName, category.id]);
        console.log(`Updated category "${originalName}" to "${capitalizedName}"`);
        updatedCount++;
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} categories.`);
    return updatedCount;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Migration to add source field to transactions table
async function migrateAddSourceField() {
  try {
    console.log('Starting source field migration...');

    // Check if source column already exists
    const tableInfo = await getRows("PRAGMA table_info(transactions)");
    const sourceColumnExists = tableInfo.some(col => col.name === 'source');
    
    if (sourceColumnExists) {
      console.log('Source column already exists, skipping migration.');
      return 0;
    }

    // Add source column
    await runQuery('ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT "Manual Entry"');
    console.log('Added source column to transactions table');

    // Update existing transactions to have a default source
    const result = await runQuery('UPDATE transactions SET source = "Manual Entry" WHERE source IS NULL');
    console.log(`Updated ${result.changes} existing transactions with default source`);

    console.log('Source field migration completed successfully.');
    return result.changes;
  } catch (error) {
    console.error('Source field migration failed:', error);
    throw error;
  }
}

// Migration to add capex transaction type
async function migrateAddCapexType() {
  try {
    console.log('Starting capex transaction type migration...');

    // SQLite doesn't support modifying CHECK constraints, so we need to recreate the table
    // First, check if we need to migrate by looking for any capex transactions
    const capexCount = await getRows("SELECT COUNT(*) as count FROM transactions WHERE type = 'capex'");
    
    if (capexCount[0].count > 0) {
      console.log('Capex transactions already exist, skipping migration.');
      return 0;
    }

    // Create a new transactions table with the updated CHECK constraint
    await runQuery(`
      CREATE TABLE IF NOT EXISTS transactions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type TEXT CHECK(type IN ('income', 'expense', 'capex')) NOT NULL,
        category_id INTEGER,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        source TEXT DEFAULT 'Manual Entry',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Copy all existing data to the new table
    await runQuery(`
      INSERT INTO transactions_new 
      SELECT * FROM transactions
    `);

    // Drop the old table and rename the new one
    await runQuery('DROP TABLE transactions');
    await runQuery('ALTER TABLE transactions_new RENAME TO transactions');

    // Recreate indexes
    await runQuery('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
    await runQuery('CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id)');

    console.log('Successfully updated transactions table to support capex type');

    // Update specific categories to capex type
    const categoriesToUpdate = ['Rental Property', 'Garden', 'Solar'];
    let totalUpdated = 0;

    for (const categoryName of categoriesToUpdate) {
      const result = await runQuery(`
        UPDATE transactions 
        SET type = 'capex' 
        WHERE category_id IN (
          SELECT id FROM categories WHERE name = ?
        )
      `, [categoryName]);
      
      console.log(`Updated ${result.changes} transactions for category "${categoryName}" to capex type`);
      totalUpdated += result.changes;
    }

    console.log(`Capex migration completed. Updated ${totalUpdated} total transactions.`);
    return totalUpdated;
  } catch (error) {
    console.error('Capex migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const migrationType = process.argv[2];
  
  if (migrationType === 'source') {
    migrateAddSourceField()
      .then(() => {
        console.log('Source field migration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Source field migration failed:', error);
        process.exit(1);
      });
  } else if (migrationType === 'capex') {
    migrateAddCapexType()
      .then(() => {
        console.log('Capex migration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Capex migration failed:', error);
        process.exit(1);
      });
  } else {
    migrateCategoryNames()
      .then(() => {
        console.log('Category name migration completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Category name migration failed:', error);
        process.exit(1);
      });
  }
}

export { migrateCategoryNames, migrateAddSourceField, migrateAddCapexType };
