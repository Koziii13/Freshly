const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWebhook } = require('./webhook');

router.get('/', (req, res) => {
  try {
    const { q } = req.query;
    let rows;
    if (q) {
      rows = db.prepare('SELECT * FROM clients WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY name').all('%'+q+'%','%'+q+'%','%'+q+'%');
    } else {
      rows = db.prepare('SELECT * FROM clients ORDER BY name').all();
    }
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) return res.status(404).json({ error: 'Not found' });
    const registrations = db.prepare('SELECT r.*, w.title AS workshop_title, w.date AS workshop_date, w.type AS workshop_type, p.status AS payment_status, p.amount AS payment_amount FROM registrations r JOIN workshops w ON r.workshop_id = w.id LEFT JOIN payments p ON p.registration_id = r.id WHERE r.client_id = ? ORDER BY w.date DESC').all(req.params.id);
    res.json({ ...client, registrations });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = db.prepare('INSERT INTO clients (name, phone, email, notes) VALUES (?, ?, ?, ?)').run(name, phone||null, email||null, notes||null);
    const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
    sendWebhook('client', { action: 'new', name: newClient.name, phone: newClient.phone||'', email: newClient.email||'', notes: newClient.notes||'', date: newClient.created_at });
    res.json(newClient);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;
    db.prepare('UPDATE clients SET name=?, phone=?, email=?, notes=? WHERE id=?').run(name, phone||null, email||null, notes||null, req.params.id);
    const updated = db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id);
    sendWebhook('client', { action: 'updated', name: updated.name, phone: updated.phone||'', email: updated.email||'', notes: updated.notes||'', date: updated.created_at });
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM clients WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;