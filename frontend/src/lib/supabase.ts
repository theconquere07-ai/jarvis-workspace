import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://eziyjpfbpbgpnqtzkdwy.supabase.co';
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6aXlqcGZicGJncG5xdHprZHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNDIxNjksImV4cCI6MjEwNjgxODE2OX0.DAKpYiUtNrVa2hHAEUI3ARMTKYpTbRpg1bZx-kMj3Lo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
