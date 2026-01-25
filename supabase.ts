
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
 * Normalizes any string/number to the last 10 digits for phone-based IDs.
 * Returns null if the input is falsy to prevent empty string mismatches.
 */
export const cleanId = (id: any): string | null => {
  if (id === null || id === undefined || id === '') return null;
  const digits = id.toString().replace(/\D/g, '').trim();
  if (digits.length === 0) return null;
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

// Strict Column whitelists for each table to prevent "column not found" errors
const TABLE_SCHEMAS: Record<string, string[]> = {
  orders: [
    'id', 'usermobile', 'username', 'useraddress', 'userzipcode', 
    'productsummary', 'total', 'items', 'status', 'paymentmethod', 
    'deliveryslot', 'history', 'assignedtomobile', 'assignedtoname', 
    'createdat', 'updatedat'
  ],
  users: [
    'id', 'name', 'mobile', 'email', 'address', 'pincode', 
    'selectedzone', 'avatar', 'pin', 'isadmin', 'isdeliveryboy', 
    'preferredareas', 'createdat', 'updatedat'
  ],
  products: [
    'id', 'name', 'description', 'price', 'unit', 'image', 'category'
  ],
  settings: [
    'id', 'value'
  ]
};

/**
 * Maps Supabase result (lowercase) to App format (camelCase).
 */
export const mapFromDB = (data: any): any => {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(mapFromDB);
  
  const mapped: any = { ...data };

  const fieldMap: Record<string, string[]> = {
    'assignedToMobile': ['assignedtomobile', 'staff_mobile'],
    'assignedToName': ['assignedtoname', 'staff_name'],
    'userMobile': ['usermobile', 'mobile'],
    'userName': ['username', 'name'],
    'userAddress': ['useraddress', 'address'],
    'userZipcode': ['userzipcode', 'pincode'],
    'productSummary': ['productsummary', 'summary'],
    'paymentMethod': ['paymentmethod', 'payment_method'],
    'deliverySlot': ['deliveryslot', 'delivery_slot'],
    'isAdmin': ['isadmin', 'is_admin'],
    'isDeliveryBoy': ['isdeliveryboy', 'is_delivery_boy'],
    'createdAt': ['createdat', 'created_at'],
    'updatedAt': ['updatedat', 'updated_at'],
    'selectedZone': ['selectedzone', 'zone'],
    'adminRole': ['adminrole']
  };

  Object.entries(fieldMap).forEach(([appKey, dbVariants]) => {
    for (const variant of dbVariants) {
      if (data[variant] !== undefined && data[variant] !== null) {
        mapped[appKey] = data[variant];
        break; 
      }
    }
  });

  mapped.isAdmin = !!mapped.isAdmin;
  mapped.isDeliveryBoy = !!mapped.isDeliveryBoy;
  
  // Use cleanId to ensure normalization but preserve nulls
  mapped.assignedToMobile = cleanId(mapped.assignedToMobile);
  mapped.userMobile = cleanId(mapped.userMobile);
  mapped.id = (mapped.id || data.id || '').toString();

  // Ensure arrays are never null/undefined for UI safety
  if (typeof mapped.items === 'string') {
    try { mapped.items = JSON.parse(mapped.items); } catch (e) { mapped.items = []; }
  }
  if (!Array.isArray(mapped.items)) mapped.items = [];

  if (typeof mapped.history === 'string') {
    try { mapped.history = JSON.parse(mapped.history); } catch (e) { mapped.history = []; }
  }
  if (!Array.isArray(mapped.history)) mapped.history = [];

  if (typeof mapped.preferredAreas === 'string') {
    try { mapped.preferredAreas = JSON.parse(mapped.preferredAreas); } catch (e) { mapped.preferredAreas = []; }
  }
  if (!Array.isArray(mapped.preferredAreas)) mapped.preferredAreas = [];

  return mapped;
};

/**
 * Translates App object to lowercase DB payload filtered strictly by table schema.
 */
export const preparePayload = (tableName: string, obj: any) => {
  if (!obj) return {};
  
  const finalPayload: any = {};
  const schema = TABLE_SCHEMAS[tableName] || [];
  
  // Helper to safely add fields if they are in the target table's schema
  const addToPayload = (dbKey: string, value: any) => {
    if (schema.includes(dbKey)) {
      finalPayload[dbKey] = value;
    }
  };

  // Common fields
  addToPayload('id', String(obj.id));
  addToPayload('createdat', obj.createdAt || new Date().toISOString());
  addToPayload('updatedat', new Date().toISOString());

  // Table-aware field mapping
  if (tableName === 'orders') {
    addToPayload('usermobile', cleanId(obj.userMobile || obj.mobile));
    addToPayload('username', obj.userName || obj.name || null);
    addToPayload('useraddress', obj.userAddress || obj.address || null);
    addToPayload('userzipcode', obj.userZipcode || obj.pincode || null);
    addToPayload('productsummary', obj.productSummary || null);
    addToPayload('total', obj.total || 0);
    addToPayload('status', obj.status || 'Pending');
    addToPayload('paymentmethod', obj.paymentMethod || null);
    addToPayload('deliveryslot', obj.deliverySlot || null);
    addToPayload('assignedtomobile', cleanId(obj.assignedToMobile));
    addToPayload('assignedtoname', obj.assignedToName || null);
    
    if (obj.items) finalPayload.items = typeof obj.items === 'string' ? obj.items : JSON.stringify(obj.items);
    if (obj.history) finalPayload.history = typeof obj.history === 'string' ? obj.history : JSON.stringify(obj.history);
  }

  if (tableName === 'users') {
    addToPayload('name', obj.name || obj.userName || null);
    addToPayload('mobile', cleanId(obj.mobile || obj.userMobile));
    addToPayload('email', obj.email || null);
    addToPayload('address', obj.address || obj.userAddress || null);
    addToPayload('pincode', obj.pincode || obj.userZipcode || null);
    addToPayload('selectedzone', obj.selectedZone || null);
    addToPayload('avatar', obj.avatar || null);
    addToPayload('pin', obj.pin || null);
    addToPayload('isadmin', !!obj.isAdmin);
    addToPayload('isdeliveryboy', !!obj.isDeliveryBoy);
    
    if (obj.preferredAreas) finalPayload.preferredareas = typeof obj.preferredAreas === 'string' ? obj.preferredAreas : JSON.stringify(obj.preferredAreas);
  }

  if (tableName === 'products') {
    addToPayload('name', obj.name || null);
    addToPayload('description', obj.description || null);
    addToPayload('price', obj.price !== undefined ? Number(obj.price) : null);
    addToPayload('unit', obj.unit || null);
    addToPayload('image', obj.image || null);
    addToPayload('category', obj.category || null);
  }

  if (tableName === 'settings') {
    if (obj.value !== undefined) finalPayload.value = obj.value;
  }

  return finalPayload;
};

export const syncOrderToSupabase = async (order: any) => {
  if (!order.id) return false;
  try {
    const payload = preparePayload('orders', order);
    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase Order Sync Error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const syncUserToSupabase = async (user: any) => {
  if (!user) return false;
  const id = cleanId(user.mobile || user.email || user.id);
  if (!id) return false;
  try {
    const payload = preparePayload('users', { ...user, id });
    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Supabase User Sync Error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const fetchOrdersFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('createdat', { ascending: false });
    return error ? null : mapFromDB(data);
  } catch (err) {
    return null;
  }
};

export const fetchUsersFromSupabase = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*');
    return error ? null : mapFromDB(data);
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

export const syncProductToSupabase = async (product: any) => {
  try {
    const payload = preparePayload('products', product);
    const { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    return false;
  }
};

export const syncSettingToSupabase = async (id: string, value: any) => {
  try {
    const { error } = await supabase.from('settings').upsert({ id, value }, { onConflict: 'id' });
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

export const deleteUserFromSupabase = async (id: string) => {
  const normalizedId = cleanId(id);
  if (!normalizedId) return false;
  try {
    const { error } = await supabase.from('users').delete().eq('id', normalizedId);
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

export const subscribeToTable = (tableName: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`public:${tableName}_realtime`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
      if (payload.new) payload.new = mapFromDB(payload.new);
      callback(payload);
    })
    .subscribe();
};
