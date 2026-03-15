const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWebhook } = require('./webhook');

// GET all payments
router.get('/', async (req, res) => {
  try {
    // Step 1: Get all payments
    const { data: payments, error: payErr } = await db.from('payments').select('*');
    if (payErr) throw payErr;
    if (!payments || payments.length === 0) return res.json([]);

    // Step 2: Get all registrations for those payment records
    const regIds = [...new Set(payments.map(p => p.registration_id))];
    const { data: regs, error: regErr } = await db.from('registrations').select('*').in('id', regIds);
    if (regErr) throw regErr;

    // Step 3: Get clients and workshops for those registrations
    const clientIds = [...new Set(regs.map(r => r.client_id))];
    const workshopIds = [...new Set(regs.map(r => r.workshop_id))];

    const [{ data: clients }, { data: workshops }] = await Promise.all([
      db.from('clients').select('id, name').in('id', clientIds),
      db.from('workshops').select('id, title, date').in('id', workshopIds),
    ]);

    // Step 4: Build lookup maps
    const regMap = Object.fromEntries((regs || []).map(r => [r.id, r]));
    const clientMap = Object.fromEntries((clients || []).map(c => [c.id, c]));
    const workshopMap = Object.fromEntries((workshops || []).map(w => [w.id, w]));

    // Step 5: Assemble the result
    const formatted = payments
      .map(p => {
        const reg = regMap[p.registration_id];
        const client = reg ? clientMap[reg.client_id] : null;
        const workshop = reg ? workshopMap[reg.workshop_id] : null;
        return {
          ...p,
          client_name: client?.name || null,
          workshop_title: workshop?.title || null,
          workshop_date: workshop?.date || null,
        };
      })
      .sort((a, b) => {
        if (a.status !== b.status) return b.status.localeCompare(a.status);
        if (a.workshop_date && b.workshop_date) return new Date(b.workshop_date) - new Date(a.workshop_date);
        return 0;
      });

    res.json(formatted);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { start, end } = req.query;
    const now = new Date().toISOString().split('T')[0];
    
    // Helper function to get stats for a specific date range
    const getStats = async (startDate, endDate) => {
      let qClients = db.from('clients').select('*', { count: 'exact', head: true });
      let qWshops = db.from('workshops').select('*', { count: 'exact', head: true });
      let qUpcoming = db.from('workshops').select('*', { count: 'exact', head: true }).gte('date', now);
      
      let qPending = db.from('payments').select('*, registrations!inner(registered_at)', { count: 'exact', head: true }).eq('status', 'pending');
      let qPaid = db.from('payments').select('amount_paid, amount, paid_at, registrations!inner(registered_at)').eq('status', 'paid');

      if (startDate && endDate) {
        // Appending time to include full days
        const startTs = `${startDate}T00:00:00.000Z`;
        const endTs = `${endDate}T23:59:59.999Z`;

        qClients = qClients.gte('created_at', startTs).lte('created_at', endTs);
        qWshops = qWshops.gte('created_at', startTs).lte('created_at', endTs);
        qUpcoming = qUpcoming.gte('date', startDate).lte('date', endDate);
        
        // Filter pending by registration date
        qPending = qPending.gte('registrations.registered_at', startTs).lte('registrations.registered_at', endTs);
      }

      const [cRes, wRes, uRes, pRes, paidRes] = await Promise.all([qClients, qWshops, qUpcoming, qPending, qPaid]);
      
      // Calculate revenue
      let totalRev = 0;
      if (paidRes.data) {
        paidRes.data.forEach(p => {
          let dateToUse = p.paid_at || p.registrations?.registered_at;
          
          let isValidDate = true;
          if (startDate && endDate && dateToUse) {
            const dateStr = dateToUse.split('T')[0];
            if (dateStr < startDate || dateStr > endDate) isValidDate = false;
          }
          
          if (isValidDate) {
            totalRev += (p.amount_paid || p.amount || 0);
          }
        });
      }

      return {
        totalClients: cRes.count || 0,
        totalWorkshops: wRes.count || 0,
        upcomingWorkshops: uRes.count || 0,
        totalRevenue: totalRev,
        pendingPayments: pRes.count || 0,
      };
    };

    const currentStats = await getStats(start, end);

    // Calculate previous period if dates are provided
    let prevStats = null;
    if (start && end) {
      const msPerDay = 24 * 60 * 60 * 1000;
      const dStart = new Date(start);
      const dEnd = new Date(end);
      const durationMs = dEnd.getTime() - dStart.getTime();
      
      const prevEnd = new Date(dStart.getTime() - msPerDay);
      const prevStart = new Date(prevEnd.getTime() - durationMs);
      
      prevStats = await getStats(
        prevStart.toISOString().split('T')[0],
        prevEnd.toISOString().split('T')[0]
      );
    }

    const calcChange = (curr, prev) => {
      if (!prevStats) return null;
      if (prev === 0) return curr > 0 ? 100 : 0;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const stats = {
      totalClients: { value: currentStats.totalClients, change: calcChange(currentStats.totalClients, prevStats?.totalClients) },
      totalWorkshops: { value: currentStats.totalWorkshops, change: calcChange(currentStats.totalWorkshops, prevStats?.totalWorkshops) },
      upcomingWorkshops: { value: currentStats.upcomingWorkshops, change: calcChange(currentStats.upcomingWorkshops, prevStats?.upcomingWorkshops) },
      totalRevenue: { value: currentStats.totalRevenue, change: calcChange(currentStats.totalRevenue, prevStats?.totalRevenue) },
      pendingPayments: { value: currentStats.pendingPayments, change: calcChange(currentStats.pendingPayments, prevStats?.pendingPayments) },
    };

    // Recent registrations
    const { data: recents } = await db.from('registrations')
      .select(`
        registered_at,
        clients (name),
        workshops (title, type),
        payments (status)
      `)
      .order('registered_at', { ascending: false })
      .limit(10);

    stats.recentRegistrations = (recents || []).map(r => ({
      registered_at: r.registered_at,
      client_name: r.clients?.name,
      workshop_title: r.workshops?.title,
      workshop_type: r.workshops?.type,
      payment_status: r.payments && r.payments.length > 0 ? r.payments[0].status : null
    }));

    res.json(stats);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, amount, amount_paid, notes } = req.body;
    const paid_at = status === 'paid' ? new Date().toISOString() : null;
    
    // Update the payment
    const { data: updated, error } = await db.from('payments')
      .update({ status, amount, amount_paid: amount_paid || 0, notes: notes||null, paid_at })
      .eq('id', req.params.id)
      .select().single();
      
    if (error) throw error;
    
    // To send webhook, we need the joined data (client name, workshop title)
    const { data: fullData } = await db.from('payments')
      .select(`
        *,
        registrations!inner (
          clients (name),
          workshops (title, date)
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (fullData) {
      const client_name = fullData.registrations?.clients?.name;
      const workshop_title = fullData.registrations?.workshops?.title;
      const workshop_date = fullData.registrations?.workshops?.date;
      
      sendWebhook('payment', { 
        action: 'updated', 
        client_name, 
        workshop_title, 
        workshop_date, 
        amount: updated.amount, 
        amount_paid: updated.amount_paid, 
        status: updated.status, 
        paid_at: updated.paid_at||'' 
      });
      
      res.json({
        ...updated,
        client_name,
        workshop_title,
        workshop_date
      });
    } else {
      res.json(updated);
    }
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;