import { db, getRows, runQuery } from './init.js';

// Complete migration to ensure ALL hard-coded category mappings are migrated
async function completeRulesMigration() {
  console.log('🔄 Starting complete category rules migration...');
  
  try {
    // Get existing categories
    const categories = await getRows('SELECT id, name FROM categories ORDER BY name');
    console.log(`📊 Found ${categories.length} existing categories`);

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name.toLowerCase()] = cat.id;
    });

    console.log('Available categories:', categories.map(c => c.name).join(', '));

    // Get existing rules to avoid duplicates
    const existingRules = await getRows('SELECT keywords, category_id FROM category_rules');
    const existingRuleSet = new Set(existingRules.map(r => `${r.keywords}:${r.category_id}`));

    // Complete list of ALL original hard-coded patterns
    const allOriginalRules = [
      // Special high-priority specific patterns (these were at the top of the original function)
      { keywords: '365 online santry cr', category: 'Rental income', priority: 15 }, // Specific rental income
      { keywords: 'park magic', category: 'Toll', priority: 15 }, // Specific toll case
      { keywords: 'vhi,pcc sp', category: 'Doctor', priority: 14 }, // VHI doctor payments
      { keywords: 'vhi sepa dd', category: 'Insurance', priority: 14 }, // VHI insurance
      { keywords: 'temple place,temple palace,santry,santr,henrietta,henriett', category: 'Rental income', priority: 13 }, // Rental patterns
      { keywords: 'v960358415,fa', category: 'Child benefit', priority: 13 }, // Child benefit pattern
      { keywords: 'cloud pic', category: 'Coffee', priority: 12 }, // Coffee specific
      { keywords: 'china tang,sumup *cat', category: 'Meal', priority: 12 }, // Meal specific
      
      // Groceries & Food
      { keywords: 'lidl,aldi,tesco,dunnes,supervalu,spar,corn', category: 'Supermarket', priority: 10 },
      { keywords: 'restaurant,cafe,pizza,mcdonald,burger,kfc,coffee', category: 'Meal', priority: 9 },
      
      // Shopping & Furniture  
      { keywords: 'ikea,furniture,sofa', category: 'Furniture', priority: 8 },
      { keywords: 'decathlon,sports,gym', category: 'Entertainment', priority: 7 },
      { keywords: 'clothing,shirt,fashion', category: 'Clothing', priority: 6 },
      { keywords: 'electrical,appliances', category: 'Electrical appliances', priority: 6 },
      { keywords: 'tools', category: 'Tools', priority: 6 },
      { keywords: 'books,stationaries', category: 'Books', priority: 6 },
      
      // Transport
      { keywords: 'dublin airp,airport,leap card,bus,dart', category: 'Transport', priority: 10 },
      { keywords: 'parking', category: 'Parking', priority: 9 },
      { keywords: 'petrol,fuel,esso,shell,circle k,ev charge', category: 'Fuel', priority: 8 },
      { keywords: 'toll', category: 'Toll', priority: 7 },
      { keywords: 'car maintenance', category: 'Car maintenance', priority: 7 },
      
      // Travel & Entertainment
      { keywords: 'travel,hotel,flight', category: 'Travel', priority: 6 },
      { keywords: 'cinema,movie,entertainment', category: 'Entertainment', priority: 5 },
      { keywords: 'pga,golf', category: 'Golf', priority: 4 },
      { keywords: 'ob pga europ', category: 'Golf', priority: 4 }, // Specific PGA event
      
      // Bills & Services
      { keywords: 'vodafone,three,eir,virgin,mobile', category: 'Mobile', priority: 8 },
      { keywords: 'electric,electricity', category: 'Electricity', priority: 7 },
      { keywords: 'vhi insurance,zurich', category: 'Insurance', priority: 9 },
      { keywords: 'subscription,netflix,spotify', category: 'Subscription', priority: 3 },
      { keywords: 'postal,mail', category: 'Postal', priority: 4 },
      
      // Medical & Health
      { keywords: 'doctor,medical,health', category: 'Doctor', priority: 10 },
      { keywords: 'medicine,pharmacy,boots', category: 'Medicine', priority: 9 },
      
      // Financial & Banking
      { keywords: 'fee,charge,maintaining,bank', category: 'Bank', priority: 5 },
      { keywords: '365 online,santry', category: 'Transfer', priority: 4 }, // General transfers
      { keywords: 'transfer,online', category: 'Transfer', priority: 3 },
      
      // Income patterns
      { keywords: 'henrietta,salary,wages', category: 'Salary', priority: 10 },
      
      // Property & Rental
      { keywords: 'rental,property,rent', category: 'Rental property', priority: 6 },
      { keywords: 'garden', category: 'Garden', priority: 5 },
      { keywords: 'solar', category: 'Solar', priority: 5 },
      
      // Education
      { keywords: 'school,education', category: 'School', priority: 5 },
      
      // Other
      { keywords: 'gift', category: 'Gift', priority: 4 },
      { keywords: 'donation', category: 'Donation', priority: 4 },
      { keywords: 'tax', category: 'Tax', priority: 4 },
      { keywords: 'license', category: 'License', priority: 4 },
      { keywords: 'maintenance', category: 'Maintenance', priority: 4 },
      
      // Additional patterns that might have been missed
      { keywords: 'management fee', category: 'Management fee', priority: 5 },
      { keywords: 'tv license', category: 'Tv license', priority: 5 },
      { keywords: 'shipping', category: 'Shipping', priority: 4 }
    ];

    let rulesAdded = 0;
    let rulesSkipped = 0;

    for (const rule of allOriginalRules) {
      const categoryId = categoryMap[rule.category.toLowerCase()];
      if (categoryId) {
        const ruleKey = `${rule.keywords}:${categoryId}`;
        if (!existingRuleSet.has(ruleKey)) {
          await runQuery(
            'INSERT INTO category_rules (category_id, keywords, priority, user_id) VALUES (?, ?, ?, NULL)',
            [categoryId, rule.keywords, rule.priority]
          );
          rulesAdded++;
          console.log(`✅ Added rule: ${rule.keywords} → ${rule.category}`);
        } else {
          rulesSkipped++;
        }
      } else {
        console.log(`⚠️  Category not found for rule: ${rule.category}`);
      }
    }
    
    console.log(`✅ Migration completed: ${rulesAdded} rules added, ${rulesSkipped} rules already existed`);
    
    // Show final count
    const finalRules = await getRows('SELECT COUNT(*) as count FROM category_rules');
    console.log(`📊 Total category rules in database: ${finalRules[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeRulesMigration()
    .then(() => {
      console.log('🎉 Complete migration finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { completeRulesMigration };