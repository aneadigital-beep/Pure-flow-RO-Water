
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

export const syncOrderToSupabase = async (order: any) => {
  try {
    const { lastUpdated, ...cleanOrder } = order;
    const payload = {
      ...cleanOrder,
      items: typeof cleanOrder.items === 'object' ? cleanOrder.items : JSON.parse(cleanOrder.items || '[]'),
      history: typeof cleanOrder.history === 'object' ? cleanOrder.history : JSON.parse(cleanOrder.history || '[]'),
    };
    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    return false;
  }
};

export const syncUserToSupabase = async (user: any) => {
  if (!user) return false;
  try {
    const userId = (user.mobile || user.email || 'unknown').toString().trim();
    const { isLoggedIn, lastUpdated, ...dataToSync } = user;
    const { error } = await supabase.from('users').upsert({ ...dataToSync, id: userId }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    return false;
  }
};

export const syncProductToSupabase = async (product: any) => {
  try {
    const { lastUpdated, ...dataToSync } = product;
    const { error } = await supabase.from('products').upsert(dataToSync, { onConflict: 'id' });
    if (error) console.error('Product Sync Error:', error);
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
    .subscribe();
    
  return channel;
};
