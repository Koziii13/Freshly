const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWebhook } = require('./webhook');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM workshops ORDER BY date DESC').all();
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const workshop = db.prepare('SELECT * FROM workshops WHERE id=?').get(req.params.id);
    if (!workshop) return res.status(404).json({ error: 'Not found' });
    const registrations = db.prepare('SELECT r.*, c.name AS client_name, c.phone AS client_phone, p.status AS payment_status, p.amount AS payment_amount FROM registrations r JOIN clients c ON r.client_id = c.id LEFT JOIN payments p ON p.registration_id = r.id WHERE r.workshop_id = ?').all(req.params.id);
    res.json({ ...workshop, registrations });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', (req, res) => {
  try {
    const { title, type, date, time, capacity, price, instructor, notes } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
    const result = db.prepare('INSERT INTO workshops (title, type, date, time, capacity, price, instructor, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      title, type||'other', date, time||null, capacity||20, price||0, instructor||null, notes||null
    );
    const newW = db.prepare('SELECT * FROM workshops WHERE id=?').get(result.lastInsertRowid);
    sendWebhook('workshop', { action: 'new', title: newW.title, type: newW.type, date: newW.date, capacity: newW.capacity, price: newW.price, instructor: newW.instructor||'' });
    res.json(newW);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { title, type, date, time, capacity, price, instructor, notes } = req.body;
    db.prepare('UPDATE workshops SET title=?, type=?, date=?, time=?, capacity=?, price=?, instructor=?, notes=? WHERE id=?').run(
      title, type||'other', date, time||null, capacity||20, price||0, instructor||null, notes||null, req.params.id
    );
    const updated = db.prepare('SELECT * FROM workshops WHERE id=?').get(req.params.id);
    sendWebhook('workshop', { action: 'updated', title: updated.title, type: updated.type, date: updated.date, capacity: updated.capacity, price: updated.price, instructor: updated.instructor||'' });
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM workshops WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;