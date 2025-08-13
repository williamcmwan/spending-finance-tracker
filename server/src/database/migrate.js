import { initializeDatabase } from './init.js';

console.log('🚀 Initializing database...');

try {
  initializeDatabase();
  console.log('✅ Database initialized successfully!');
  console.log('📁 Database file: ./data/spending.db');
  console.log('🎯 You can now start the server with: npm run dev');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
