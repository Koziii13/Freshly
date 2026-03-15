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
    const { start, end } = req.query;
    
    // Helper function to get stats for a specific date range
    const getStats = (startDate, endDate) => {
      let conditions = { 
        created_client: "1=1",
        created_workshop: "1=1",
        workshop_date: "date >= date('now')", // default upcoming
        registered: "1=1",
        paid: "status='paid'",
        pending: "status='pending'"
      };

      if (startDate && endDate) {
        conditions.created_client = `date(created_at) BETWEEN date('${startDate}') AND date('${endDate}')`;
        conditions.created_workshop = `date(created_at) BETWEEN date('${startDate}') AND date('${endDate}')`;
        conditions.workshop_date = `date(date) BETWEEN date('${startDate}') AND date('${endDate}') AND date(date) >= date('now')`;
        conditions.registered = `date(registered_at) BETWEEN date('${startDate}') AND date('${endDate}')`;
        conditions.paid += ` AND date(COALESCE(paid_at, (SELECT registered_at FROM registrations WHERE id = registration_id))) BETWEEN date('${startDate}') AND date('${endDate}')`;
        conditions.pending += ` AND date((SELECT registered_at FROM registrations WHERE id = payments.registration_id)) BETWEEN date('${startDate}') AND date('${endDate}')`;
      }

      return {
        totalClients: db.prepare(`SELECT COUNT(*) as count FROM clients WHERE ${conditions.created_client}`).get().count,
        totalWorkshops: db.prepare(`SELECT COUNT(*) as count FROM workshops WHERE ${conditions.created_workshop}`).get().count,
        upcomingWorkshops: db.prepare(`SELECT COUNT(*) as count FROM workshops WHERE ${conditions.workshop_date}`).get().count,
        totalRevenue: db.prepare(`SELECT COALESCE(SUM(amount_paid), 0) + COALESCE(SUM(CASE WHEN amount_paid = 0 THEN amount END), 0) as total FROM payments WHERE ${conditions.paid}`).get().total,
        pendingPayments: db.prepare(`SELECT COUNT(*) as count FROM payments WHERE ${conditions.pending}`).get().count,
      };
    };

    const currentStats = getStats(start, end);

    // Calculate previous period if dates are provided
    let prevStats = null;
    if (start && end) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const dStart = new Date(start);
      const dEnd = new Date(end);
      const durationMs = dEnd.getTime() - dStart.getTime();
      
      const prevEnd = new Date(dStart.getTime() - msPerDay);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      
      prevStats = getStats(
        prevStart.toISOString().split('T')[0],
        prevEnd.toISOString().split('T')[0]
      );
    }

    // Helper to calculate percentage change
    const calcChange = (curr, prev) => {
      if (!prevStats) return null; // No comparison available
      if (prev === 0) return curr > 0 ? 100 : 0; // Avoid infinity
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const stats = {
      totalClients: { value: currentStats.totalClients, change: calcChange(currentStats.totalClients, prevStats?.totalClients) },
      totalWorkshops: { value: currentStats.totalWorkshops, change: calcChange(currentStats.totalWorkshops, prevStats?.totalWorkshops) },
      upcomingWorkshops: { value: currentStats.upcomingWorkshops, change: calcChange(currentStats.upcomingWorkshops, prevStats?.upcomingWorkshops) },
      totalRevenue: { value: currentStats.totalRevenue, change: calcChange(currentStats.totalRevenue, prevStats?.totalRevenue) },
      pendingPayments: { value: currentStats.pendingPayments, change: calcChange(currentStats.pendingPayments, prevStats?.pendingPayments) },
    };

    // Recent registrations don't need historical comparison, just the current list
    stats.recentRegistrations = db.prepare('SELECT r.registered_at, c.name AS client_name, w.title AS workshop_title, w.type AS workshop_type, p.status AS payment_status FROM registrations r JOIN clients c ON r.client_id = c.id JOIN workshops w ON r.workshop_id = w.id LEFT JOIN payments p ON p.registration_id = r.id ORDER BY r.registered_at DESC LIMIT 10').all();

    res.json(stats);
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