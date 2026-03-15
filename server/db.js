require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use env vars if available (dev mode), otherwise fall back to hardcoded values (packaged app)
const supabaseUrl = process.env.SUPABASE_URL || 'https://qlekgbdiwcajqbvnmytp.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZWtnYmRpd2NhanFidm5teXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDU5NTEsImV4cCI6MjA4OTE4MTk1MX0.Trf8_Hpy-1stAnTAPlMbNxZ7pxIL6RplKVDrQcbnmpg';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

