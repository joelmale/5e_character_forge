import { Character } from '../types/dnd';

// --- IndexedDB Configuration ---
const DB_NAME = '5e_character_forge';
const DB_VERSION = 1;
const STORE_NAME = 'characters';

// --- IndexedDB Helper Functions ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('class', 'class', { unique: false });
        objectStore.createIndex('level', 'level', { unique: false });
      }
    };
  });
};

export const getAllCharacters = async (): Promise<Character[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const addCharacter = async (character: Character): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(character);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(character.id);
  });
};

export const deleteCharacter = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const updateCharacter = async (character: Character): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.put(character);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
