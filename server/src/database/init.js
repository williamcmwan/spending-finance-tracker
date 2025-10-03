import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
import fs from 'fs';

// Get database path from environment or use default
const defaultDataDir = path.join(__dirname, '../../data');
const dbPath = process.env.DATABASE_PATH || path.join(defaultDataDir, 'spending.db');

// Ensure the directory for the database exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database tables
export function initializeDatabase() {
  const createTables = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      google_id TEXT UNIQUE,
      totp_secret TEXT,
      totp_enabled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      icon TEXT DEFAULT 'tag',
      user_id INTEGER,
      is_once_off INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense', 'capex')) NOT NULL,
      category_id INTEGER,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      source TEXT DEFAULT 'Manual Entry',
      currency TEXT DEFAULT 'USD',
      original_amount DECIMAL(10,2),
      original_currency TEXT,
      exchange_rate DECIMAL(10,6),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- User settings table
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      base_currency TEXT DEFAULT 'USD',
      extra_currencies TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Category rules table for automatic categorization
    CREATE TABLE IF NOT EXISTS category_rules (
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
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_category_rules_user_id ON category_rules(user_id);
    CREATE INDEX IF NOT EXISTS idx_category_rules_category_id ON category_rules(category_id);
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
    } else {
      console.log('Database tables initialized successfully');
      ensureUserTableColumns()
        .then(() => ensureTransactionTableColumns())
        .then(() => ensureCategoryTableColumns())
        .then(() => seedDefaultData())
        .catch((e) => {
          console.error('Error ensuring table columns:', e.message);
          seedDefaultData();
        });
    }
  });
}

