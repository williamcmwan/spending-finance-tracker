import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { getRow, getRows, runQuery } from '../database/init.js';

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
    const { page = 1, limit = 20, type, category_id, start_date, end_date } = req.query;
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

    if (start_date) {
      whereClause += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND t.date <= ?';
      params.push(end_date);
    }

    const sql = `
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const transactions = await getRows(sql, [...params, parseInt(limit), offset]);
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
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
        c.icon as category_icon
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
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('category_id').optional().isInt().withMessage('Category ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount, type, category_id, date } = req.body;

    // Verify category exists if provided
    if (category_id) {
      const category = await getRow('SELECT * FROM categories WHERE id = ?', [category_id]);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    const result = await runQuery(`
      INSERT INTO transactions (description, amount, type, category_id, user_id, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [description, amount, type, category_id, req.user.userId, date]);

    const transaction = await getRow(`
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
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

// Update transaction
router.put('/:id', [
  authenticateToken,
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('category_id').optional().isInt().withMessage('Category ID must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { description, amount, type, category_id, date } = req.body;

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
        c.icon as category_icon
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
