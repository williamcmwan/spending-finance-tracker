import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getRow, runQuery, getRows } from '../database/init.js';
import { parseBoiStatement, suggestCategory } from '../utils/boiParser.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Configure multer for PDF uploads (BOI statements)
const uploadPdf = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDFs
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Parse CSV file and validate data
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Validate CSV data structure
const validateCSVStructure = (data) => {
  const requiredColumns = [
    'Date', 'Year', 'Month', 'Details / Description', 
    'Income Amount', 'Spending Amount', 'Capex Amount', 'Category', 
    'Source / Bank', 'Transaction Type', 'Currency', 'Spending for non-EUR currency'
  ];

  if (data.length === 0) {
    return { valid: false, error: 'CSV file is empty' };
  }

  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    return { 
      valid: false, 
      error: `Missing required columns: ${missingColumns.join(', ')}` 
    };
  }

  return { valid: true };
};

// Function to capitalize first letter of a string
const capitalizeFirstLetter = (string) => {
  if (!string || typeof string !== 'string') return string;
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Validate and process individual transaction
const validateTransaction = async (row, index, userId) => {
  const issues = [];
  let status = 'valid';

  // Validate date format (DD/MM/YYYY or YYYY-MM-DD)
  const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/;
  let parsedDate = row['Date'];
  
  if (ddmmyyyyRegex.test(row['Date'])) {
    // Convert DD/MM/YYYY to YYYY-MM-DD for database storage
    const [day, month, year] = row['Date'].split('/');
    parsedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } else if (yyyymmddRegex.test(row['Date'])) {
    // Already in YYYY-MM-DD format, use as is
    parsedDate = row['Date'];
  } else {
    issues.push('Invalid date format. Expected DD/MM/YYYY or YYYY-MM-DD');
    status = 'invalid';
  }
  
  // Validate that it's a real date (only if format was valid)
  if (status !== 'invalid') {
    const dateObj = new Date(parsedDate);
    if (isNaN(dateObj.getTime()) || dateObj.toISOString().split('T')[0] !== parsedDate) {
      issues.push('Invalid date value');
      status = 'invalid';
    }
  }

  // Validate amounts
  const incomeAmount = parseFloat(row['Income Amount']) || 0;
  const spendingAmount = parseFloat(row['Spending Amount']) || 0;
  const capexAmount = parseFloat(row['Capex Amount']) || 0;

  if (isNaN(incomeAmount) || isNaN(spendingAmount) || isNaN(capexAmount)) {
    issues.push('Invalid amount format');
    status = 'invalid';
  }

  // Validate transaction type
  const transactionType = row['Transaction Type'] ? row['Transaction Type'].toLowerCase() : '';
  if (transactionType && !['income', 'expense', 'capex'].includes(transactionType)) {
    issues.push('Invalid transaction type. Must be income, expense, or capex');
    status = 'invalid';
  }

  // Capitalize category name and check if it exists
  let categoryName = row['Category'];
  if (categoryName) {
    categoryName = capitalizeFirstLetter(categoryName);
    const category = await getRow(
      'SELECT * FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)',
      [categoryName, userId]
    );
    
    if (!category) {
      issues.push(`Category '${categoryName}' not found. You can add it as a new category.`);
      status = 'category_mismatch';
    }
  }

  // Determine transaction type and amount
  let type, amount;
  if (transactionType) {
    // Use explicit transaction type from CSV
    type = transactionType;
    if (type === 'income') {
      amount = Math.abs(incomeAmount);
    } else if (type === 'expense') {
      amount = Math.abs(spendingAmount);
    } else if (type === 'capex') {
      amount = Math.abs(capexAmount);
    }
  } else {
    // Fallback to old logic if no transaction type specified
    if (incomeAmount > 0) {
      type = 'income';
      amount = Math.abs(incomeAmount);
    } else if (capexAmount > 0) {
      type = 'capex';
      amount = Math.abs(capexAmount);
    } else {
      type = 'expense';
      amount = Math.abs(spendingAmount);
    }
  }

  // Check for exact duplicates (only if date is valid)
  let existingTransaction = null;
  if (status !== 'invalid') {
    existingTransaction = await getRow(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       AND date = ? 
       AND description = ? 
       AND amount = ? 
       AND type = ?`,
      [
        userId,
        parsedDate,
        row['Details / Description'],
        amount,
        type
      ]
    );
  }

  if (existingTransaction) {
    issues.push('Exact duplicate transaction found');
    status = 'duplicate';
  }

  return {
    rowIndex: index,
    data: {
      date: status !== 'invalid' ? parsedDate : row['Date'], // Use converted date if valid, original if invalid
      description: row['Details / Description'],
      incomeAmount: incomeAmount,
      spendingAmount: spendingAmount,
      capexAmount: capexAmount,
      category: categoryName || row['Category'], // Use capitalized category name if available
      source: row['Source / Bank'],
      transactionType: type,
      currency: row['Currency'],
      nonEurSpending: row['Spending for non-EUR currency'],
      year: row['Year'],
      month: row['Month'],
      amount: amount
    },
    status,
    issues
  };
};

// Upload and validate CSV file
router.post('/upload', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse CSV file
    const csvData = await parseCSV(req.file.path);

    // Validate CSV structure
    const structureValidation = validateCSVStructure(csvData);
    if (!structureValidation.valid) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({ error: structureValidation.error });
    }

    // Validate each transaction
    const validationResults = [];
    for (let i = 0; i < csvData.length; i++) {
      const result = await validateTransaction(csvData[i], i, req.userId);
      validationResults.push(result);
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return validation results
    res.json({
      success: true,
      totalTransactions: csvData.length,
      validationResults
    });

  } catch (error) {
    console.error('CSV import error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Import validated transactions
router.post('/import', authenticateToken, [
  body('transactions').isArray(),
  body('transactions.*.date').isDate(),
  body('transactions.*.description').notEmpty(),
  body('transactions.*.incomeAmount').isNumeric(),
  body('transactions.*.spendingAmount').isNumeric(),
  body('transactions.*.category').notEmpty(),
  body('transactions.*.source').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactions } = req.body;
    const importedTransactions = [];
    const importErrors = [];

    for (const transaction of transactions) {
      try {
        // Get or create category (ensure category name is capitalized)
        let categoryId;
        const capitalizedCategoryName = capitalizeFirstLetter(transaction.category);
        const existingCategory = await getRow(
          'SELECT * FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)',
          [capitalizedCategoryName, req.userId]
        );

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category with capitalized name
          const newCategory = await runQuery(
            'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)',
            [capitalizedCategoryName, '#6B7280', 'tag', req.userId]
          );
          categoryId = newCategory.id;
        }

        // Use the transaction type and amount determined during validation
        const type = transaction.transactionType;
        const amount = transaction.amount;

        // Insert transaction
        const result = await runQuery(
          `INSERT INTO transactions (description, amount, type, category_id, user_id, date, source) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [transaction.description, amount, type, categoryId, req.userId, transaction.date, transaction.source]
        );

        importedTransactions.push({
          id: result.id,
          ...transaction
        });

      } catch (error) {
        importErrors.push({
          transaction,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      importedCount: importedTransactions.length,
      errorCount: importErrors.length,
      importedTransactions,
      errors: importErrors
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import transactions' });
  }
});

// Get import template
router.get('/template', (req, res) => {
  const template = [
    {
      'Date': '15/01/2025',
      'Year': '2025',
      'Month': '01',
      'Details / Description': 'Grocery shopping',
      'Income Amount': '0.00',
      'Spending Amount': '45.50',
      'Capex Amount': '0.00',
      'Category': 'Food & dining',
      'Source / Bank': 'Chase Bank',
      'Transaction Type': 'expense',
      'Currency': 'EUR',
      'Spending for non-EUR currency': ''
    },
    {
      'Date': '15/01/2025',
      'Year': '2025',
      'Month': '01',
      'Details / Description': 'Salary deposit',
      'Income Amount': '5000.00',
      'Spending Amount': '0.00',
      'Capex Amount': '0.00',
      'Category': 'Salary',
      'Source / Bank': 'Company Bank',
      'Transaction Type': 'income',
      'Currency': 'EUR',
      'Spending for non-EUR currency': ''
    },
    {
      'Date': '2025-01-20',
      'Year': '2025',
      'Month': '01',
      'Details / Description': 'Solar panel installation',
      'Income Amount': '0.00',
      'Spending Amount': '0.00',
      'Capex Amount': '2500.00',
      'Category': 'Solar',
      'Source / Bank': 'Home Improvement Bank',
      'Transaction Type': 'capex',
      'Currency': 'EUR',
      'Spending for non-EUR currency': ''
    }
  ];

  res.json({
    success: true,
    template,
    headers: Object.keys(template[0])
  });
});

// Upload and process BOI PDF statement
router.post('/boi-upload', authenticateToken, uploadPdf.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Parse BOI PDF statement
    const pdfBuffer = fs.readFileSync(req.file.path);
    const transactions = await parseBoiStatement(pdfBuffer);

    // Get user's existing categories and transactions for intelligent matching
    const existingCategories = await getRows(
      'SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY name',
      [req.userId]
    );

    const userTransactions = await getRows(
      'SELECT t.*, c.name as category_name FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 500',
      [req.userId]
    );

    // Get category rules for intelligent categorization
    const categoryRules = await getRows(`
      SELECT 
        cr.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      WHERE cr.user_id = ? OR cr.user_id IS NULL
      ORDER BY cr.priority DESC, cr.created_at ASC
    `, [req.userId]);

    // Process each transaction and suggest categories
    const validationResults = [];
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      
      // Suggest category based on description and history
      const suggestedCategory = suggestCategory(
        transaction.description,
        existingCategories,
        userTransactions,
        categoryRules
      );

      // Check for exact duplicates
      const existingTransaction = await getRow(
        `SELECT * FROM transactions 
         WHERE user_id = ? 
         AND date = ? 
         AND description = ? 
         AND amount = ? 
         AND type = ?`,
        [
          req.userId,
          transaction.date,
          transaction.description,
          transaction.amount,
          transaction.type
        ]
      );

      let status = 'valid';
      const issues = [];

      if (existingTransaction) {
        issues.push('Exact duplicate transaction found');
        status = 'duplicate';
      }

      // Check if suggested category exists
      const categoryExists = existingCategories.find(cat => 
        cat.name.toLowerCase() === suggestedCategory.toLowerCase()
      );

      if (!categoryExists && suggestedCategory !== 'Other') {
        issues.push(`Category '${suggestedCategory}' will be created automatically`);
        status = status === 'valid' ? 'category_mismatch' : status;
      }

      validationResults.push({
        rowIndex: i,
        data: {
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: suggestedCategory,
          source: transaction.source,
          balance: transaction.balance
        },
        status,
        issues
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return validation results
    res.json({
      success: true,
      totalTransactions: transactions.length,
      validationResults
    });

  } catch (error) {
    console.error('BOI PDF import error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to process BOI PDF statement' });
  }
});

// Import BOI transactions
router.post('/boi-import', authenticateToken, [
  body('transactions').isArray(),
  body('transactions.*.date').isDate(),
  body('transactions.*.description').notEmpty(),
  body('transactions.*.amount').isNumeric(),
  body('transactions.*.type').isIn(['income', 'expense', 'capex']),
  body('transactions.*.category').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactions } = req.body;
    const importedTransactions = [];
    const importErrors = [];

    for (const transaction of transactions) {
      try {
        // Get or create category (ensure category name is capitalized)
        let categoryId;
        const capitalizedCategoryName = capitalizeFirstLetter(transaction.category);
        const existingCategory = await getRow(
          'SELECT * FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)',
          [capitalizedCategoryName, req.userId]
        );

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category with appropriate icon and color
          let icon = 'tag';
          let color = '#6B7280';
          
          // Set icon and color based on category name
          const categoryName = capitalizedCategoryName.toLowerCase();
          if (categoryName.includes('grocer') || categoryName.includes('food')) {
            icon = 'shopping-cart';
            color = '#10B981';
          } else if (categoryName.includes('transport') || categoryName.includes('car')) {
            icon = 'car';
            color = '#3B82F6';
          } else if (categoryName.includes('health') || categoryName.includes('medical')) {
            icon = 'heart';
            color = '#EF4444';
          } else if (categoryName.includes('entertainment') || categoryName.includes('fun')) {
            icon = 'film';
            color = '#8B5CF6';
          } else if (categoryName.includes('home') || categoryName.includes('garden')) {
            icon = 'home';
            color = '#F59E0B';
          } else if (categoryName.includes('phone') || categoryName.includes('internet')) {
            icon = 'smartphone';
            color = '#06B6D4';
          } else if (categoryName.includes('insurance')) {
            icon = 'shield';
            color = '#84CC16';
          }

          const newCategory = await runQuery(
            'INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)',
            [capitalizedCategoryName, color, icon, req.userId]
          );
          categoryId = newCategory.id;
        }

        // Insert transaction
        const result = await runQuery(
          `INSERT INTO transactions (description, amount, type, category_id, user_id, date, source) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [transaction.description, transaction.amount, transaction.type, categoryId, req.userId, transaction.date, transaction.source || 'BOI']
        );

        importedTransactions.push({
          id: result.id,
          ...transaction
        });

      } catch (error) {
        importErrors.push({
          transaction,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      importedCount: importedTransactions.length,
      errorCount: importErrors.length,
      importedTransactions,
      errors: importErrors
    });

  } catch (error) {
    console.error('BOI import error:', error);
    res.status(500).json({ error: 'Failed to import BOI transactions' });
  }
});

export { router as importRoutes };
