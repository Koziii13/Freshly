const express = require('express');
const router = express.Router();
const db = require('../db');

// GET settings (webhook_url)
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await db.from('settings').select('*');
    if (error) throw error;
    
    const settings = {};
    if (rows) {
      rows.forEach(r => settings[r.key] = r.value);
    }
    res.json(settings);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST update webhook_url
router.post('/webhook', async (req, res) => {
  const { url } = req.body;
  try {
    const { error } = await db.from('settings').upsert({ key: 'webhook_url', value: url || '' });
    if (error) throw error;
    res.json({ success: true, webhook_url: url });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
// POST test webhook (runs from Node to bypass client CORS)
router.post('/test-webhook', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, msg: 'No URL provided' });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Send as plain text to avoid preflight
      redirect: 'follow', // Follow Google Script redirects
      body: JSON.stringify({
        type: 'test',
        date: new Date().toISOString().split('T')[0],
        client_name: 'Test Setup Request',
        client_phone: '01012345678',
        workshop_title: 'Connection Verification',
        workshop_date: '2026-04-01',
        price: 500
      })
    });
    
    // Google Script typically returns 200 with JSON payload indicating success/error
    if (response.ok) {
      try {
        const scriptData = await response.json();
        if (scriptData.status === 'success') {
          res.json({ success: true });
        } else {
          res.status(400).json({ success: false, msg: `Script Error: ${scriptData.message}` });
        }
      } catch (jsonErr) {
        // Fallback if it didn't return JSON
        res.json({ success: true, warning: 'Connected, but script did not return JSON. Check sheet.' });
      }
    } else {
      res.status(502).json({ success: false, msg: `Script returned HTTP ${response.status}` });
    }
  } catch (error) {
    console.error('Test Webhook Error:', error);
    res.status(500).json({ success: false, msg: error.message || 'Failed to ping webhook' });
  }
});

// GET database path
router.get('/db-path', (req, res) => {
  const configManager = require('../config');
  const config = configManager.getConfig();
  res.json({ success: true, dbPath: config.dbPath || '' });
});

// POST update database path
router.post('/db-path', (req, res) => {
  const { dbPath } = req.body;
  const configManager = require('../config');
  
  if (configManager.setConfig({ dbPath: dbPath || '' })) {
    res.json({ success: true, dbPath: dbPath || '', msg: 'Database path saved successfully. Restart the application to load the new database or see the changes.' });
  } else {
    res.status(500).json({ success: false, msg: 'Failed to save database configuration file.' });
  }
});

module.exports = router;
