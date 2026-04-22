import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PRIVATE_SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PRIVATE_SUPABASE_SECRET_KEY');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getDefaultTenantId() {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No tenant found in the database.');
  }

  return data.id;
}
