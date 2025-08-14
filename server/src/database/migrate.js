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

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCategoryNames()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateCategoryNames };
