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

export { migrateCategoryNames, migrateAddSourceField };
