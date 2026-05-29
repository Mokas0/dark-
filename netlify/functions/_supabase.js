import { createClient } from '@supabase/supabase-js';

export function serverClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function ok(body) {
  return { statusCode: 200, body: JSON.stringify(body) };
}

export function bad(status, message) {
  return { statusCode: status, body: JSON.stringify({ error: message }) };
}
