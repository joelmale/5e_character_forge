import { Character, UserMonster, Encounter } from '../types/dnd';

// --- IndexedDB Configuration ---
const DB_NAME = '5e_character_forge';
const DB_VERSION = 7; // Version 7: Add ruleset/edition migration
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

          if (import.meta.env.DEV) console.log(`🔄 [DB Migration] Migrating ${characters.length} characters to version 3`);

          characters.forEach((character) => {
            // Only migrate if edition field is missing
            if (!character.edition) {
              if (import.meta.env.DEV) console.log(`  ✏️ Adding edition field to character: ${character.name}`);

              // Default to 2014 edition for existing characters
              // (they were created under 2014 rules)
              character.edition = '2014';

              // Update the character in the store
              characterStore.put(character);
            }
          });

          if (import.meta.env.DEV) console.log('✅ [DB Migration] Edition field migration complete');
        };

        getAllRequest.onerror = () => {
          console.error('❌ [DB Migration] Failed to migrate characters:', getAllRequest.error);
        };
      }

      // Version 4: Migrate existing characters to include resources
      if (oldVersion < 4 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as Character[];

          if (import.meta.env.DEV) console.log(`🔄 [DB Migration] Migrating ${characters.length} characters to version 4 (resources)`);

          characters.forEach((character) => {
            // Initialize or update resources for existing characters
            if (!character.resources || character.resources.length === 0) {
              if (import.meta.env.DEV) console.log(`  ✏️ Adding resources to character: ${character.name}`);
              character.resources = initializeCharacterResources(character);
              characterStore.put(character);
            }
          });

          if (import.meta.env.DEV) console.log('✅ [DB Migration] Resources migration complete');
        };

        getAllRequest.onerror = () => {
          console.error('❌ [DB Migration] Failed to migrate characters:', getAllRequest.error);
        };
      }

      // Version 5: Rename race field to species for existing characters
      if (oldVersion < 5 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as any[]; // Use any[] to handle legacy data

          if (import.meta.env.DEV) console.log(`🔄 [DB Migration] Migrating ${characters.length} characters to version 5 (race → species)`);

          characters.forEach((character) => {
            // Check if character has race field but not species field
            if (character.race && !character.species) {
              if (import.meta.env.DEV) console.log(`  ✏️ Renaming race to species for character: ${character.name}`);

              // Rename race field to species
              character.species = character.race;
              delete character.race;

              // Update the character in the store
              characterStore.put(character);
            }
          });

          if (import.meta.env.DEV) console.log('✅ [DB Migration] Race to species migration complete');
        };

        getAllRequest.onerror = () => {
          console.error('❌ [DB Migration] Failed to migrate characters:', getAllRequest.error);
        };
      }

      // Version 6: Add musical instrument proficiencies field
      if (oldVersion < 6 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as any[]; // Use any[] to handle legacy data

          if (import.meta.env.DEV) console.log(`🔄 [DB Migration] Migrating ${characters.length} characters to version 6 (add musical instruments)`);

          characters.forEach((character) => {
            // Initialize musical instrument proficiencies for bards
            if (character.class === 'Bard' && !character.featuresAndTraits?.musicalInstrumentProficiencies) {
              if (import.meta.env.DEV) console.log(`  ✏️ Adding musical instrument proficiencies for bard: ${character.name}`);

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

          if (import.meta.env.DEV) console.log('✅ [DB Migration] Musical instruments migration complete');
        };

        getAllRequest.onerror = () => {
          console.error('❌ [DB Migration] Failed to migrate characters:', getAllRequest.error);
        };
      } // Correctly closing the if (oldVersion < 6) block

      // Version 7: Ensure all characters have an edition field
      if (oldVersion < 7 && oldVersion > 0) {
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const characterStore = transaction.objectStore(STORE_NAME);

        const getAllRequest = characterStore.getAll();
        getAllRequest.onsuccess = () => {
          const characters = getAllRequest.result as any[];

          if (import.meta.env.DEV) console.log(`🔄 [DB Migration] Migrating ${characters.length} characters to version 7 (edition field)`);

          characters.forEach((character) => {
            let updated = false;
            
            // Ensure edition is set
            if (!character.edition) {
              if (import.meta.env.DEV) console.log(`  ✏️ Setting edition to '2014' for character: ${character.name}`);
              character.edition = '2014';
              updated = true;
            }
            
            // Ensure species is set (legacy 'race' fallback)
            if (!character.species && character.race) {
               if (import.meta.env.DEV) console.log(`  ✏️ Migrating 'race' to 'species' for character: ${character.name}`);
               character.species = character.race;
               // We keep 'race' for now as per plan to prevent breakage, but strictly use species in 2024 logic
               updated = true;
            }

            if (updated) {
              characterStore.put(character);
            }
          });

          if (import.meta.env.DEV) console.log('✅ [DB Migration] Version 7 migration complete');
        };
        
        getAllRequest.onerror = () => {
           console.error('❌ [DB Migration] Failed to migrate characters to v7:', getAllRequest.error);
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
  if (import.meta.env.DEV) console.log('💾 [DB] Adding character:', {
    id: character.id,
    name: character.name,
    species: character.species,
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
      if (import.meta.env.DEV) console.log('✅ [DB] Character added successfully');
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
