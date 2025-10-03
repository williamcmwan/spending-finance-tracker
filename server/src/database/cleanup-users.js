import { db, getRows, runQuery } from './init.js';

// Clean up test users and keep only the main user
async function cleanupUsers() {
  console.log('🔄 Starting user cleanup...');
  
  try {
    // Get all users
    const users = await getRows('SELECT id, email FROM users ORDER BY id');
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => console.log(`  - ${user.email} (ID: ${user.id})`));

    // Find the main user to keep
    const mainUser = users.find(u => u.email === 'williamcmwan@gmail.com');
    if (!mainUser) {
      throw new Error('Main user williamcmwan@gmail.com not found!');
    }

    console.log(`✅ Main user to keep: ${mainUser.email} (ID: ${mainUser.id})`);

    // Find test users to remove
    const testUsers = users.filter(u => u.email !== 'williamcmwan@gmail.com');
    console.log(`🗑️  Test users to remove: ${testUsers.length}`);
    testUsers.forEach(user => console.log(`  - ${user.email} (ID: ${user.id})`));

    if (testUsers.length === 0) {
      console.log('ℹ️  No test users to remove');
      return mainUser.id;
    }

    // Check if test users have any data
    for (const testUser of testUsers) {
      const transactions = await getRows('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?', [testUser.id]);
      const categories = await getRows('SELECT COUNT(*) as count FROM categories WHERE user_id = ?', [testUser.id]);
      const rules = await getRows('SELECT COUNT(*) as count FROM category_rules WHERE user_id = ?', [testUser.id]);
      
      console.log(`📊 User ${testUser.email} has:`);
      console.log(`  - Transactions: ${transactions[0].count}`);
      console.log(`  - Categories: ${categories[0].count}`);
      console.log(`  - Rules: ${rules[0].count}`);

      if (transactions[0].count > 0 || categories[0].count > 0 || rules[0].count > 0) {
        console.log(`⚠️  User ${testUser.email} has data - transferring to main user...`);
        
        // Transfer transactions
        if (transactions[0].count > 0) {
          await runQuery('UPDATE transactions SET user_id = ? WHERE user_id = ?', [mainUser.id, testUser.id]);
          console.log(`  ✅ Transferred ${transactions[0].count} transactions`);
        }
        
        // Transfer categories (but avoid duplicates)
        if (categories[0].count > 0) {
          const userCategories = await getRows('SELECT name FROM categories WHERE user_id = ?', [testUser.id]);
          for (const cat of userCategories) {
            const existing = await getRows('SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)', [cat.name, mainUser.id]);
            if (existing.length === 0) {
              await runQuery('UPDATE categories SET user_id = ? WHERE name = ? AND user_id = ?', [mainUser.id, cat.name, testUser.id]);
            } else {
              // Delete duplicate category
              await runQuery('DELETE FROM categories WHERE name = ? AND user_id = ?', [cat.name, testUser.id]);
            }
          }
          console.log(`  ✅ Processed ${categories[0].count} categories`);
        }
        
        // Transfer rules
        if (rules[0].count > 0) {
          await runQuery('UPDATE category_rules SET user_id = ? WHERE user_id = ?', [mainUser.id, testUser.id]);
          console.log(`  ✅ Transferred ${rules[0].count} rules`);
        }
      }
    }

    // Remove test users
    for (const testUser of testUsers) {
      await runQuery('DELETE FROM users WHERE id = ?', [testUser.id]);
      console.log(`🗑️  Removed user: ${testUser.email}`);
    }

    // Convert all global rules to be owned by main user
    console.log('\n🔄 Converting global rules to be owned by main user...');
    const globalRules = await getRows('SELECT COUNT(*) as count FROM category_rules WHERE user_id IS NULL');
    if (globalRules[0].count > 0) {
      await runQuery('UPDATE category_rules SET user_id = ? WHERE user_id IS NULL', [mainUser.id]);
      console.log(`✅ Converted ${globalRules[0].count} global rules to user-owned`);
    }

    // Final verification
    const finalUsers = await getRows('SELECT id, email FROM users');
    const finalRules = await getRows(`
      SELECT 
        CASE WHEN cr.user_id IS NULL THEN 'Global' ELSE u.email END as owner,
        COUNT(*) as rule_count
      FROM category_rules cr 
      LEFT JOIN users u ON cr.user_id = u.id
      GROUP BY cr.user_id, u.email
      ORDER BY cr.user_id
    `);

    console.log(`\n✅ Cleanup completed!`);
    console.log(`👥 Remaining users: ${finalUsers.length}`);
    finalUsers.forEach(user => console.log(`  - ${user.email} (ID: ${user.id})`));
    
    console.log(`📋 Rules ownership:`);
    finalRules.forEach(owner => {
      console.log(`  - ${owner.owner}: ${owner.rule_count} rules`);
    });

    return mainUser.id;

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupUsers()
    .then((mainUserId) => {
      console.log(`🎉 Cleanup completed successfully! Main user ID: ${mainUserId}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupUsers };