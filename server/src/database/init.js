import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'spending.db');

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
  `;

  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err.message);
    } else {
      console.log('Database tables initialized successfully');
      seedDefaultData();
    }
  });
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
        }
      });
    }
  });
}

// Helper function to run queries with promises
export function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
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
