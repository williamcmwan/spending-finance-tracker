import express from 'express';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { getRow, runQuery } from '../database/init.js';

const router = express.Router();

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

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    let settings = await getRow('SELECT base_currency, extra_currencies FROM user_settings WHERE user_id = ?', [userId]);
    if (!settings) {
      await runQuery('INSERT INTO user_settings (user_id, base_currency, extra_currencies) VALUES (?, ?, ?)', [userId, 'USD', '[]']);
      settings = { base_currency: 'USD', extra_currencies: '[]' };
    }
    const extra = JSON.parse(settings.extra_currencies || '[]');
    res.json({ base_currency: settings.base_currency || 'USD', extra_currencies: extra });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { base_currency = 'USD', extra_currencies = [] } = req.body;
    await runQuery(
      'INSERT INTO user_settings (user_id, base_currency, extra_currencies) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET base_currency = excluded.base_currency, extra_currencies = excluded.extra_currencies, updated_at = CURRENT_TIMESTAMP',
      [userId, (base_currency || 'USD').toUpperCase(), JSON.stringify((extra_currencies || []).map((c) => c.toUpperCase()))]
    );
    res.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function fetchExchangeRateAPI(from, to) {
  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
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
          change: 0, // This API doesn't provide change data
          changePercent: 0,
          lastUpdate: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
          source: 'ExchangeRate-API'
        };
      }
    }
  } catch (error) {
    console.error('ExchangeRate-API error:', error);
  }
  return null;
}

async function fetchFreeCurrencyAPI(from, to) {
  try {
    // Using freeforexapi.com as another option
    const url = `https://api.freeforexapi.com/api/live?pairs=${encodeURIComponent(from)}${encodeURIComponent(to)}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SpendingTrackerBot/1.0)'
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      const pairKey = `${from}${to}`;
      const pairData = data?.rates?.[pairKey];
      const rate = pairData?.rate;

      if (typeof rate === 'number') {
        return {
          rate: rate,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date().toISOString(),
          source: 'FreeForexAPI'
        };
      }
    }
  } catch (error) {
    console.error('FreeForexAPI error:', error);
  }
  return null;
}

async function fetchYahooRate(from, to) {
  // Try multiple sources in order of preference
  let result = await fetchExchangeRateAPI(from, to);
  if (result) return result;

  result = await fetchFreeCurrencyAPI(from, to);
  if (result) return result;

  return null;
}

async function fetchYahooBatchRates(base, extras) {
  // For batch requests, try exchangerate-api.com first
  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(base)}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SpendingTrackerBot/1.0)'
      }
    });

    if (resp.ok) {
      const data = await resp.json();
      const rates = data?.rates || {};
      const result = {};

      for (const currency of extras) {
        const rate = rates[currency];
        if (typeof rate === 'number') {
          result[currency] = {
            rate: 1 / rate, // Convert from base->currency to currency->base
            change: 0,
            changePercent: 0,
            lastUpdate: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
            source: 'ExchangeRate-API'
          };
        }
      }
      return result;
    }
  } catch (error) {
    console.error('ExchangeRate-API batch error:', error);
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
      change: 0,
      changePercent: 0,
      lastUpdate: new Date().toISOString(),
      source: 'ExchangeRate.host'
    } : null;
  } catch {
    return null;
  }
}

async function fetchBatchRates(base, extras) {
  // Try exchangerate.host batch as fallback
  try {
    const url = `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(extras.join(','))}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const rates = data?.rates || {};
      const result = {};
      for (const cur of extras) {
        const rate = typeof rates[cur] === 'number' ? rates[cur] : null;
        if (rate) {
          result[cur] = {
            rate: rate,
            change: 0,
            changePercent: 0,
            lastUpdate: new Date().toISOString(),
            source: 'ExchangeRate.host'
          };
        }
      }
      return result;
    }
  } catch { }
  return null;
}

router.get('/rates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    let settings = await getRow('SELECT base_currency, extra_currencies FROM user_settings WHERE user_id = ?', [userId]);
    if (!settings) {
      settings = { base_currency: 'USD', extra_currencies: '[]' };
    }
    const base = (settings.base_currency || 'USD').toUpperCase();
    const extras = JSON.parse(settings.extra_currencies || '[]');

    const results = [];

    // Try Yahoo Finance batch first (primary source)
    const yahooBatch = await fetchYahooBatchRates(base, extras);

    for (const cur of extras) {
      const from = cur.toUpperCase();
      if (from === base) {
        results.push({
          currency: from,
          rate: 1,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date().toISOString(),
          source: 'Base Currency'
        });
        continue;
      }

      let rateData = null;

      // Check if we got this rate from Yahoo batch
      if (yahooBatch && yahooBatch[from]) {
        rateData = yahooBatch[from];
      } else {
        // Try individual Yahoo Finance call
        rateData = await fetchYahooRate(from, base);

        // Fallback to exchangerate.host
        if (!rateData) {
          rateData = await fetchFallbackRate(from, base);
        }
      }

      results.push({
        currency: from,
        rate: rateData?.rate ?? null,
        change: rateData?.change ?? 0,
        changePercent: rateData?.changePercent ?? 0,
        lastUpdate: rateData?.lastUpdate ?? null,
        source: rateData?.source ?? 'Unknown'
      });
    }

    res.json({
      base_currency: base,
      rates: results,
      lastFetched: new Date().toISOString()
    });
  } catch (error) {
    console.error('Rates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as settingsRoutes };


