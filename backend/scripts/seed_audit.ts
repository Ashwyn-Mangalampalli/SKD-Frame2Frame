import { supabase, getDefaultTenantId } from '../src/DB/supabase';

async function seedDeepAudit() {
  console.log('--- FINAL SEEDING ATTEMPT ---');
  try {
    const tenantId = await getDefaultTenantId();
    
    // 1. Create Team Member (in 'users' table)
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        full_name: 'Audit Master',
        usual_role: 'Lead Cinematographer',
        phone_number: '9990001112',
        display_id: 'USR-AUDIT',
        email: 'audit@frame2frame.com'
      }, { onConflict: 'display_id' })
      .select()
      .single();

    if (userError || !user) throw userError || new Error('User creation failed');

    // 2. Add Workspace Membership
    await supabase.from('workspace_memberships').upsert({
      user_id: user.id,
      tenant_id: tenantId,
      role: 'MEMBER'
    }, { onConflict: 'user_id,tenant_id' });

    // 3. Get first client
    const { data: clients } = await supabase.from('clients_master').select('id').limit(1);
    const clientId = clients?.[0]?.id;
    if (!clientId) throw new Error('No clients found in DB to link event to');

    // 4. Create Grand Gala Wedding
    const { data: wedding, error: weddingError } = await supabase
      .from('events_master')
      .upsert({
        tenant_id: tenantId,
        client_id: clientId,
        display_id: 'AUDIT | Grand Gala Wedding',
        event_type: 'Wedding',
        package_value: 200000,
        status: 'Active',
        is_active: true
      }, { onConflict: 'display_id' })
      .select()
      .single();

    if (weddingError || !wedding) throw weddingError || new Error('Wedding creation failed');

    // 5. Add Artist Expense
    await supabase.from('artist_expenses').insert({
      event_id: wedding.id,
      user_id: user.id,
      tenant_id: tenantId,
      role: 'Lead Cinematographer',
      total_amount: 15000,
      advance_paid: 5000,
      is_active: true
    });

    // 6. Add Client Payment
    await supabase.from('client_payments').insert({
      event_id: wedding.id,
      tenant_id: tenantId,
      amount: 120000,
      payment_mode: 'Bank Transfer',
      is_active: true
    });

    console.log('✅ SEEDING SUCCESSFUL: Check for "Grand Gala Wedding" in your UI.');
  } catch (err: any) {
    console.error('❌ FATAL SEED ERR:', err.message || err);
  }
}

seedDeepAudit();
