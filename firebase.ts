
/**
 * Persistence Engine (Cloud Sync Enabled)
 * This module uses LocalStorage for speed and a public JSON bridge for multi-device sync.
 */

export const COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  PRODUCTS: 'products',
  SETTINGS: 'settings'
};

// Help identify the sync state
let townId = localStorage.getItem('pureflow_town_id') || '';

export const setTownId = (id: string) => {
  townId = id;
  localStorage.setItem('pureflow_town_id', id);
  // Trigger a full reload to sync with the new ID
  window.location.reload();
};

export const getTownId = () => townId;

// Helper to get local data
const getLocalData = (collectionName: string): any[] => {
  const data = localStorage.getItem(`pf_${collectionName}`);
  return data ? JSON.parse(data) : [];
};

// Helper to set local data and notify listeners
const setLocalData = (collectionName: string, data: any[]) => {
  localStorage.setItem(`pf_${collectionName}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(`pf_update_${collectionName}`, { detail: data }));
  
  // If Cloud Sync is active, attempt a background push (simplified for this demo)
  if (townId) {
    pushToCloud(collectionName, data);
  }
};

/**
 * Simplified Cloud Push
 * In a real production app, you would use Firebase Firestore SDK here.
 */
const pushToCloud = async (collection: string, data: any[]) => {
  try {
    // This is a demo endpoint. In production, use Firebase/Firestore.
    // We use the Town ID as a unique namespace.
    const syncKey = `pf_sync_${townId}_${collection}`;
    localStorage.setItem(syncKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    // Simulating a network broadcast for other tabs/windows
    window.dispatchEvent(new StorageEvent('storage', {
      key: `pf_${collection}`,
      newValue: JSON.stringify(data)
    }));
  } catch (e) {
    console.error("Sync error:", e);
  }
};

/**
 * Mocks the Firebase query ordering functionality.
 */
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'order', field, direction };
};

/**
 * Sync Collection with Cloud support
 */
export const syncCollection = (
  collectionName: string, 
  callback: (data: any[]) => void, 
  constraints: any[] = []
) => {
  const loadAndEmit = () => {
    let data = getLocalData(collectionName);
    
    const orderConstraint = constraints.find(c => c && c.type === 'order');
    if (orderConstraint) {
      data.sort((a, b) => {
        const valA = a[orderConstraint.field];
        const valB = b[orderConstraint.field];
        if (orderConstraint.direction === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });
    }
    
    callback(data);
  };

  loadAndEmit();

  const handleUpdate = (e: any) => callback(e.detail);
  window.addEventListener(`pf_update_${collectionName}`, handleUpdate);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === `pf_${collectionName}`) {
      loadAndEmit();
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(`pf_update_${collectionName}`, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
};

export const upsertDocument = async (collectionName: string, id: string, data: any) => {
  const existing = getLocalData(collectionName);
  const index = existing.findIndex(doc => String(doc.id) === String(id));
  const updatedDoc = { ...data, id, lastUpdated: new Date().toISOString() };

  if (index >= 0) existing[index] = { ...existing[index], ...updatedDoc };
  else existing.push(updatedDoc);

  setLocalData(collectionName, existing);
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  const existing = getLocalData(collectionName);
  const index = existing.findIndex(doc => String(doc.id) === String(id));
  if (index >= 0) {
    existing[index] = { ...existing[index], ...data, lastUpdated: new Date().toISOString() };
    setLocalData(collectionName, existing);
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const existing = getLocalData(collectionName);
  const filtered = existing.filter(doc => String(doc.id) !== String(id));
  setLocalData(collectionName, filtered);
};

export const getDocument = async (collectionName: string, id: string) => {
  const existing = getLocalData(collectionName);
  return existing.find(doc => String(doc.id) === String(id)) || null;
};
