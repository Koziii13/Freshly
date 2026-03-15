const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all registrations (with client + workshop info)
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, c.name AS client_name, c.phone AS client_phone,
           w.title AS workshop_title, w.date AS workshop_date, w.type AS workshop_type, w.price AS workshop_price,
           p.status AS payment_status, p.amount AS payment_amount, p.id AS payment_id
    FROM registrations r
    JOIN clients c ON r.client_id = c.id
    JOIN workshops w ON r.workshop_id = w.id
    LEFT JOIN payments p ON p.registration_id = r.id
    ORDER BY r.registered_at DESC
  `).all();
  res.json(rows);
});

// POST create registration (and auto-create pending payment)
router.post('/', (req, res) => {
  const { client_id, workshop_id } = req.body;
  if (!client_id || !workshop_id) return res.status(400).json({ error: 'client_id and workshop_id required' });

  // Check capacity
  const workshop = db.prepare('SELECT * FROM workshops WHERE id=?').get(workshop_id);
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' });
  const count = db.prepare('SELECT COUNT(*) as cnt FROM registrations WHERE workshop_id=?').get(workshop_id);
  if (count.cnt >= workshop.capacity) return res.status(400).json({ error: 'Workshop is full' });

  try {
    const reg = db.prepare('INSERT INTO registrations (client_id, workshop_id) VALUES (?, ?)').run(client_id, workshop_id);
    // Auto-create a pending payment record
    db.prepare('INSERT INTO payments (registration_id, amount, status) VALUES (?, ?, ?)').run(reg.lastInsertRowid, workshop.price, 'pending');

    // Webhook push to Google Sheets (fire and forget)
    const webhook = db.prepare('SELECT value FROM settings WHERE key=?').get('webhook_url')?.value;
    if (webhook) {
      const client = db.prepare('SELECT * FROM clients WHERE id=?').get(client_id);
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          client_name: client.name,
          client_phone: client.phone || '',
          workshop_title: workshop.title,
          workshop_date: workshop.date,
          price: workshop.price
        })
      }).catch(err => console.error('Webhook payload failed:', err));
    }

    res.json({ success: true, id: reg.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Client already registered for this workshop' });
    throw e;
  }
});

// DELETE registration
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM registrations WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
