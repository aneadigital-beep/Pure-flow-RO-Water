
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
 * Utility to ensure objects are clean and serializable for Supabase
 */
const preparePayload = (obj: any) => {
  const clean: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      // Supabase handles arrays/objects well if the column is jsonb, 
      // but we ensure it's a plain object/array.
      clean[key] = obj[key];
    }
  });
  return clean;
};

export const syncOrderToSupabase = async (order: any) => {
  try {
    const payload = preparePayload(order);
    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase Order Sync Error:', error.message, error.details);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase Order Sync Critical Failure:', err);
    return false;
  }
};

export const syncUserToSupabase = async (user: any) => {
  if (!user) return false;
  try {
    const userId = (user.mobile || user.email || 'unknown').toString().trim();
    // Remove transient UI states before syncing
    const { isLoggedIn, lastUpdated, ...dataToSync } = user;
    const payload = preparePayload({ ...dataToSync, id: userId });
    
    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase User Sync Error:', error.message, error.details);
      return false;
    }
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
    .channel(`public:${tableName}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => callback(payload))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Realtime: Subscribed to ${tableName}`);
      }
    });
    
  return channel;
};
