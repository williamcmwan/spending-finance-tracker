import { db, getRows, runQuery } from './init.js';

// Safe migration to add category_rules table without affecting existing data
async function migrateCategoryRules() {
  console.log('🔄 Starting category rules migration...');
  
  try {
    // Check if category_rules table exists
    const tableExists = await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='category_rules'", (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });

    if (!tableExists) {
      console.log('📋 Creating category_rules table...');
      
      // Create category_rules table
      await runQuery(`
        CREATE TABLE category_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          category_id INTEGER NOT NULL,
          keywords TEXT NOT NULL,
          priority INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )
      `);

      // Create indexes
      await runQuery('CREATE INDEX IF NOT EXISTS idx_category_rules_user_id ON category_rules(user_id)');
      await runQuery('CREATE INDEX IF NOT EXISTS idx_category_rules_category_id ON category_rules(category_id)');
      
      console.log('✅ category_rules table created successfully');
    } else {
      console.log('ℹ️  category_rules table already exists');
    }

    // Get existing categories to create default rules
    const categories = await getRows('SELECT id, name FROM categories ORDER BY name');
    console.log(`📊 Found ${categories.length} existing categories`);

    // Check if default rules already exist
    const existingRules = await getRows('SELECT COUNT(*) as count FROM category_rules');
    const ruleCount = existingRules[0]?.count || 0;

    if (ruleCount === 0) {
      console.log('📝 Creating default category rules...');
      
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      });

      // Default category rules based on your existing patterns
      const defaultRules = [
        // Groceries & Food
        { keywords: 'lidl,aldi,tesco,dunnes,supervalu,spar,corn', category: 'Supermarket', priority: 10 },
        { keywords: 'restaurant,cafe,pizza,mcdonald,burger,kfc,coffee', category: 'Meal', priority: 9 },
        
        // Transport
        { keywords: 'dublin airp,airport,leap card,bus,dart', category: 'Transport', priority: 10 },
        { keywords: 'parking', category: 'Parking', priority: 9 },
        { keywords: 'petrol,fuel,esso,shell,circle k,ev charge', category: 'Fuel', priority: 8 },
        { keywords: 'toll', category: 'Toll', priority: 7 },
        { keywords: 'park magic', category: 'Toll', priority: 10 },
        
        // Shopping & Furniture
        { keywords: 'ikea,furniture,sofa', category: 'Furniture', priority: 8 },
        { keywords: 'decathlon,sports,gym', category: 'Entertainment', priority: 7 },
        { keywords: 'clothing,shirt,fashion', category: 'Clothing', priority: 6 },
        
        // Entertainment
        { keywords: 'travel,hotel,flight', category: 'Travel', priority: 6 },
        { keywords: 'cinema,movie,entertainment', category: 'Entertainment', priority: 5 },
        { keywords: 'pga,golf,ob pga europ', category: 'Entertainment', priority: 4 },
        
        // Bills & Services
        { keywords: 'vodafone,three,eir,virgin,mobile', category: 'Mobile', priority: 8 },
        { keywords: 'electric,electricity', category: 'Electricity', priority: 7 },
        { keywords: 'vhi sepa dd,vhi insurance,zurich', category: 'Insurance', priority: 9 },
        { keywords: 'vhi,pcc sp', category: 'Doctor', priority: 8 },
        { keywords: 'subscription,netflix,spotify', category: 'Subscription', priority: 3 },
        
        // Medical & Health
        { keywords: 'doctor,medical,health', category: 'Doctor', priority: 10 },
        { keywords: 'medicine,pharmacy,boots', category: 'Medicine', priority: 9 },
        
        // Financial & Banking
        { keywords: 'fee,charge,maintaining,bank', category: 'Bank', priority: 5 },
        { keywords: '365 online,santry', category: 'Transfer', priority: 4 },
        { keywords: 'transfer,online', category: 'Transfer', priority: 3 },
        
        // Income patterns
        { keywords: 'henrietta,salary,wages', category: 'Income', priority: 10 },
        { keywords: '365 online santry cr', category: 'Rental income', priority: 11 },
        
        // Specific patterns
        { keywords: 'cloud pic', category: 'Coffee', priority: 11 },
        { keywords: 'china tang,sumup *cat', category: 'Meal', priority: 10 },
        { keywords: 'v960358415,fa', category: 'Child benefit', priority: 12 },
        { keywords: 'temple place,temple palace,santry,santr,henrietta,henriett', category: 'Rental income', priority: 12 }
      ];

      let rulesCreated = 0;
      for (const rule of defaultRules) {
        const categoryId = categoryMap[rule.category.toLowerCase()];
        if (categoryId) {
          await runQuery(
            'INSERT INTO category_rules (category_id, keywords, priority, user_id) VALUES (?, ?, ?, NULL)',
            [categoryId, rule.keywords, rule.priority]
          );
          rulesCreated++;
        } else {
          console.log(`⚠️  Category not found for rule: ${rule.category}`);
        }
      }
      
      console.log(`✅ Created ${rulesCreated} default category rules`);
    } else {
      console.log(`ℹ️  Found ${ruleCount} existing category rules, skipping default creation`);
    }

    console.log('🎉 Category rules migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCategoryRules()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateCategoryRules };