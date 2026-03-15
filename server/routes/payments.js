const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWebhook } = require('./webhook');

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT p.*, c.name AS client_name, w.title AS workshop_title, w.date AS workshop_date FROM payments p JOIN registrations r ON p.registration_id = r.id JOIN clients c ON r.client_id = c.id JOIN workshops w ON r.workshop_id = w.id ORDER BY p.status DESC, w.date DESC').all();
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats/summary', (req, res) => {
  try {
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    const totalWorkshops = db.prepare('SELECT COUNT(*) as count FROM workshops').get().count;
    const upcomingWorkshops = db.prepare("SELECT COUNT(*) as count FROM workshops WHERE date >= date('now')").get().count;
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status='paid'").get().total;
    const pendingPayments = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status='pending'").get().count;
    const recentRegistrations = db.prepare('SELECT r.registered_at, c.name AS client_name, w.title AS workshop_title, w.type AS workshop_type, p.status AS payment_status FROM registrations r JOIN clients c ON r.client_id = c.id JOIN workshops w ON r.workshop_id = w.id LEFT JOIN payments p ON p.registration_id = r.id ORDER BY r.registered_at DESC LIMIT 10').all();
    res.json({ totalClients, totalWorkshops, upcomingWorkshops, totalRevenue, pendingPayments, recentRegistrations });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const { status, amount, amount_paid, notes } = req.body;
    const paid_at = status === 'paid' ? new Date().toISOString() : null;
    db.prepare('UPDATE payments SET status=?, amount=?, amount_paid=?, notes=?, paid_at=? WHERE id=?').run(status, amount, amount_paid || 0, notes||null, paid_at, req.params.id);
    const updated = db.prepare('SELECT p.*, c.name AS client_name, w.title AS workshop_title, w.date AS workshop_date FROM payments p JOIN registrations r ON p.registration_id = r.id JOIN clients c ON r.client_id = c.id JOIN workshops w ON r.workshop_id = w.id WHERE p.id=?').get(req.params.id);
    sendWebhook('payment', { action: 'updated', client_name: updated.client_name, workshop_title: updated.workshop_title, workshop_date: updated.workshop_date, amount: updated.amount, amount_paid: updated.amount_paid, status: updated.status, paid_at: updated.paid_at||'' });
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;