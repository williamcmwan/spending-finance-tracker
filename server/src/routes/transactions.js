import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { getRow, getRows, runQuery } from '../database/init.js';
import fetch from 'node-fetch';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all transactions for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category_id, start_date, end_date, description, amount, source, min_amount, max_amount, sort_field = 'date', sort_direction = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE t.user_id = ?';
    let params = [req.user.userId];

    if (type) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }

    if (category_id) {
      whereClause += ' AND t.category_id = ?';
      params.push(category_id);
    }

    if (source) {
      whereClause += ' AND t.source LIKE ?';
      params.push(`%${source}%`);
    }

    if (start_date) {
      whereClause += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND t.date <= ?';
      params.push(end_date);
    }

    if (min_amount) {
      whereClause += ' AND t.amount >= ?';
      params.push(parseFloat(min_amount));
    }

    if (max_amount) {
      whereClause += ' AND t.amount <= ?';
      params.push(parseFloat(max_amount));
    }

    // Add date search functionality
    if (req.query.date_search) {
      const dateSearch = req.query.date_search;
      
      // Support various date formats and partial matches
      if (dateSearch.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        // Full date format: YYYY-MM-DD
        whereClause += ' AND DATE(t.date) = DATE(?)';
        params.push(dateSearch);
      } else if (dateSearch.match(/^\d{4}-\d{1,2}$/)) {
        // Year-Month format: YYYY-MM
        const [year, month] = dateSearch.split('-');
        whereClause += ' AND strftime("%Y", t.date) = ? AND strftime("%m", t.date) = ?';
        params.push(year, month.padStart(2, '0'));
      } else if (dateSearch.match(/^\d{1,2}-\d{1,2}$/)) {
        // Month-Day format: MM-DD
        const [month, day] = dateSearch.split('-');
        whereClause += ' AND strftime("%m", t.date) = ? AND strftime("%d", t.date) = ?';
        params.push(month.padStart(2, '0'), day.padStart(2, '0'));
      } else if (dateSearch.includes('/') || dateSearch.includes('.')) {
        // Try to parse as date with other separators
        const searchDate = new Date(dateSearch);
        if (!isNaN(searchDate.getTime())) {
          whereClause += ' AND DATE(t.date) = DATE(?)';
          params.push(searchDate.toISOString().split('T')[0]);
        }
      } else if (dateSearch.match(/^\d{4}$/)) {
        // Year search
        whereClause += ' AND strftime("%Y", t.date) = ?';
        params.push(dateSearch);
      } else if (dateSearch.match(/^\d{1,2}$/)) {
        // Month or day search (1-12 for months, 1-31 for days)
        const num = parseInt(dateSearch);
        if (num >= 1 && num <= 12) {
          // Likely a month
          whereClause += ' AND strftime("%m", t.date) = ?';
          params.push(dateSearch.padStart(2, '0'));
        } else if (num >= 1 && num <= 31) {
          // Likely a day
          whereClause += ' AND strftime("%d", t.date) = ?';
          params.push(dateSearch.padStart(2, '0'));
        }
      } else if (dateSearch.match(/^\d{3}$/)) {
        // Partial year search (e.g., "202" for 2020, 2021, 2022, etc.)
        whereClause += ' AND strftime("%Y", t.date) LIKE ?';
        params.push(`${dateSearch}%`);
      } else if (dateSearch.match(/^[a-zA-Z]+$/)) {
        // Month name search (e.g., "jan", "january", "feb", etc.)
        const monthNames = {
          'jan': '01', 'january': '01',
          'feb': '02', 'february': '02',
          'mar': '03', 'march': '03',
          'apr': '04', 'april': '04',
          'may': '05',
          'jun': '06', 'june': '06',
          'jul': '07', 'july': '07',
          'aug': '08', 'august': '08',
          'sep': '09', 'september': '09',
          'oct': '10', 'october': '10',
          'nov': '11', 'november': '11',
          'dec': '12', 'december': '12'
        };
        const monthNum = monthNames[dateSearch.toLowerCase()];
        if (monthNum) {
          whereClause += ' AND strftime("%m", t.date) = ?';
          params.push(monthNum);
        }
      } else if (dateSearch.match(/^\d+$/)) {
        // Any other numeric input - search in date string format
        whereClause += ' AND strftime("%Y-%m-%d", t.date) LIKE ?';
        params.push(`%${dateSearch}%`);
      }
    }

    if (description) {
      whereClause += ' AND (t.description LIKE ? OR c.name LIKE ? OR t.source LIKE ?)';
      params.push(`%${description}%`, `%${description}%`, `%${description}%`);
    }

    if (amount) {
      // Support both exact amount and amount range searching
      if (amount.includes('-')) {
        const [minAmount, maxAmount] = amount.split('-').map(a => parseFloat(a.trim()));
        if (!isNaN(minAmount)) {
          whereClause += ' AND t.amount >= ?';
          params.push(minAmount);
        }
        if (!isNaN(maxAmount)) {
          whereClause += ' AND t.amount <= ?';
          params.push(maxAmount);
        }
      } else {
        // Try to parse as exact amount first
        const exactAmount = parseFloat(amount);
        if (!isNaN(exactAmount)) {
          whereClause += ' AND t.amount = ?';
          params.push(exactAmount);
        } else {
          // If not a number, search for amount as text (for partial matches)
          whereClause += ' AND CAST(t.amount AS TEXT) LIKE ?';
          params.push(`%${amount}%`);
        }
      }
    }

    // Build ORDER BY clause
    let orderByClause = 'ORDER BY ';
    const validSortFields = ['date', 'description', 'amount', 'type', 'category', 'source'];
    const validSortDirections = ['asc', 'desc'];
    
    if (validSortFields.includes(sort_field) && validSortDirections.includes(sort_direction)) {
      if (sort_field === 'category') {
        orderByClause += `c.name COLLATE NOCASE ${sort_direction.toUpperCase()}`;
      } else if (sort_field === 'description') {
        orderByClause += `t.description COLLATE NOCASE ${sort_direction.toUpperCase()}`;
      } else if (sort_field === 'type') {
        orderByClause += `t.type COLLATE NOCASE ${sort_direction.toUpperCase()}`;
      } else if (sort_field === 'source') {
        orderByClause += `t.source COLLATE NOCASE ${sort_direction.toUpperCase()}`;
      } else {
        orderByClause += `t.${sort_field} ${sort_direction.toUpperCase()}`;
      }
    } else {
      // Default sorting
      orderByClause += 't.date DESC';
    }
    
    const sql = `
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.is_once_off as category_is_once_off
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const transactions = await getRows(sql, [...params, parseInt(limit), offset]);
    
    // Get total count
    let countSql;
    if (description || source) {
      // If searching by description (which includes category and source) or source, need to include the JOIN
      countSql = `SELECT COUNT(*) as total FROM transactions t LEFT JOIN categories c ON t.category_id = c.id ${whereClause}`;
    } else {
      // Otherwise, just count from transactions table
      countSql = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
    }
    const countResult = await getRow(countSql, params);
    const total = countResult.total;

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single transaction
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await getRow(`
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.is_once_off as category_is_once_off
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.user_id = ?
    `, [id, req.user.userId]);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create transaction
router.post('/', [
  authenticateToken,
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense', 'capex']).withMessage('Type must be income, expense, or capex'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('category_id').optional().isInt().withMessage('Category ID must be a number'),
  body('source').optional().isString().withMessage('Source must be a string'),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, type, category_id, date, source = 'Manual Entry', currency } = req.body;

    // Verify category exists if provided
    if (category_id) {
      const category = await getRow('SELECT * FROM categories WHERE id = ?', [category_id]);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    // Get user's base currency
    const settings = await getRow('SELECT base_currency FROM user_settings WHERE user_id = ?', [req.user.userId]);
    const baseCurrency = (settings?.base_currency || 'USD').toUpperCase();
    const transactionCurrency = (currency || baseCurrency).toUpperCase();
    
    let baseAmount = amount;
    let title = description;
    let originalAmount = null;
    let originalCurrency = null;
    let exchangeRate = null;
    
    // Handle currency conversion if needed
    if (transactionCurrency !== baseCurrency) {
      try {
        // Try to get exchange rate from our enhanced API
        const rateData = await fetchExchangeRateAPI(transactionCurrency, baseCurrency);
        if (rateData && rateData.rate) {
          exchangeRate = rateData.rate;
          baseAmount = parseFloat((amount * exchangeRate).toFixed(2));
          originalAmount = amount;
          originalCurrency = transactionCurrency;
          title = `${description} (${transactionCurrency} ${parseFloat(amount).toFixed(2)})`;
        } else {
          // Fallback to other APIs
          const fallbackRate = await fetchFallbackRate(transactionCurrency, baseCurrency);
          if (fallbackRate && fallbackRate.rate) {
            exchangeRate = fallbackRate.rate;
            baseAmount = parseFloat((amount * exchangeRate).toFixed(2));
            originalAmount = amount;
            originalCurrency = transactionCurrency;
            title = `${description} (${transactionCurrency} ${parseFloat(amount).toFixed(2)})`;
          }
        }
      } catch (error) {
        console.error('Currency conversion error:', error);
        // If conversion fails, use original amount and currency
      }
    }

    const result = await runQuery(`
      INSERT INTO transactions (description, amount, type, category_id, user_id, date, source, currency, original_amount, original_currency, exchange_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, baseAmount, type, category_id, req.user.userId, date, source, baseCurrency, originalAmount, originalCurrency, exchangeRate]);

    const transaction = await getRow(`
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.is_once_off as category_is_once_off
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [result.id]);

    res.status(201).json({ 
      message: 'Transaction created successfully',
      transaction 
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function fetchExchangeRateAPI(from, to) {
  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(from)}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SpendingTrackerBot/1.0)'
      }
    });
    
    if (resp.ok) {
      const data = await resp.json();
      const rate = data?.rates?.[to];
      
      if (typeof rate === 'number') {
        return {
          rate: rate,
          source: 'ExchangeRate-API'
        };
      }
    }
  } catch (error) {
    console.error('ExchangeRate-API error:', error);
  }
  return null;
}

async function fetchFallbackRate(from, to) {
  try {
    const url = `https://api.exchangerate.host/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data?.result;
    return typeof result === 'number' ? {
      rate: result,
      source: 'ExchangeRate.host'
    } : null;
  } catch {
    return null;
  }
}

// Update transaction
router.put('/:id', [
  authenticateToken,
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').optional().isIn(['income', 'expense', 'capex']).withMessage('Type must be income, expense, or capex'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('category_id').optional().isInt().withMessage('Category ID must be a number'),
  body('source').optional().isString().withMessage('Source must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { description, amount, type, category_id, date, source } = req.body;

    // Check if transaction exists and belongs to user
    const existingTransaction = await getRow(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify category exists if provided
    if (category_id) {
      const category = await getRow('SELECT * FROM categories WHERE id = ?', [category_id]);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(category_id);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    if (source !== undefined) {
      updates.push('source = ?');
      params.push(source);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id, req.user.userId);

    await runQuery(`
      UPDATE transactions 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `, params);

    const transaction = await getRow(`
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.is_once_off as category_is_once_off
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [id]);

    res.json({ 
      message: 'Transaction updated successfully',
      transaction 
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists and belongs to user
    const transaction = await getRow(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.userId]
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await runQuery('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.userId]);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as transactionRoutes };
