import { Character, UserMonster, Encounter } from '../types/dnd';

// --- IndexedDB Configuration ---
const DB_NAME = '5e_character_forge';
const DB_VERSION = 3; // Version 3: Add edition field migration
const STORE_NAME = 'characters';
const CUSTOM_MONSTERS_STORE = 'customMonsters';
const FAVORITES_STORE = 'favoriteMonsters';
const ENCOUNTERS_STORE = 'encounters';

// --- IndexedDB Helper Functions ---
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Version 1: Create characters store
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: false });
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('class', 'class', { unique: false });
          objectStore.createIndex('level', 'level', { unique: false });
        }
      }

      // Version 2: Add monster-related stores
      if (oldVersion < 2) {
        // Custom monsters store
        if (!db.objectStoreNames.contains(CUSTOM_MONSTERS_STORE)) {
          const customMonstersStore = db.createObjectStore(CUSTOM_MONSTERS_STORE, { keyPath: 'id', autoIncrement: false });
          customMonstersStore.createIndex('name', 'name', { unique: false });
          customMonstersStore.createIndex('type', 'type', { unique: false });
          customMonstersStore.createIndex('challenge_rating', 'challenge_rating', { unique: false });
        }

        // Favorite monsters store
        if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
          db.createObjectStore(FAVORITES_STORE, { keyPath: 'monsterId', autoIncrement: false });
        }

        // Encounters store
        if (!db.objectStoreNames.contains(ENCOUNTERS_STORE)) {
          const encountersStore = db.createObjectStore(ENCOUNTERS_STORE, { keyPath: 'id', autoIncrement: false });
          encountersStore.createIndex('name', 'name', { unique: false });
          encountersStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      }

      // Version 3: Migrate existing characters to include edition field
      if (oldVersion < 3 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as Character[];

          console.log(`🔄 [DB Migration] Migrating ${characters.length} characters to version 3`);

          characters.forEach((character) => {
            // Only migrate if edition field is missing
            if (!character.edition) {
              console.log(`  ✏️ Adding edition field to character: ${character.name}`);

              // Default to 2014 edition for existing characters
              // (they were created under 2014 rules)
              character.edition = '2014';

              // Update the character in the store
              characterStore.put(character);
            }
          });

          console.log('✅ [DB Migration] Edition field migration complete');
        };

        getAllRequest.onerror = () => {
          console.error('❌ [DB Migration] Failed to migrate characters:', getAllRequest.error);
        };
      }
    };
  });
};

// --- Migration Helper Functions ---

/**
 * Ensures legacy characters have required edition field.
 * This is a fallback in case a character somehow loads without the edition field.
 * The primary migration happens in the database upgrade handler.
 */
const ensureCharacterHasEdition = (character: Character): Character => {
  if (!character.edition) {
    console.warn(`⚠️ [DB] Character "${character.name}" loaded without edition field. Defaulting to 2014.`);
    return {
      ...character,
      edition: '2014', // Default to 2014 for legacy characters
    };
  }
  return character;
};

export const getAllCharacters = async (): Promise<Character[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Apply fallback migration to ensure all characters have edition field
      const characters = (request.result as Character[]).map(ensureCharacterHasEdition);
      resolve(characters);
    };
  });
};

export const addCharacter = async (character: Character): Promise<string> => {
  console.log('💾 [DB] Adding character:', {
    id: character.id,
    name: character.name,
    race: character.race,
    class: character.class,
    level: character.level
  });

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(character);

    request.onerror = () => {
      console.error('❌ [DB] Failed to add character:', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      console.log('✅ [DB] Character added successfully');
      resolve(character.id);
    };
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

// ==================== Custom Monsters ====================

export const getAllCustomMonsters = async (): Promise<UserMonster[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CUSTOM_MONSTERS_STORE], 'readonly');
    const objectStore = transaction.objectStore(CUSTOM_MONSTERS_STORE);
    const request = objectStore.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const addCustomMonster = async (monster: UserMonster): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CUSTOM_MONSTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CUSTOM_MONSTERS_STORE);
    const request = objectStore.add(monster);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(monster.id);
  });
};

export const updateCustomMonster = async (monster: UserMonster): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CUSTOM_MONSTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CUSTOM_MONSTERS_STORE);
    const request = objectStore.put(monster);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const deleteCustomMonster = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CUSTOM_MONSTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CUSTOM_MONSTERS_STORE);
    const request = objectStore.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// ==================== Favorites ====================

export const getFavoriteMonsters = async (): Promise<string[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAVORITES_STORE], 'readonly');
    const objectStore = transaction.objectStore(FAVORITES_STORE);
    const request = objectStore.getAllKeys();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as string[]);
  });
};

export const addFavorite = async (monsterId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAVORITES_STORE], 'readwrite');
    const objectStore = transaction.objectStore(FAVORITES_STORE);
    const request = objectStore.add({ monsterId, createdAt: Date.now() });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const removeFavorite = async (monsterId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAVORITES_STORE], 'readwrite');
    const objectStore = transaction.objectStore(FAVORITES_STORE);
    const request = objectStore.delete(monsterId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const isFavorite = async (monsterId: string): Promise<boolean> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAVORITES_STORE], 'readonly');
    const objectStore = transaction.objectStore(FAVORITES_STORE);
    const request = objectStore.get(monsterId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(!!request.result);
  });
};

// ==================== Encounters ====================

export const getAllEncounters = async (): Promise<Encounter[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ENCOUNTERS_STORE], 'readonly');
    const objectStore = transaction.objectStore(ENCOUNTERS_STORE);
    const request = objectStore.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getEncounter = async (id: string): Promise<Encounter | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ENCOUNTERS_STORE], 'readonly');
    const objectStore = transaction.objectStore(ENCOUNTERS_STORE);
    const request = objectStore.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const saveEncounter = async (encounter: Encounter): Promise<string> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ENCOUNTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(ENCOUNTERS_STORE);
    const request = objectStore.put(encounter);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(encounter.id);
  });
};

export const deleteEncounter = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ENCOUNTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(ENCOUNTERS_STORE);
    const request = objectStore.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
