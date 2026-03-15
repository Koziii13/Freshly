-- Run this in your Supabase SQL Editor to allow the app to read and write data.
-- This disables Row Level Security (RLS) on all tables used by the Workshop Manager.

ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
