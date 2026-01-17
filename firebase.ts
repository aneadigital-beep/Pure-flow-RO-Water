
/**
 * Local Persistence Engine (Firebase Replacement)
 * This module replaces Firebase with LocalStorage while maintaining the same API interface.
 */

export const COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  PRODUCTS: 'products',
  SETTINGS: 'settings'
};

// Mock "db" for compatibility with existing imports
export const db = { local: true };

// Helper to get local data
const getLocalData = (collectionName: string): any[] => {
  const data = localStorage.getItem(`pf_${collectionName}`);
  return data ? JSON.parse(data) : [];
};

// Helper to set local data and notify listeners
const setLocalData = (collectionName: string, data: any[]) => {
  localStorage.setItem(`pf_${collectionName}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(`pf_update_${collectionName}`, { detail: data }));
};

/**
 * Mocks the Firebase query ordering functionality.
 */
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return { type: 'order', field, direction };
};

/**
 * Mocks the onSnapshot functionality using LocalStorage and CustomEvents.
 */
export const syncCollection = (
  collectionName: string, 
  callback: (data: any[]) => void, 
  constraints: any[] = []
) => {
  // Initial load
  const loadAndEmit = () => {
    let data = getLocalData(collectionName);
    
    // Simple mock ordering logic
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

  // Listen for updates in the current tab
  const handleUpdate = (e: any) => callback(e.detail);
  window.addEventListener(`pf_update_${collectionName}`, handleUpdate);

  // Listen for updates from other tabs
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

/**
 * Adds or merges a document in a collection.
 */
export const upsertDocument = async (collectionName: string, id: string, data: any) => {
  const existing = getLocalData(collectionName);
  const index = existing.findIndex(doc => String(doc.id) === String(id));
  
  const updatedDoc = { 
    ...data, 
    id, 
    lastUpdated: new Date().toISOString() 
  };

  if (index >= 0) {
    existing[index] = { ...existing[index], ...updatedDoc };
  } else {
    existing.push(updatedDoc);
  }

  setLocalData(collectionName, existing);
};

/**
 * Updates an existing document.
 */
export const updateDocument = async (collectionName: string, id: string, data: any) => {
  const existing = getLocalData(collectionName);
  const index = existing.findIndex(doc => String(doc.id) === String(id));
  
  if (index >= 0) {
    existing[index] = { 
      ...existing[index], 
      ...data, 
      lastUpdated: new Date().toISOString() 
    };
    setLocalData(collectionName, existing);
  }
};

/**
 * Deletes a document from a collection.
 */
export const deleteDocument = async (collectionName: string, id: string) => {
  const existing = getLocalData(collectionName);
  const filtered = existing.filter(doc => String(doc.id) !== String(id));
  setLocalData(collectionName, filtered);
};

/**
 * Fetches a single document by ID.
 */
export const getDocument = async (collectionName: string, id: string) => {
  const existing = getLocalData(collectionName);
  return existing.find(doc => String(doc.id) === String(id)) || null;
};
