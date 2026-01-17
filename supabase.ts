import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qurooscttpenkrzmfowd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpKCUICMcnUJ32NW1lM7Kw_xzFif5wz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Syncs an order to Supabase.
 */
export const syncOrderToSupabase = async (order: any) => {
  try {
    // Remove local-only properties like lastUpdated that are not in the Supabase schema
    const { lastUpdated, ...cleanOrder } = order;
    
    const { error } = await supabase
      .from('orders')
      .upsert(cleanOrder, { onConflict: 'id' });
    
    if (error) {
      if (error.code === '42P01') {
        console.error('CRITICAL: Table "orders" missing. Please run the SQL script in Supabase Editor.');
      } else {
        console.error('Supabase Order Sync Error:', error.message, error.details);
      }
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('Supabase Connection Failed:', err.message || err);
    return false;
  }
};

/**
 * Syncs a user profile to Supabase.
 */
export const syncUserToSupabase = async (user: any) => {
  try {
    const id = user.mobile || user.email || 'unknown';
    // Clean data for Supabase (remove transient properties like isLoggedIn and lastUpdated)
    const { isLoggedIn, lastUpdated, ...cleanUser } = user;
    
    const { error } = await supabase
      .from('users')
      .upsert({ ...cleanUser, id }, { onConflict: 'id' });
    
    if (error) {
      if (error.code === '42P01') {
        console.error('CRITICAL: Table "users" missing. Please run the SQL script in Supabase Editor.');
      } else {
        console.error('Supabase User Sync Error:', error.message);
      }
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('Supabase User Sync Failed:', err.message || err);
    return false;
  }
};

/**
 * Fetches all orders from Supabase.
 */
export const fetchOrdersFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
       console.error('Supabase Fetch Orders Error:', error.message);
       return null;
    }
    return data;
  } catch (err: any) {
    console.error('Supabase System Error:', err.message || err);
    return null;
  }
};

/**
 * Fetches all registered users from Supabase.
 */
export const fetchUsersFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      if (error.code === '42P01') {
        console.error('CRITICAL: Table "users" missing. Please run the SQL script in Supabase Editor.');
      } else {
        console.error('Supabase User Fetch Error:', error.message);
      }
      return null;
    }
    return data;
  } catch (err: any) {
    console.error('Supabase User Fetch Failed:', err.message || err);
    return null;
  }
};

/**
 * Subscribes to real-time changes for a specific table.
 */
export const subscribeToTable = (tableName: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`public:${tableName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
};
