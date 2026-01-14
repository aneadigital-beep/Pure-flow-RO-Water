
import firebase from "firebase/app";
import "firebase/firestore";

/**
 * --- TROUBLESHOOTING DATA ISSUES ---
 * 1. Ensure 'projectId' below matches the ID in your Firebase Browser URL.
 * 2. Ensure 'appId' is exactly what is in your Firebase Project Settings.
 * 3. Ensure you clicked 'PUBLISH' in the Firebase Rules tab.
 */
const firebaseConfig = {
  // Always use the injected API key for the SDK
  apiKey: process.env.API_KEY, 
  
  // PASTE YOUR ACTUAL VALUES BELOW FROM FIREBASE CONSOLE:
  authDomain: "purerowater-9d71e.firebaseapp.com",
  projectId: "purerowater-9d71e",
  storageBucket: "purerowater-9d71e.appspot.com",
  messagingSenderId: "41728470122",
  appId: "1:41728470122:web:9e08d23d25f20e86a46e13"
};

// Initialize Firebase using v8 namespaced syntax
let db: firebase.firestore.Firestore;

try {
  // Check if an app is already initialized to prevent errors on hot-reloading
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  console.log("Firebase initialized successfully with Project ID:", firebaseConfig.projectId);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db };

// Collection Names
export const COLLECTIONS = {
  ORDERS: 'orders',
  USERS: 'users',
  PRODUCTS: 'products',
  SETTINGS: 'settings'
};

/**
 * Helper to simulate v9 modular orderBy in a v8 namespaced context.
 * Returns a constraint object that syncCollection understands.
 */
export const orderBy = (field: string, direction: 'asc' | 'desc' = 'asc') => ({
  type: 'orderBy',
  field,
  direction
});

// Real-time listener with error handling (v8 implementation)
export const syncCollection = (collectionName: string, callback: (data: any[]) => void, queryConstraints: any[] = []) => {
  if (!db) return () => {};
  
  let ref: firebase.firestore.Query = db.collection(collectionName);
  
  // Apply order constraints from the provided array
  queryConstraints.forEach(constraint => {
    if (constraint.type === 'orderBy') {
      ref = ref.orderBy(constraint.field, constraint.direction);
    }
  });

  return ref.onSnapshot(
    (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      callback(data);
    },
    (error) => {
      console.error(`Error syncing ${collectionName}:`, error.message);
      if (error.code === 'permission-denied') {
        console.error("Check your Firebase Rules! They might be blocking the app.");
      }
    }
  );
};

// V8 implementation of upsertDocument
export const upsertDocument = async (collectionName: string, id: string, data: any) => {
  if (!db) return;
  const docRef = db.collection(collectionName).doc(id);
  await docRef.set({ ...data, lastUpdated: new Date().toISOString() }, { merge: true });
};

// V8 implementation of updateDocument
export const updateDocument = async (collectionName: string, id: string, data: any) => {
  if (!db) return;
  const docRef = db.collection(collectionName).doc(id);
  await docRef.update({ ...data, lastUpdated: new Date().toISOString() });
};

// V8 implementation of getDocument
export const getDocument = async (collectionName: string, id: string) => {
  if (!db) return null;
  const docRef = db.collection(collectionName).doc(id);
  const snap = await docRef.get();
  return snap.exists ? snap.data() : null;
};
