import { db, getRows, runQuery } from './init.js';

// Consolidate duplicate and overlapping category rules
async function consolidateRules() {
  console.log('🔄 Starting category rules consolidation...');
  
  try {
    // Get all current rules
    const allRules = await getRows(`
      SELECT cr.id, cr.keywords, c.name as category_name, cr.priority, cr.category_id
      FROM category_rules cr 
      JOIN categories c ON cr.category_id = c.id 
      ORDER BY cr.keywords, cr.priority DESC
    `);

    console.log(`📊 Found ${allRules.length} total rules to analyze`);

    // Rules to delete (IDs)
    const rulesToDelete = [];
    
    // Rules to update
    const rulesToUpdate = [];

    // Specific consolidation cases
    const consolidationCases = [
      {
        description: 'Duplicate henrietta rules',
        keepRule: { keywords: 'henrietta,salary,wages', category: 'Salary', priority: 10 },
        deleteRules: [{ keywords: 'henrietta,salary,wages', category: 'Income' }]
      },
      {
        description: 'Overlapping VHI rules - consolidate into more specific rule',
        keepRule: { keywords: 'vhi sepa dd,vhi insurance,zurich', category: 'Insurance', priority: 14 },
        deleteRules: [{ keywords: 'vhi sepa dd', category: 'Insurance' }]
      },
      {
        description: 'Golf rules - keep specific ones and remove general overlap',
        keepRule: { keywords: 'pga,golf', category: 'Golf', priority: 4 },
        updateRule: { keywords: 'ob pga europ', category: 'Golf', priority: 4 },
        deleteRules: [{ keywords: 'pga,golf,ob pga europ', category: 'Entertainment' }]
      }
    ];

    // Process each consolidation case
    for (const consolidationCase of consolidationCases) {
      console.log(`\n🔧 Processing: ${consolidationCase.description}`);
      
      // Find rules to delete
      for (const deleteRule of consolidationCase.deleteRules || []) {
        const ruleToDelete = allRules.find(r => 
          r.keywords === deleteRule.keywords && 
          r.category_name === deleteRule.category
        );
        if (ruleToDelete) {
          rulesToDelete.push(ruleToDelete.id);
          console.log(`  ❌ Will delete: ${deleteRule.keywords} → ${deleteRule.category}`);
        }
      }

      // Find rule to keep and potentially update its priority
      if (consolidationCase.keepRule) {
        const ruleToKeep = allRules.find(r => 
          r.keywords === consolidationCase.keepRule.keywords && 
          r.category_name === consolidationCase.keepRule.category
        );
        if (ruleToKeep && ruleToKeep.priority !== consolidationCase.keepRule.priority) {
          rulesToUpdate.push({
            id: ruleToKeep.id,
            priority: consolidationCase.keepRule.priority
          });
          console.log(`  ✏️  Will update priority: ${consolidationCase.keepRule.keywords} → ${consolidationCase.keepRule.category} (priority ${consolidationCase.keepRule.priority})`);
        }
        if (ruleToKeep) {
          console.log(`  ✅ Will keep: ${consolidationCase.keepRule.keywords} → ${consolidationCase.keepRule.category}`);
        }
      }
    }

    // Additional cleanup: Remove any exact duplicates (same keywords, same category)
    const seenRules = new Set();
    for (const rule of allRules) {
      const ruleKey = `${rule.keywords}:${rule.category_name}`;
      if (seenRules.has(ruleKey)) {
        if (!rulesToDelete.includes(rule.id)) {
          rulesToDelete.push(rule.id);
          console.log(`  ❌ Found exact duplicate: ${rule.keywords} → ${rule.category_name}`);
        }
      } else {
        seenRules.add(ruleKey);
      }
    }

    // Execute deletions
    console.log(`\n🗑️  Deleting ${rulesToDelete.length} duplicate/overlapping rules...`);
    for (const ruleId of rulesToDelete) {
      await runQuery('DELETE FROM category_rules WHERE id = ?', [ruleId]);
    }

    // Execute updates
    console.log(`📝 Updating ${rulesToUpdate.length} rule priorities...`);
    for (const update of rulesToUpdate) {
      await runQuery('UPDATE category_rules SET priority = ? WHERE id = ?', [update.priority, update.id]);
    }

    // Get final count
    const finalRules = await getRows('SELECT COUNT(*) as count FROM category_rules');
    console.log(`\n✅ Consolidation completed!`);
    console.log(`📊 Final rule count: ${finalRules[0].count}`);
    console.log(`🗑️  Removed: ${rulesToDelete.length} duplicate/overlapping rules`);
    console.log(`📝 Updated: ${rulesToUpdate.length} rule priorities`);

    // Show final consolidated rules by priority
    console.log(`\n📋 Final consolidated rules (top 20 by priority):`);
    const topRules = await getRows(`
      SELECT cr.keywords, c.name as category_name, cr.priority 
      FROM category_rules cr 
      JOIN categories c ON cr.category_id = c.id 
      ORDER BY cr.priority DESC, c.name 
      LIMIT 20
    `);
    
    topRules.forEach(rule => {
      console.log(`  ${rule.priority.toString().padStart(2)} | ${rule.keywords.padEnd(40)} → ${rule.category_name}`);
    });

  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    throw error;
  }
}

// Run consolidation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  consolidateRules()
    .then(() => {
      console.log('🎉 Consolidation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Consolidation failed:', error);
      process.exit(1);
    });
}

export { consolidateRules };