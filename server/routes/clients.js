const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendWebhook } = require('./webhook');

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = db.from('clients').select('*').order('name');
    
    if (q) {
      query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
    }
    
    const { data: rows, error } = await query;
    if (error) throw error;
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: client, error: clientErr } = await db.from('clients').select('*').eq('id', req.params.id).single();
    if (clientErr || !client) return res.status(404).json({ error: 'Not found' });
    
    // For registrations, we need to join workshops and payments. 
    // Supabase allows joins if foreign keys are set up.
    // In our schema: registrations -> workshops (workshop_id), payments -> registrations (registration_id)
    const { data: registrations, error: regErr } = await db.from('registrations')
      .select(`
        *,
        workshops(title, date, type),
        payments(status, amount)
      `)
      .eq('client_id', req.params.id)
      .order('registered_at', { ascending: false });
      
    if (regErr) throw regErr;
    
    // Map the Supabase joined format to the flat format the frontend expects
    const formattedRegs = registrations.map(r => ({
      ...r,
      workshop_title: r.workshops?.title,
      workshop_date: r.workshops?.date,
      workshop_type: r.workshops?.type,
      payment_status: r.payments && r.payments.length > 0 ? r.payments[0].status : null,
      payment_amount: r.payments && r.payments.length > 0 ? r.payments[0].amount : null
    }));
    
    res.json({ ...client, registrations: formattedRegs });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const { data: newClient, error } = await db.from('clients')
      .insert([{ name, phone: phone||null, email: email||null, notes: notes||null }])
      .select().single();
      
    if (error) throw error;
    
    sendWebhook('client', { action: 'new', name: newClient.name, phone: newClient.phone||'', email: newClient.email||'', notes: newClient.notes||'', date: newClient.created_at });
    res.json(newClient);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, notes } = req.body;
    const { data: updated, error } = await db.from('clients')
      .update({ name, phone: phone||null, email: email||null, notes: notes||null })
      .eq('id', req.params.id)
      .select().single();
      
    if (error) throw error;
    
    sendWebhook('client', { action: 'updated', name: updated.name, phone: updated.phone||'', email: updated.email||'', notes: updated.notes||'', date: updated.created_at });
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await db.from('clients').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;