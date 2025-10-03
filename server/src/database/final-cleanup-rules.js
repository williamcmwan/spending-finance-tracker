import { db, getRows, runQuery } from './init.js';

// Final cleanup for remaining logical overlaps
async function finalCleanup() {
  console.log('🔄 Starting final category rules cleanup...');
  
  try {
    // Additional logical consolidations
    const cleanupActions = [
      {
        description: 'Consolidate VHI insurance rules - remove redundant broader rule',
        action: 'delete',
        rule: { keywords: 'vhi insurance,zurich', category: 'Insurance' },
        reason: 'Redundant with more specific "vhi sepa dd,vhi insurance,zurich" rule'
      },
      {
        description: 'Consolidate golf rules - combine specific patterns',
        action: 'update',
        findRule: { keywords: 'ob pga europ', category: 'Golf' },
        updateTo: { keywords: 'ob pga europ,pga europe', priority: 5 },
        reason: 'Make more specific for PGA European events'
      }
    ];

    let deletedCount = 0;
    let updatedCount = 0;

    for (const cleanup of cleanupActions) {
      console.log(`\n🔧 ${cleanup.description}`);
      
      if (cleanup.action === 'delete') {
        const ruleToDelete = await getRows(`
          SELECT cr.id FROM category_rules cr 
          JOIN categories c ON cr.category_id = c.id 
          WHERE cr.keywords = ? AND c.name = ?
        `, [cleanup.rule.keywords, cleanup.rule.category]);
        
        if (ruleToDelete.length > 0) {
          await runQuery('DELETE FROM category_rules WHERE id = ?', [ruleToDelete[0].id]);
          deletedCount++;
          console.log(`  ❌ Deleted: ${cleanup.rule.keywords} → ${cleanup.rule.category}`);
          console.log(`  📝 Reason: ${cleanup.reason}`);
        }
      }
      
      if (cleanup.action === 'update') {
        const ruleToUpdate = await getRows(`
          SELECT cr.id FROM category_rules cr 
          JOIN categories c ON cr.category_id = c.id 
          WHERE cr.keywords = ? AND c.name = ?
        `, [cleanup.findRule.keywords, cleanup.findRule.category]);
        
        if (ruleToUpdate.length > 0) {
          await runQuery(
            'UPDATE category_rules SET keywords = ?, priority = ? WHERE id = ?', 
            [cleanup.updateTo.keywords, cleanup.updateTo.priority, ruleToUpdate[0].id]
          );
          updatedCount++;
          console.log(`  ✏️  Updated: ${cleanup.findRule.keywords} → ${cleanup.updateTo.keywords}`);
          console.log(`  📝 Reason: ${cleanup.reason}`);
        }
      }
    }

    // Get final statistics
    const finalRules = await getRows('SELECT COUNT(*) as count FROM category_rules');
    console.log(`\n✅ Final cleanup completed!`);
    console.log(`📊 Final rule count: ${finalRules[0].count}`);
    console.log(`🗑️  Additional rules removed: ${deletedCount}`);
    console.log(`📝 Rules updated: ${updatedCount}`);

    // Show final summary by category
    console.log(`\n📋 Rules by category:`);
    const rulesByCategory = await getRows(`
      SELECT c.name as category_name, COUNT(*) as rule_count
      FROM category_rules cr 
      JOIN categories c ON cr.category_id = c.id 
      GROUP BY c.name 
      ORDER BY rule_count DESC, c.name
    `);
    
    rulesByCategory.forEach(cat => {
      console.log(`  ${cat.category_name.padEnd(20)} : ${cat.rule_count} rule${cat.rule_count > 1 ? 's' : ''}`);
    });

  } catch (error) {
    console.error('❌ Final cleanup failed:', error);
    throw error;
  }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  finalCleanup()
    .then(() => {
      console.log('🎉 Final cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Final cleanup failed:', error);
      process.exit(1);
    });
}

export { finalCleanup };