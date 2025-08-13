import express from 'express';
import jwt from 'jsonwebtoken';
import { getRow, getRows } from '../database/init.js';

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

// Get spending summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.userId];

    if (start_date) {
      whereClause += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND date <= ?';
      params.push(end_date);
    }

    // Get total income and expenses
    const summary = await getRow(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        COUNT(*) as total_transactions
      FROM transactions 
      ${whereClause}
    `, params);

    // Calculate net amount
    const netAmount = (summary.total_income || 0) - (summary.total_expenses || 0);

    res.json({
      summary: {
        total_income: summary.total_income || 0,
        total_expenses: summary.total_expenses || 0,
        net_amount: netAmount,
        total_transactions: summary.total_transactions || 0
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get spending by category
router.get('/by-category', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, type = 'expense' } = req.query;
    
    let whereClause = 'WHERE t.user_id = ? AND t.type = ?';
    let params = [req.user.userId, type];

    if (start_date) {
      whereClause += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND t.date <= ?';
      params.push(end_date);
    }

    const categorySpending = await getRows(`
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total_amount DESC
    `, params);

    res.json({ categorySpending });
  } catch (error) {
    console.error('Get category spending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly spending trends
router.get('/monthly-trends', authenticateToken, async (req, res) => {
  try {
    const { year = new Date().getFullYear(), type = 'expense' } = req.query;
    
    const monthlyTrends = await getRows(`
      SELECT 
        strftime('%m', date) as month,
        strftime('%Y', date) as year,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE user_id = ? AND type = ? AND strftime('%Y', date) = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY year, month
    `, [req.user.userId, type, year]);

    res.json({ monthlyTrends });
  } catch (error) {
    console.error('Get monthly trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent transactions
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentTransactions = await getRows(`
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT ?
    `, [req.user.userId, parseInt(limit)]);

    res.json({ recentTransactions });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get spending insights
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let whereClause = 'WHERE user_id = ?';
    let params = [req.user.userId];

    if (start_date) {
      whereClause += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND date <= ?';
      params.push(end_date);
    }

    // Get top spending category
    const topCategory = await getRow(`
      SELECT 
        c.name,
        c.color,
        SUM(t.amount) as total_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause} AND t.type = 'expense'
      GROUP BY c.id, c.name, c.color
      ORDER BY total_amount DESC
      LIMIT 1
    `, params);

    // Get average daily spending
    const avgDailySpending = await getRow(`
      SELECT 
        AVG(daily_total) as avg_daily_spending
      FROM (
        SELECT 
          date,
          SUM(amount) as daily_total
        FROM transactions 
        ${whereClause} AND type = 'expense'
        GROUP BY date
      )
    `, params);

    // Get days since last transaction
    const lastTransaction = await getRow(`
      SELECT 
        date,
        julianday('now') - julianday(date) as days_ago
      FROM transactions 
      ${whereClause}
      ORDER BY date DESC
      LIMIT 1
    `, params);

    res.json({
      insights: {
        topCategory: topCategory || null,
        avgDailySpending: avgDailySpending?.avg_daily_spending || 0,
        daysSinceLastTransaction: lastTransaction?.days_ago || 0
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as analyticsRoutes };