// Ensure new columns exist for TOTP without breaking existing DBs
function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName});`, [], (err, rows) => {
      if (err) return reject(err);
      const exists = rows.some((r) => r.name === columnName);
      resolve(exists);
    });
  });
}

async function ensureUserTableColumns() {
  const hasTotpSecret = await columnExists('users', 'totp_secret');
  if (!hasTotpSecret) {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN totp_secret TEXT;', [], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  const hasTotpEnabled = await columnExists('users', 'totp_enabled');
  if (!hasTotpEnabled) {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE users ADD COLUMN totp_enabled INTEGER DEFAULT 0;', [], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

async function ensureTransactionTableColumns() {
  const hasCurrency = await columnExists('transactions', 'currency');
  if (!hasCurrency) {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT "USD";', [], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  const hasOriginalAmount = await columnExists('transactions', 'original_amount');
  if (!hasOriginalAmount) {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE transactions ADD COLUMN original_amount DECIMAL(10,2);', [], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  const hasOriginalCurrency = await columnExists('transactions', 'original_currency');
  if (!hasOriginalCurrency) {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE transactions ADD COLUMN original_currency TEXT;', [], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  const hasExchangeRate = await columnExists('transactions', 'exchange_rate');
  if (!hasExchangeRate) {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE transactions ADD COLUMN exchange_rate DECIMAL(10,6);', [], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

async function ensureCategoryTableColumns() {
  const hasIsOnceOff = await columnExists('categories', 'is_once_off');
  if (!hasIsOnceOff) {
    await new Promise((resolve, reject) => {
      db.run('ALTER TABLE categories ADD COLUMN is_once_off INTEGER DEFAULT 0;', [], function (err) {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

// Seed default data
function seedDefaultData() {
  // Check if default categories exist
  db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
    if (err) {
      console.error('Error checking categories:', err.message);
      return;
    }

    if (row.count === 0) {
      const defaultCategories = [
        { name: 'Food & dining', color: '#EF4444', icon: 'utensils' },
        { name: 'Transportation', color: '#3B82F6', icon: 'car' },
        { name: 'Shopping', color: '#8B5CF6', icon: 'shopping-bag' },
        { name: 'Entertainment', color: '#F59E0B', icon: 'film' },
        { name: 'Healthcare', color: '#EF4444', icon: 'heart' },
        { name: 'Utilities', color: '#10B981', icon: 'zap' },
        { name: 'Housing', color: '#059669', icon: 'home' },
        { name: 'Education', color: '#3B82F6', icon: 'graduation-cap' },
        { name: 'Salary', color: '#10B981', icon: 'dollar-sign' },
        { name: 'Freelance', color: '#3B82F6', icon: 'briefcase' },
        { name: 'Investment', color: '#F59E0B', icon: 'trending-up' },
        { name: 'Other', color: '#6B7280', icon: 'more-horizontal' }
      ];

      const insertCategory = db.prepare(`
        INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)
      `);

      defaultCategories.forEach(category => {
        insertCategory.run([category.name, category.color, category.icon]);
      });

      insertCategory.finalize((err) => {
        if (err) {
          console.error('Error seeding categories:', err.message);
        } else {
          console.log('Default categories seeded successfully');
          // Seed category rules after categories are created
          seedDefaultCategoryRules();
        }
      });
    }
  });
}

// Helper function to run queries with promises
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Helper function to get single row
export function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper function to get multiple rows
export function getRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Seed default category rules based on existing hard-coded logic
function seedDefaultCategoryRules() {
  // Check if default category rules exist
  db.get("SELECT COUNT(*) as count FROM category_rules", (err, row) => {
    if (err) {
      console.error('Error checking category rules:', err.message);
      return;
    }

    if (row.count === 0) {
      // Get category IDs for mapping
      db.all("SELECT id, name FROM categories", (err, categories) => {
        if (err) {
          console.error('Error fetching categories for rules:', err.message);
          return;
        }

        const categoryMap = {};
        categories.forEach(cat => {
          categoryMap[cat.name.toLowerCase()] = cat.id;
        });

        console.log('Available categories:', categories.map(c => c.name));

        // Default category rules extracted from the hard-coded logic
        const defaultRules = [
          // Groceries & Food
          { keywords: 'lidl,aldi,tesco,dunnes,supervalu,spar,corn', category: 'Food & dining', priority: 10 },
          { keywords: 'restaurant,cafe,pizza,mcdonald,burger,kfc,coffee', category: 'Food & dining', priority: 9 },

          // Shopping & Furniture
          { keywords: 'ikea,furniture,sofa', category: 'Housing', priority: 8 },
          { keywords: 'decathlon,sports,gym', category: 'Entertainment', priority: 7 },
          { keywords: 'clothing,shirt,fashion', category: 'Shopping', priority: 6 },

          // Transport
          { keywords: 'dublin airp,airport,leap card,bus,dart', category: 'Transportation', priority: 10 },
          { keywords: 'parking', category: 'Transportation', priority: 9 },
          { keywords: 'petrol,fuel,esso,shell,circle k,ev charge', category: 'Transportation', priority: 8 },
          { keywords: 'toll', category: 'Transportation', priority: 7 },
          { keywords: 'park magic', category: 'Transportation', priority: 10 }, // Specific case

          // Travel & Entertainment
          { keywords: 'travel,hotel,flight', category: 'Entertainment', priority: 6 },
          { keywords: 'cinema,movie,entertainment', category: 'Entertainment', priority: 5 },
          { keywords: 'pga,golf,ob pga europ', category: 'Entertainment', priority: 4 },

          // Bills & Services
          { keywords: 'vodafone,three,eir,virgin,mobile', category: 'Utilities', priority: 8 },
          { keywords: 'electric,electricity', category: 'Utilities', priority: 7 },
          { keywords: 'vhi sepa dd,vhi insurance,zurich', category: 'Healthcare', priority: 9 },
          { keywords: 'vhi,pcc sp', category: 'Healthcare', priority: 8 },
          { keywords: 'subscription,netflix,spotify', category: 'Entertainment', priority: 3 },

          // Medical & Health
          { keywords: 'doctor,medical,health', category: 'Healthcare', priority: 10 },
          { keywords: 'medicine,pharmacy,boots', category: 'Healthcare', priority: 9 },

          // Financial & Banking
          { keywords: 'fee,charge,maintaining,bank', category: 'Other', priority: 5 },
          { keywords: '365 online,santry', category: 'Other', priority: 4 }, // General transfers
          { keywords: 'transfer,online', category: 'Other', priority: 3 },

          // Income patterns
          { keywords: 'henrietta,salary,wages', category: 'Salary', priority: 10 },
          { keywords: '365 online santry cr', category: 'Salary', priority: 11 }, // Specific rental income

          // Specific patterns
          { keywords: 'cloud pic', category: 'Food & dining', priority: 11 }, // Coffee
          { keywords: 'china tang,sumup *cat', category: 'Food & dining', priority: 10 }, // Meals
          { keywords: 'v960358415,fa', category: 'Other', priority: 12 }, // Child benefit pattern
          { keywords: 'temple place,temple palace,santry,santr,henrietta,henriett', category: 'Salary', priority: 12 } // Rental income
        ];

        const insertRule = db.prepare(`
          INSERT INTO category_rules (category_id, keywords, priority, user_id) VALUES (?, ?, ?, NULL)
        `);

        defaultRules.forEach(rule => {
          const categoryId = categoryMap[rule.category.toLowerCase()];
          if (categoryId) {
            insertRule.run([categoryId, rule.keywords, rule.priority]);
          } else {
            console.warn(`Category not found for rule: ${rule.category} (available: ${Object.keys(categoryMap).join(', ')})`);
          }
        });

        insertRule.finalize((err) => {
          if (err) {
            console.error('Error seeding category rules:', err.message);
          } else {
            console.log('Default category rules seeded successfully');
          }
        });
      });
    }
  });
}
