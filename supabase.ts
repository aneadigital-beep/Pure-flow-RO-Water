
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qurooscttpenkrzmfowd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpKCUICMcnUJ32NW1lM7Kw_xzFif5wz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * RECOMMENDED SQL SCHEMA FOR SUPABASE:
 * 
 * CREATE TABLE orders (
 *   id TEXT PRIMARY KEY,
 *   "userMobile" TEXT,
 *   "userName" TEXT,
 *   "userAddress" TEXT,
 *   "userZipcode" TEXT,
 *   "productSummary" TEXT,
 *   date TEXT,
 *   "createdAt" TIMESTAMPTZ,
 *   total NUMERIC,
 *   status TEXT,
 *   "paymentMethod" TEXT,
 *   "assignedToMobile" TEXT,
 *   "assignedToName" TEXT,
 *   "depositAmount" NUMERIC DEFAULT 0,
 *   items JSONB,    -- Use JSONB for these two
 *   history JSONB   -- Use JSONB for these two
 * );
 */

/**
 * Syncs an order to Supabase.
 */
export const syncOrderToSupabase = async (order: any) => {
  try {
    // 1. Exclude local-only UI fields
    const { lastUpdated, ...cleanOrder } = order;

    // 2. Prepare payload
    // If your Supabase columns are NOT JSONB, stringifying them ensures they save as text.
    // If they ARE JSONB, Supabase handles these JS objects/arrays natively.
    const payload = {
      ...cleanOrder,
      // Ensure these are in a format Supabase understands (string or JSON)
      items: typeof cleanOrder.items === 'object' ? cleanOrder.items : JSON.parse(cleanOrder.items || '[]'),
      history: typeof cleanOrder.history === 'object' ? cleanOrder.history : JSON.parse(cleanOrder.history || '[]'),
    };
    
    // 3. Perform Upsert
    const { data, error } = await supabase
      .from('orders')
      .upsert(payload, { 
        onConflict: 'id',
        ignoreDuplicates: false // Ensure it actually UPDATES on conflict
      })
      .select(); // Select back to confirm success
    
    if (error) {
      console.error('--- Supabase Sync Failure ---');
      console.error('Order ID:', order.id);
      console.error('Error Message:', error.message);
      console.error('Hint:', error.hint);
      console.error('Details:', error.details);
      
      if (error.code === '42P01') {
        console.error('Table "orders" does not exist in the database.');
      } else if (error.code === '42703') {
        console.error('Column name mismatch. Check if column names in DB match the Order object keys exactly.');
      }
      return false;
    }
    
    console.log(`Order ${order.id} synced successfully to cloud.`);
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
    const { isLoggedIn, lastUpdated, ...cleanUser } = user;
    
    const { error } = await supabase
      .from('users')
      .upsert({ ...cleanUser, id }, { onConflict: 'id' });
    
    if (error) {
      console.error('Supabase User Sync Error:', error.message);
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
      console.error('Supabase User Fetch Error:', error.message);
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
