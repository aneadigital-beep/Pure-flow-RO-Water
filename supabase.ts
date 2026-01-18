
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qurooscttpenkrzmfowd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpKCUICMcnUJ32NW1lM7Kw_xzFif5wz';

/**
 * Initialize Supabase client with specialized options for sandboxed environments.
 * Disabling persistSession prevents "Failed to fetch" or "Access Denied" errors 
 * related to localStorage/indexedDB in some browser security contexts.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

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
 *   items JSONB,
 *   history JSONB
 * );
 * 
 * CREATE TABLE users (
 *   id TEXT PRIMARY KEY,
 *   name TEXT,
 *   mobile TEXT,
 *   email TEXT,
 *   address TEXT,
 *   pincode TEXT,
 *   avatar TEXT,
 *   pin TEXT,
 *   "isAdmin" BOOLEAN DEFAULT FALSE,
 *   "isDeliveryBoy" BOOLEAN DEFAULT FALSE,
 *   "lastUpdated" TIMESTAMPTZ DEFAULT NOW()
 * );
 */

/**
 * Syncs an order to Supabase.
 */
export const syncOrderToSupabase = async (order: any) => {
  try {
    const { lastUpdated, ...cleanOrder } = order;

    const payload = {
      ...cleanOrder,
      items: typeof cleanOrder.items === 'object' ? cleanOrder.items : JSON.parse(cleanOrder.items || '[]'),
      history: typeof cleanOrder.history === 'object' ? cleanOrder.history : JSON.parse(cleanOrder.history || '[]'),
    };
    
    const { error } = await supabase
      .from('orders')
      .upsert(payload, { onConflict: 'id' });
    
    if (error) {
      console.error('Supabase Order Sync Error:', error.message);
      return false;
    }
    
    return true;
  } catch (err: any) {
    console.error('Supabase Order Sync Failed:', err.message || err);
    return false;
  }
};

/**
 * Syncs a user profile to Supabase.
 */
export const syncUserToSupabase = async (user: any) => {
  if (!user) return false;
  
  try {
    const userId = (user.mobile || user.email || 'unknown').toString().trim();
    // Remove UI-only state before syncing
    const { isLoggedIn, lastUpdated, ...dataToSync } = user;
    
    const { error } = await supabase
      .from('users')
      .upsert({ 
        ...dataToSync, 
        id: userId 
      }, { 
        onConflict: 'id' 
      });
    
    if (error) {
      console.error('Supabase User Sync Error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    // TypeError: Failed to fetch usually means CORS issues or the domain is blocked/down
    console.error('Supabase User Sync Network Error:', err.message || err);
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
