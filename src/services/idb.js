import { openDB } from 'idb';

const DB_NAME = 'class-creation-db';
const STORE_NAME = 'class-form-state';
const DB_VERSION = 1;
const STATE_KEY = 'currentClassForm';

let dbPromise;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

/**
 * Saves the state object with a timestamp to IndexedDB.
 * @param {object} stateWithTimestamp - The object { data: state, timestamp: Date.now() }
 */
export const saveFormState = async (stateWithTimestamp) => {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, stateWithTimestamp, STATE_KEY);
  } catch (error) {
    console.error('Failed to save state to IndexedDB:', error);
  }
};

/**
 * Loads the state object from IndexedDB and checks for expiration.
 * @returns {Promise<object|undefined>} The saved state object {data, timestamp}, or undefined if not found or expired.
 */
export const loadFormState = async () => {
  try {
    const db = await getDb();
    const storedObject = await db.get(STORE_NAME, STATE_KEY);
    
    if (storedObject && storedObject.timestamp && (Date.now() - storedObject.timestamp < 24 * 60 * 60 * 1000)) {
        return storedObject; // Return the whole object { data, timestamp }
    }
    
    // If expired or not found, clear it just in case
    if (storedObject) {
        await deleteFormState();
    }
    
    return undefined;

  } catch (error) {
    console.error('Failed to load state from IndexedDB:', error);
    return undefined;
  }
};

/**
 * Deletes the form state from IndexedDB.
 */
export const deleteFormState = async () => {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, STATE_KEY);
  } catch (error) {
    console.error('Failed to delete state from IndexedDB:', error);
  }
};