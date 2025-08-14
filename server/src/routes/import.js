import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { getRow, runQuery, getRows } from '../database/init.js';

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
    'Income Amount', 'Spending Amount', 'Category', 
    'Source / Bank', 'Currency', 'Spending for non-EUR currency'
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

  // Validate date format (DD/MM/YYYY)
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  let parsedDate = row['Date'];
  
  if (!dateRegex.test(row['Date'])) {
    issues.push('Invalid date format. Expected DD/MM/YYYY');
    status = 'invalid';
  } else {
    // Convert DD/MM/YYYY to YYYY-MM-DD for database storage
    const [day, month, year] = row['Date'].split('/');
    parsedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Validate that it's a real date
    const dateObj = new Date(parsedDate);
    if (isNaN(dateObj.getTime()) || dateObj.toISOString().split('T')[0] !== parsedDate) {
      issues.push('Invalid date value');
      status = 'invalid';
    }
  }

  // Validate amounts
  const incomeAmount = parseFloat(row['Income Amount']) || 0;
  const spendingAmount = parseFloat(row['Spending Amount']) || 0;

  if (isNaN(incomeAmount) || isNaN(spendingAmount)) {
    issues.push('Invalid amount format');
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
        Math.abs(incomeAmount > 0 ? incomeAmount : spendingAmount),
        incomeAmount > 0 ? 'income' : 'expense'
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
      category: categoryName || row['Category'], // Use capitalized category name if available
      source: row['Source / Bank'],
      currency: row['Currency'],
      nonEurSpending: row['Spending for non-EUR currency'],
      year: row['Year'],
      month: row['Month']
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

        // Determine transaction type and amount
        const type = transaction.incomeAmount > 0 ? 'income' : 'expense';
        const amount = Math.abs(transaction.incomeAmount > 0 ? transaction.incomeAmount : transaction.spendingAmount);

        // Insert transaction
        const result = await runQuery(
          `INSERT INTO transactions (description, amount, type, category_id, user_id, date) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [transaction.description, amount, type, categoryId, req.userId, transaction.date]
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
      'Income Amount': '0',
      'Spending Amount': '45.50',
      'Category': 'Food & dining',
      'Source / Bank': 'Chase Bank',
      'Currency': 'USD',
      'Spending for non-EUR currency': '0'
    },
    {
      'Date': '15/01/2025',
      'Year': '2025',
      'Month': '01',
      'Details / Description': 'Salary deposit',
      'Income Amount': '5000.00',
      'Spending Amount': '0',
      'Category': 'Salary',
      'Source / Bank': 'Chase Bank',
      'Currency': 'USD',
      'Spending for non-EUR currency': '0'
    }
  ];

  res.json({
    success: true,
    template,
    headers: Object.keys(template[0])
  });
});

export { router as importRoutes };
