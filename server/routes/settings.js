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

module.exports = router;
