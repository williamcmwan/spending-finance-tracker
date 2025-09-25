import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import speakeasy from 'speakeasy';
import { getRow, runQuery } from '../database/init.js';

const router = express.Router();

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await getRow('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await runQuery(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.id,
        email,
        name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await getRow('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If TOTP is enabled, return temp token for second factor
    if (user.totp_enabled) {
      const tempToken = jwt.sign(
        { userId: user.id, email: user.email, stage: '2fa' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '10m' }
      );

      return res.json({ requires2fa: true, tempToken });
    }

    // Generate final JWT token (no 2FA required)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove Google OAuth routes entirely

// 2FA: verify TOTP for login (second step)
router.post('/login/verify-totp', [
  body('tempToken').notEmpty(),
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tempToken, code } = req.body;
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (decoded.stage !== '2fa') {
      return res.status(400).json({ error: 'Invalid token stage' });
    }

    const user = await getRow('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!user || !user.totp_enabled || !user.totp_secret) {
      return res.status(400).json({ error: '2FA not enabled for user' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2FA: setup secret (requires auth)
router.post('/totp/setup', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.replace('Bearer ', '');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await getRow('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = speakeasy.generateSecret({
      name: `FinanceTracker (${user.email})`
    });

    await runQuery('UPDATE users SET totp_secret = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [secret.base32, user.id]);

    return res.json({
      otpauth_url: secret.otpauth_url,
      secret: secret.base32
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2FA: enable after verifying code (requires auth)
router.post('/totp/enable', [
  body('code').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.replace('Bearer ', '');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { code } = req.body;
    const user = await getRow('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!user || !user.totp_secret) {
      return res.status(400).json({ error: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    await runQuery('UPDATE users SET totp_enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    return res.json({ message: '2FA enabled' });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await getRow('SELECT id, email, name, created_at, COALESCE(totp_enabled, 0) as totp_enabled FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export { router as authRoutes };
