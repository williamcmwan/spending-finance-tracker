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

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await getRows(
      'SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY name',
      [req.user.userId]
    );
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await getRow(
      'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [id, req.user.userId]
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to capitalize first letter of a string
const capitalizeFirstLetter = (string) => {
  if (!string || typeof string !== 'string') return string;
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Create category (admin only for now, since we're using default categories)
router.post('/', [
  authenticateToken,
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('icon').optional().trim().notEmpty().withMessage('Icon cannot be empty'),
  body('is_once_off').optional().isBoolean().withMessage('is_once_off must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color = '#3B82F6', icon = 'tag', is_once_off = false } = req.body;
    const capitalizedName = capitalizeFirstLetter(name);

    // Check if category already exists
    const existingCategory = await getRow('SELECT * FROM categories WHERE name = ?', [capitalizedName]);
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const result = await runQuery(
      'INSERT INTO categories (name, color, icon, user_id, is_once_off) VALUES (?, ?, ?, ?, ?)',
      [capitalizedName, color, icon, req.user.userId, is_once_off ? 1 : 0]
    );

    const category = await getRow('SELECT * FROM categories WHERE id = ?', [result.id]);

    res.status(201).json({ 
      message: 'Category created successfully',
      category 
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category
router.put('/:id', [
  authenticateToken,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('icon').optional().trim().notEmpty().withMessage('Icon cannot be empty'),
  body('is_once_off').optional().isBoolean().withMessage('is_once_off must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, color, icon, is_once_off } = req.body;

    // Check if category exists
    const existingCategory = await getRow('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(capitalizeFirstLetter(name));
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (is_once_off !== undefined) {
      updates.push('is_once_off = ?');
      params.push(is_once_off ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await runQuery(`
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    const category = await getRow('SELECT * FROM categories WHERE id = ?', [id]);

    res.json({ 
      message: 'Category updated successfully',
      category 
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await getRow('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used by transactions
    const transactionsUsingCategory = await getRow(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
      [id]
    );

    if (transactionsUsingCategory.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that has transactions. Please reassign or delete the transactions first.' 
      });
    }

    await runQuery('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as categoryRoutes };
