const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all registrations (with client + workshop info)
router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await db.from('registrations')
      .select(`
        *,
        clients(name, phone),
        workshops(title, date, type, price),
        payments(id, status, amount)
      `)
      .order('registered_at', { ascending: false });
      
    if (error) throw error;
    
    const formatted = rows.map(r => ({
      ...r,
      client_name: r.clients?.name,
      client_phone: r.clients?.phone,
      workshop_title: r.workshops?.title,
      workshop_date: r.workshops?.date,
      workshop_type: r.workshops?.type,
      workshop_price: r.workshops?.price,
      payment_status: r.payments && r.payments.length > 0 ? r.payments[0].status : null,
      payment_amount: r.payments && r.payments.length > 0 ? r.payments[0].amount : null,
      payment_id: r.payments && r.payments.length > 0 ? r.payments[0].id : null,
    }));
    
    res.json(formatted);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST create registration (and auto-create pending payment)
router.post('/', async (req, res) => {
  const { client_id, workshop_id } = req.body;
  if (!client_id || !workshop_id) return res.status(400).json({ error: 'client_id and workshop_id required' });

  try {
    // Check capacity
    const { data: workshop, error: wErr } = await db.from('workshops').select('*').eq('id', workshop_id).single();
    if (wErr || !workshop) return res.status(404).json({ error: 'Workshop not found' });
    
    const { count, error: countErr } = await db.from('registrations').select('*', { count: 'exact', head: true }).eq('workshop_id', workshop_id);
    if (countErr) throw countErr;
    if (count >= workshop.capacity) return res.status(400).json({ error: 'Workshop is full' });

    // Insert registration
    const { data: reg, error: regErr } = await db.from('registrations')
      .insert([{ client_id, workshop_id }])
      .select().single();
      
    if (regErr) {
      if (regErr.code === '23505') return res.status(400).json({ error: 'Client already registered for this workshop' }); // Unique violation
      throw regErr;
    }

    // Auto-create a pending payment record
    const { error: payErr } = await db.from('payments')
      .insert([{ registration_id: reg.id, amount: workshop.price, status: 'pending' }]);
    if (payErr) console.error("Failed to create pending payment:", payErr);

    // Webhook push to Google Sheets (fire and forget)
    const { data: setting } = await db.from('settings').select('value').eq('key', 'webhook_url').single();
    if (setting && setting.value) {
      const { data: client } = await db.from('clients').select('*').eq('id', client_id).single();
      if (client) {
        fetch(setting.value, {
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
    }

    res.json({ success: true, id: reg.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE registration
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await db.from('registrations').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
