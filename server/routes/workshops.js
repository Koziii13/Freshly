const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWebhook } = require('./webhook');

router.get('/', async (req, res) => {
  try {
    const { data: rows, error } = await db.from('workshops').select('*').order('date', { ascending: false });
    if (error) throw error;

    // Fetch registration counts for all workshops in one query
    const { data: regCounts, error: regErr } = await db
      .from('registrations')
      .select('workshop_id');
    if (regErr) throw regErr;

    // Map count per workshop_id
    const countMap = {};
    (regCounts || []).forEach(r => {
      countMap[r.workshop_id] = (countMap[r.workshop_id] || 0) + 1;
    });

    // Attach registered count to each workshop
    const workshopsWithCount = rows.map(w => ({
      ...w,
      registered: countMap[w.id] || 0
    }));

    res.json(workshopsWithCount);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: workshop, error: workshopErr } = await db.from('workshops').select('*').eq('id', req.params.id).single();
    if (workshopErr || !workshop) return res.status(404).json({ error: 'Not found' });
    
    // Join registrations with clients and payments
    const { data: registrations, error: regErr } = await db.from('registrations')
      .select(`
        *,
        clients(name, phone),
        payments(status, amount)
      `)
      .eq('workshop_id', req.params.id);
      
    if (regErr) throw regErr;
    
    const formattedRegs = registrations.map(r => ({
      ...r,
      client_name: r.clients?.name,
      client_phone: r.clients?.phone,
      payment_status: r.payments && r.payments.length > 0 ? r.payments[0].status : null,
      payment_amount: r.payments && r.payments.length > 0 ? r.payments[0].amount : null
    }));
    
    res.json({ ...workshop, registrations: formattedRegs });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, type, date, time, capacity, price, instructor, notes } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
    
    const { data: newW, error } = await db.from('workshops')
      .insert([{ title, type: type||'other', date, time: time||null, capacity: capacity||20, price: price||0, instructor: instructor||null, notes: notes||null }])
      .select().single();
      
    if (error) throw error;
    
    sendWebhook('workshop', { action: 'new', title: newW.title, type: newW.type, date: newW.date, capacity: newW.capacity, price: newW.price, instructor: newW.instructor||'' });
    res.json(newW);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, type, date, time, capacity, price, instructor, notes } = req.body;
    
    const { data: updated, error } = await db.from('workshops')
      .update({ title, type: type||'other', date, time: time||null, capacity: capacity||20, price: price||0, instructor: instructor||null, notes: notes||null })
      .eq('id', req.params.id)
      .select().single();
      
    if (error) throw error;
    
    sendWebhook('workshop', { action: 'updated', title: updated.title, type: updated.type, date: updated.date, capacity: updated.capacity, price: updated.price, instructor: updated.instructor||'' });
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await db.from('workshops').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;