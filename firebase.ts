
/**
 * Persistence Engine (Cloud Sync Simulation)
 * Note: LocalStorage is device-specific. To sync across different phones, 
 * use the Export/Import "Sync Package" feature in the Admin panel.
 */

export const COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  PRODUCTS: 'products',
  SETTINGS: 'settings'
};

let townId = localStorage.getItem('pureflow_town_id') || '';

export const setTownId = (id: string) => {
  townId = id;
  localStorage.setItem('pureflow_town_id', id);
  window.location.reload();
};

export const getTownId = () => townId;

/**
 * DATABASE INSPECTOR: Get all data for the current town
 */
export const getFullDatabaseExport = () => {
  const db: any = {};
  Object.values(COLLECTIONS).forEach(col => {
    db[col] = getLocalData(col);
  });
  return JSON.stringify({
    townId,
    timestamp: new Date().toISOString(),
    payload: db
  });
};

/**
 * DATABASE RESTORE: Overwrite local data with a sync package
 */
export const importDatabasePackage = (jsonString: string) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.payload) throw new Error("Invalid Sync Package");
    
    Object.keys(parsed.payload).forEach(col => {
      localStorage.setItem(`pf_${col}`, JSON.stringify(parsed.payload[col]));
    });
    
    if (parsed.townId) {
      localStorage.setItem('pureflow_town_id', parsed.townId);
    }
    
    return true;
  } catch (e) {
    console.error("Import failed:", e);
    return false;
  }
};

const getLocalData = (collectionName: string): any[] => {
  const data = localStorage.getItem(`pf_${collectionName}`);
  return data ? JSON.parse(data) : [];
};

const setLocalData = (collectionName: string, data: any[]) => {
  localStorage.setItem(`pf_${collectionName}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(`pf_update_${collectionName}`, { detail: data }));
};

export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'order', field, direction };
};

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
    if (e.key === `pf_${collectionName}`) loadAndEmit();
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
