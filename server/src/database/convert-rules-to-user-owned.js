import { db, getRows, runQuery } from './init.js';

// Convert all global category rules to be user-owned
async function convertRulesToUserOwned(userEmail = null) {
  console.log('🔄 Starting conversion of global rules to user-owned...');
  
  try {
    // Get all users
    const users = await getRows('SELECT id, email FROM users ORDER BY id');
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => console.log(`  - ${user.email} (ID: ${user.id})`));

    // Determine target user
    let targetUserId;
    if (userEmail) {
      const targetUser = users.find(u => u.email === userEmail);
      if (!targetUser) {
        throw new Error(`User with email ${userEmail} not found`);
      }
      targetUserId = targetUser.id;
      console.log(`🎯 Target user: ${targetUser.email} (ID: ${targetUserId})`);
    } else {
      // Use the most recent user (highest ID) as default
      targetUserId = Math.max(...users.map(u => u.id));
      const targetUser = users.find(u => u.id === targetUserId);
      console.log(`🎯 Using most recent user: ${targetUser.email} (ID: ${targetUserId})`);
    }

    // Get all global rules (user_id IS NULL)
    const globalRules = await getRows(`
      SELECT cr.id, cr.keywords, c.name as category_name, cr.priority
      FROM category_rules cr 
      JOIN categories c ON cr.category_id = c.id 
      WHERE cr.user_id IS NULL
      ORDER BY cr.priority DESC, cr.id
    `);

    console.log(`📋 Found ${globalRules.length} global rules to convert`);

    if (globalRules.length === 0) {
      console.log('ℹ️  No global rules found to convert');
      return;
    }

    // Show first few rules as preview
    console.log('\n📝 Preview of rules to convert:');
    globalRules.slice(0, 5).forEach(rule => {
      console.log(`  - ${rule.keywords} → ${rule.category_name} (priority: ${rule.priority})`);
    });
    if (globalRules.length > 5) {
      console.log(`  ... and ${globalRules.length - 5} more rules`);
    }

    // Convert all global rules to user-owned
    console.log(`\n🔄 Converting ${globalRules.length} rules to be owned by user ${targetUserId}...`);
    
    const result = await runQuery(
      'UPDATE category_rules SET user_id = ? WHERE user_id IS NULL',
      [targetUserId]
    );

    console.log(`✅ Successfully converted ${result.changes} rules`);

    // Verify the conversion
    const remainingGlobalRules = await getRows('SELECT COUNT(*) as count FROM category_rules WHERE user_id IS NULL');
    const userRules = await getRows('SELECT COUNT(*) as count FROM category_rules WHERE user_id = ?', [targetUserId]);

    console.log(`\n📊 Final status:`);
    console.log(`  - Global rules remaining: ${remainingGlobalRules[0].count}`);
    console.log(`  - User-owned rules: ${userRules[0].count}`);

    // Show rules by user
    const rulesByUser = await getRows(`
      SELECT 
        CASE WHEN cr.user_id IS NULL THEN 'Global' ELSE u.email END as owner,
        COUNT(*) as rule_count
      FROM category_rules cr 
      LEFT JOIN users u ON cr.user_id = u.id
      GROUP BY cr.user_id, u.email
      ORDER BY cr.user_id
    `);

    console.log(`\n👥 Rules by owner:`);
    rulesByUser.forEach(owner => {
      console.log(`  - ${owner.owner}: ${owner.rule_count} rules`);
    });

  } catch (error) {
    console.error('❌ Conversion failed:', error);
    throw error;
  }
}

// Run conversion if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const userEmail = process.argv[2]; // Optional: specify user email as argument
  
  convertRulesToUserOwned(userEmail)
    .then(() => {
      console.log('🎉 Conversion completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Conversion failed:', error);
      process.exit(1);
    });
}

export { convertRulesToUserOwned };