
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qurooscttpenkrzmfowd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpKCUICMcnUJ32NW1lM7Kw_xzFif5wz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

/**
 * Utility to ensure objects are clean and serializable for Supabase.
 * We convert the object to a clean JSON and back to strip 'undefined' 
 * which Supabase/Postgres doesn't like.
 */
const preparePayload = (obj: any) => {
  if (!obj) return {};
  try {
    return JSON.parse(JSON.stringify(obj, (key, value) => 
      value === undefined ? null : value
    ));
  } catch (e) {
    console.error("Payload Preparation Error:", e);
    return obj;
  }
};

export const syncOrderToSupabase = async (order: any) => {
  try {
    if (!order.id) {
      console.error('Supabase Sync Error: Order missing ID');
      return false;
    }
    const payload = preparePayload(order);
    
    // Attempting UPSERT. Note: 'orders' table MUST have 'id' as Primary Key.
    const { data, error } = await supabase
      .from('orders')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Supabase Order Sync Error:', error.message, error.details);
      return false;
    }
    console.log(`Supabase: Successfully synced order ${order.id}`, data);
    return true;
  } catch (err) {
    console.error('Supabase Order Sync Critical Failure:', err);
    return false;
  }
};

export const syncUserToSupabase = async (user: any) => {
  if (!user) return false;
  try {
    const userId = (user.mobile || user.email || user.id || 'unknown').toString().trim();
    if (!userId || userId === 'unknown') {
      console.error('Supabase User Sync Error: No valid ID/Mobile found');
      return false;
    }
    
    // Remove transient UI states that shouldn't live in DB
    const { isLoggedIn, lastUpdated, ...dataToSync } = user;
    // We map 'mobile' or 'email' to 'id' for the database primary key
    const payload = preparePayload({ ...dataToSync, id: userId });
    
    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Supabase User Sync Error:', error.message, error.details);
      return false;
    }
    console.log(`Supabase: Successfully synced user ${userId}`, data);
    return true;
  } catch (err) {
    console.error('Supabase User Sync Critical Failure:', err);
    return false;
  }
};

export const deleteUserFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
};

export const syncProductToSupabase = async (product: any) => {
  try {
    const payload = preparePayload(product);
    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    if (error) console.error('Product Sync Error:', error.message);
    return !error;
  } catch (err) {
    return false;
  }
};

export const deleteProductFromSupabase = async (id: string) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
};

export const syncSettingToSupabase = async (id: string, value: any) => {
  try {
    const { error } = await supabase.from('settings').upsert({ id, value }, { onConflict: 'id' });
    if (error) console.error('Settings Sync Error:', error.message);
    return !error;
  } catch (err) {
    return false;
  }
};

export const fetchSettingsFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    return error ? null : data;
  } catch (err) {
    return null;
  }
};

export const fetchOrdersFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
    return error ? null : data;
  } catch (err) {
    return null;
  }
};

export const fetchUsersFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    return error ? null : data;
  } catch (err) {
    return null;
  }
};

export const fetchProductsFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('products').select('*');
    return error ? null : data;
  } catch (err) {
    return null;
  }
};

export const subscribeToTable = (tableName: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`public:${tableName}_realtime`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
      console.log(`Realtime update [${tableName}]:`, payload.eventType, payload.new?.id);
      callback(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime: Watching table ${tableName}`);
      }
    });
    
  return channel;
};
