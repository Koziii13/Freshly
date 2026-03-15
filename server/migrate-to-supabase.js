const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 1. Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE config. Migration aborted.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize temporary SQLite connection
const configManager = require('./config');
const appConfig = configManager.getConfig();
let dataDir;
if (appConfig.dbPath && appConfig.dbPath.trim() !== '') {
  dataDir = appConfig.dbPath;
} else {
  dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
}
const dbFile = fs.existsSync(dataDir) ? path.join(dataDir, 'workshop.sqlite') : 'workshop.sqlite';

if (!fs.existsSync(dbFile)) {
  console.log("No local workshop.sqlite found to migrate. Skipping migration.");
  process.exit(0);
}

const sqlite = new Database(dbFile);

async function migrate() {
  console.log("Starting database migration to Supabase...");
  
  try {
    // Migrate Clients
    console.log("Migrating clients...");
    const clients = sqlite.prepare("SELECT * FROM clients").all();
    if (clients.length > 0) {
      const { error } = await supabase.from('clients').upsert(clients.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        created_at: c.created_at + '+00:00'
      })));
      if (error) throw error;
    }

    // Migrate Workshops
    console.log("Migrating workshops...");
    const workshops = sqlite.prepare("SELECT * FROM workshops").all();
    if (workshops.length > 0) {
      const { error } = await supabase.from('workshops').upsert(workshops.map(w => ({
        id: w.id,
        title: w.title,
        type: w.type,
        date: w.date,
        time: w.time,
        capacity: w.capacity,
        price: w.price,
        instructor: w.instructor,
        notes: w.notes,
        created_at: w.created_at + '+00:00'
      })));
      if (error) throw error;
    }

    // Migrate Registrations
    console.log("Migrating registrations...");
    const registrations = sqlite.prepare("SELECT * FROM registrations").all();
    if (registrations.length > 0) {
      const { error } = await supabase.from('registrations').upsert(registrations.map(r => ({
        id: r.id,
        client_id: r.client_id,
        workshop_id: r.workshop_id,
        registered_at: r.registered_at + '+00:00'
      })));
      if (error) throw error;
    }

    // Migrate Payments
    console.log("Migrating payments...");
    const payments = sqlite.prepare("SELECT * FROM payments").all();
    if (payments.length > 0) {
      const { error } = await supabase.from('payments').upsert(payments.map(p => ({
        id: p.id,
        registration_id: p.registration_id,
        amount: p.amount,
        amount_paid: p.amount_paid,
        status: p.status,
        paid_at: p.paid_at ? p.paid_at + '+00:00' : null,
        notes: p.notes
      })));
      if (error) throw error;
    }

    // Migrate Settings (Webhook)
    console.log("Migrating settings...");
    const settings = sqlite.prepare("SELECT * FROM settings").all();
    if (settings.length > 0) {
      const { error } = await supabase.from('settings').upsert(settings);
      if (error) throw error;
    }

    console.log("Migration completed successfully!");

  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
