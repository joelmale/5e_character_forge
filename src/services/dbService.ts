import { Character, UserMonster, Encounter } from '../types/dnd';
import { log } from '../utils/logger';

// --- IndexedDB Configuration ---
const DB_NAME = '5e_character_forge';
const DB_VERSION = 11; // Version 11: Ensure custom monsters store exists
const STORE_NAME = 'characters';
const CUSTOM_MONSTERS_STORE = 'customMonsters';
const FAVORITES_STORE = 'favoriteMonsters';
const ENCOUNTERS_STORE = 'encounters';

import { initializeCharacterResources } from '../utils/resourceUtils';

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

      // Custom monsters store - ensure it exists regardless of version
      if (!db.objectStoreNames.contains(CUSTOM_MONSTERS_STORE)) {
        const customMonstersStore = db.createObjectStore(CUSTOM_MONSTERS_STORE, { keyPath: 'id', autoIncrement: false });
        customMonstersStore.createIndex('name', 'name', { unique: false });
        customMonstersStore.createIndex('type', 'type', { unique: false });
        customMonstersStore.createIndex('challenge_rating', 'challenge_rating', { unique: false });
      }

      // Favorite monsters store - ensure it exists regardless of version
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: 'monsterId', autoIncrement: false });
      }

      // Encounters store - ensure it exists regardless of version
      // (Added later, so we check for it on every upgrade)
      if (!db.objectStoreNames.contains(ENCOUNTERS_STORE)) {
        const encountersStore = db.createObjectStore(ENCOUNTERS_STORE, { keyPath: 'id', autoIncrement: false });
        encountersStore.createIndex('name', 'name', { unique: false });
        encountersStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Version 3: Migrate existing characters to include edition field
      if (oldVersion < 3 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as Character[];

          characters.forEach((character) => {
            // Only migrate if edition field is missing
            if (!character.edition) {

              // Default to 2014 edition for existing characters
              // (they were created under 2014 rules)
              character.edition = '2014';

              // Update the character in the store
              characterStore.put(character);
            }
          });
        };

        getAllRequest.onerror = () => {
          log.error('DB migration failed during edition backfill', { error: getAllRequest.error });
        };
      }

      // Version 4: Migrate existing characters to include resources
      if (oldVersion < 4 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as Character[];

          characters.forEach((character) => {
            // Initialize or update resources for existing characters
            if (!character.resources || character.resources.length === 0) {
              character.resources = initializeCharacterResources(character);
              characterStore.put(character);
            }
          });
        };

        getAllRequest.onerror = () => {
          log.error('DB migration failed during resources backfill', { error: getAllRequest.error });
        };
      }

      // Version 5: Rename race field to species for existing characters
      if (oldVersion < 5 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as Partial<Character>[];

          characters.forEach((character) => {
            // Check if character has race field but not species field
            if (character.race && !character.species) {

              // Rename race field to species
              character.species = character.race;
              delete character.race;

              // Update the character in the store
              characterStore.put(character);
            }
          });
        };

        getAllRequest.onerror = () => {
          log.error('DB migration failed during race-to-species migration', { error: getAllRequest.error });
        };
      }

      // Version 6: Add musical instrument proficiencies field
      if (oldVersion < 6 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as Partial<Character>[];

          characters.forEach((character) => {
            // Initialize musical instrument proficiencies for bards
            if (character.class === 'Bard' && !character.featuresAndTraits?.musicalInstrumentProficiencies) {

              // Initialize empty array for musical instruments
              // (Existing bards will need to re-select their instruments)
              if (!character.featuresAndTraits) {
                character.featuresAndTraits = {
                  personality: '',
                  ideals: '',
                  bonds: '',
                  flaws: '',
                  classFeatures: [],
                  speciesTraits: [],
                  musicalInstrumentProficiencies: []
                };
              } else {
                character.featuresAndTraits.musicalInstrumentProficiencies = [];
              }

              // Update the character in the store
              characterStore.put(character);
            }
          });
        };

        getAllRequest.onerror = () => {
          log.error('DB migration failed during health cleanup', { error: getAllRequest.error });
        };
      } // Correctly closing the if (oldVersion < 6) block

      // Version 7: Ensure all characters have an edition field
      if (oldVersion < 7 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as Partial<Character>[];

          characters.forEach((character) => {
            let updated = false;

            // Ensure edition is set
            if (!character.edition) {
              character.edition = '2014';
              updated = true;
            }
            
            // Ensure species is set (legacy 'race' fallback)
            if (!character.species && character.race) {
               character.species = character.race;
               // We keep 'race' for now as per plan to prevent breakage, but strictly use species in 2024 logic
               updated = true;
            }

            if (updated) {
              characterStore.put(character);
            }
          });
        };
        
        getAllRequest.onerror = () => {
           log.error('DB migration failed upgrading to v7', { error: getAllRequest.error });
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
    log.warn('Character loaded without edition; defaulting to 2014', { characterId: character.id, name: character.name });
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(character);

    request.onerror = () => {
      log.error('Failed to add character to IndexedDB', { error: request.error });
      reject(request.error);
    };
    request.onsuccess = () => {
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
  // Validate encounter data
  if (!encounter.id || !encounter.name || !Array.isArray(encounter.monsterIds)) {
    throw new Error('Invalid encounter data: missing required fields');
  }

  if (encounter.monsterIds.length === 0) {
    throw new Error('Cannot save encounter with no monsters');
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      // Check if encounters store exists
      if (!db.objectStoreNames.contains(ENCOUNTERS_STORE)) {
        log.error('Encounters store not found in database');
        reject(new Error('Database not properly initialized. Please refresh the page or clear your browser data.'));
        return;
      }

      const transaction = db.transaction([ENCOUNTERS_STORE], 'readwrite');

      transaction.onerror = () => {
        const errorMsg = transaction.error?.message || 'Database transaction failed';
        log.error('Encounter save transaction error', { error: errorMsg });
        reject(new Error(`Database error: ${errorMsg}`));
      };

      const objectStore = transaction.objectStore(ENCOUNTERS_STORE);
      const request = objectStore.put(encounter);

      request.onerror = () => {
        const errorMsg = request.error?.message || 'Failed to save encounter';
        log.error('Encounter save request error', { error: errorMsg });
        reject(new Error(`Save failed: ${errorMsg}`));
      };

      request.onsuccess = () => resolve(encounter.id);
    });
  } catch (err) {
    log.error('Database open error', { error: err });
    throw new Error('Failed to open database. Please refresh the page.');
  }
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
