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

// Get all category rules for a user (including global rules)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rules = await getRows(`
      SELECT 
        cr.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      WHERE cr.user_id = ? OR cr.user_id IS NULL
      ORDER BY cr.priority DESC, cr.created_at ASC
    `, [req.user.userId]);

    res.json({ rules });
  } catch (error) {
    console.error('Get category rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category rule
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const rule = await getRow(`
      SELECT 
        cr.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      WHERE cr.id = ? AND (cr.user_id = ? OR cr.user_id IS NULL)
    `, [id, req.user.userId]);

    if (!rule) {
      return res.status(404).json({ error: 'Category rule not found' });
    }

    res.json({ rule });
  } catch (error) {
    console.error('Get category rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category rule
router.post('/', [
  authenticateToken,
  body('category_id').isInt().withMessage('Category ID is required'),
  body('keywords').trim().notEmpty().withMessage('Keywords are required'),
  body('priority').optional().isInt({ min: 0, max: 100 }).withMessage('Priority must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category_id, keywords, priority = 0 } = req.body;

    // Verify category exists and user has access
    const category = await getRow(
      'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [category_id, req.user.userId]
    );

    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const result = await runQuery(
      'INSERT INTO category_rules (user_id, category_id, keywords, priority) VALUES (?, ?, ?, ?)',
      [req.user.userId, category_id, keywords, priority]
    );

    const rule = await getRow(`
      SELECT 
        cr.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      WHERE cr.id = ?
    `, [result.id]);

    res.status(201).json({ 
      message: 'Category rule created successfully',
      rule 
    });
  } catch (error) {
    console.error('Create category rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update category rule
router.put('/:id', [
  authenticateToken,
  body('category_id').optional().isInt().withMessage('Category ID must be valid'),
  body('keywords').optional().trim().notEmpty().withMessage('Keywords cannot be empty'),
  body('priority').optional().isInt({ min: 0, max: 100 }).withMessage('Priority must be between 0 and 100'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { category_id, keywords, priority, is_active } = req.body;

    // Check if rule exists and user has access (own rules or global rules)
    const existingRule = await getRow(
      'SELECT * FROM category_rules WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [id, req.user.userId]
    );

    if (!existingRule) {
      return res.status(404).json({ error: 'Category rule not found or access denied' });
    }

    // Verify category if provided
    if (category_id) {
      const category = await getRow(
        'SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
        [category_id, req.user.userId]
      );

      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Build update data
    const updateData = {};
    if (category_id !== undefined) updateData.category_id = category_id;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    let updatedRuleId = id;

    // If this is a global rule (user_id IS NULL), create a user-specific copy instead of modifying the global rule
    if (existingRule.user_id === null) {
      // Create a new user-specific rule with the updated data
      const newRuleData = {
        user_id: req.user.userId,
        category_id: updateData.category_id || existingRule.category_id,
        keywords: updateData.keywords || existingRule.keywords,
        priority: updateData.priority || existingRule.priority,
        is_active: updateData.is_active !== undefined ? updateData.is_active : existingRule.is_active
      };

      const result = await runQuery(
        'INSERT INTO category_rules (user_id, category_id, keywords, priority, is_active) VALUES (?, ?, ?, ?, ?)',
        [newRuleData.user_id, newRuleData.category_id, newRuleData.keywords, newRuleData.priority, newRuleData.is_active]
      );

      updatedRuleId = result.id;
    } else {
      // Update existing user-specific rule
      const updates = [];
      const params = [];

      Object.entries(updateData).forEach(([key, value]) => {
        updates.push(`${key} = ?`);
        params.push(value);
      });

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await runQuery(`
        UPDATE category_rules 
        SET ${updates.join(', ')}
        WHERE id = ?
      `, params);
    }

    const rule = await getRow(`
      SELECT 
        cr.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM category_rules cr
      JOIN categories c ON cr.category_id = c.id
      WHERE cr.id = ?
    `, [updatedRuleId]);

    res.json({ 
      message: 'Category rule updated successfully',
      rule 
    });
  } catch (error) {
    console.error('Update category rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete category rule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if rule exists and user has access (own rules or global rules)
    const rule = await getRow(
      'SELECT * FROM category_rules WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [id, req.user.userId]
    );

    if (!rule) {
      return res.status(404).json({ error: 'Category rule not found or access denied' });
    }

    await runQuery('DELETE FROM category_rules WHERE id = ?', [id]);

    res.json({ message: 'Category rule deleted successfully' });
  } catch (error) {
    console.error('Delete category rule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as categoryRulesRoutes };