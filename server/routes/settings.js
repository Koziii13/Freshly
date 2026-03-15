const express = require('express');
const router = express.Router();
const db = require('../db');

// GET settings (webhook_url)
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  rows.forEach(r => settings[r.key] = r.value);
  res.json(settings);
});

// POST update webhook_url
router.post('/webhook', (req, res) => {
  const { url } = req.body;
  db.prepare('UPDATE settings SET value=? WHERE key=?').run(url || '', 'webhook_url');
  res.json({ success: true, webhook_url: url });
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

module.exports = router;
