import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qurooscttpenkrzmfowd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DpKCUICMcnUJ32NW1lM7Kw_xzFif5wz';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Syncs an order to Supabase.
 * Assumes a table 'orders' exists with columns matching the Order interface.
 */
export const syncOrderToSupabase = async (order: any) => {
  try {
    const { error } = await supabase
      .from('orders')
      .upsert(order, { onConflict: 'id' });
    
    if (error) {
      console.error('Supabase Sync Error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase Connection Failed:', err);
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
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase Fetch Error:', err);
    return null;
  }
};