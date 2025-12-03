/**
 * Equipment Inventory Builder Pattern
 *
 * This is a proposed refactoring to reduce cyclomatic complexity
 * in characterCalculator.ts from 37 to ~15.
 *
 * Current complexity in equipment section: ~18 decision points
 * New complexity with builder: ~5 decision points in main function
 *                               + 4-5 in each builder method (testable separately)
 */

import { EquippedItem, CharacterCreationData } from '../types/dnd';
import { loadEquipment, EQUIPMENT_PACKAGES } from '../services/dataService';
import type { Equipment, EquipmentPackage } from '../types/dnd';

interface EquipmentChoice {
  selected: number | null;
  options: Array<Array<{ name: string; quantity: number }>>;
}

interface EquipmentProcessingResult {
  inventory: EquippedItem[];
  equippedArmor: string | undefined;
  equippedWeapons: string[];
}

/**
 * Builder class for constructing character equipment inventory
 *
 * Complexity: Each method has 3-5 decision points (testable independently)
 * vs. original 18 decision points in one block
 */
export class EquipmentInventoryBuilder {
  private inventory: EquippedItem[] = [];
  private equippedArmor?: string;
  private equippedWeapons: string[] = [];

  // Cache equipment lookups to avoid repeated database queries
  private equipmentCache = new Map<string, Equipment>();

  /**
   * Add items from the character's starting equipment package
   * Complexity: 4 decision points (forEach, ||, if+&&, if, else if)
   */
  addFromPackage(pkg: EquipmentPackage): this {
    pkg.items.forEach(item => {
      const itemSlug = this.normalizeItemSlug(item);

      this.addItemToInventory(itemSlug, item.quantity, item.equipped || false);

      // Track equipped armor and weapons
      if (item.equipped) {
        this.trackEquippedItem(itemSlug);
      }
    });

    return this;
  }

  /**
   * Add items from class equipment choices
   * Complexity: 5 decision points (forEach, if, forEach, callback||, if)
   */
  addFromChoices(choices: EquipmentChoice[]): this {
    choices.forEach(choice => {
      if (choice.selected === null) return;

      const selectedBundle = choice.options[choice.selected];

      selectedBundle.forEach(item => {
        const equipment = this.findEquipmentByName(item.name);

        if (equipment) {
          this.addItemToInventory(equipment.slug, item.quantity, false);
        }
      });
    });

    return this;
  }

  /**
   * Add custom starting inventory (from equipment browser in wizard)
   * Complexity: 4 decision points (if, forEach, find, if/else)
   */
  addFromStartingInventory(startingInventory?: EquippedItem[]): this {
    if (!startingInventory) return this;

    startingInventory.forEach(item => {
      this.mergeOrAddItem(item);
    });

    return this;
  }

  /**
   * Build and return the final equipment processing result
   * Complexity: 1 (no decision points)
   */
  build(): EquipmentProcessingResult {
    return {
      inventory: this.inventory,
      equippedArmor: this.equippedArmor,
      equippedWeapons: this.equippedWeapons,
    };
  }

  // ===================================================================
  // Private Helper Methods
  // ===================================================================

  /**
   * Add an item to the inventory
   * Complexity: 1 (no decision points)
   */
  private addItemToInventory(slug: string, quantity: number, equipped: boolean): void {
    this.inventory.push({
      equipmentSlug: slug,
      quantity,
      equipped,
    });
  }

  /**
   * Track equipped armor and weapons
   * Complexity: 3 (if, if, else if)
   */
  private trackEquippedItem(slug: string): void {
    const equipment = this.getEquipmentFromCache(slug);

    if (!equipment) return;

    if (equipment.armor_category) {
      this.equippedArmor = slug;
    } else if (equipment.weapon_category) {
      this.equippedWeapons.push(slug);
    }
  }

  /**
   * Merge item quantity if exists, otherwise add new item
   * Complexity: 2 (find, if/else)
   */
  private mergeOrAddItem(item: EquippedItem): void {
    const existingItem = this.inventory.find(
      inv => inv.equipmentSlug === item.equipmentSlug
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.inventory.push({
        equipmentSlug: item.equipmentSlug,
        quantity: item.quantity,
        equipped: item.equipped || false,
      });
    }
  }

  /**
   * Get equipment from cache (with lazy loading)
   * Complexity: 2 (if, if)
   */
  private getEquipmentFromCache(slug: string): Equipment | undefined {
    if (!this.equipmentCache.has(slug)) {
      const equipment = loadEquipment().find(eq => eq.slug === slug);

      if (equipment) {
        this.equipmentCache.set(slug, equipment);
      }
    }

    return this.equipmentCache.get(slug);
  }

  /**
   * Find equipment by name (handles slug generation)
   * Complexity: 2 (find with || callback)
   */
  private findEquipmentByName(name: string): Equipment | undefined {
    const normalizedSlug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return loadEquipment().find(eq =>
      eq.slug === normalizedSlug || eq.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Normalize item slug from package item
   * Complexity: 1 (||)
   */
  private normalizeItemSlug(item: { slug?: string; name: string }): string {
    return item.slug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
}

// ===================================================================
// Public API Functions
// ===================================================================

/**
 * Process all equipment for character creation
 *
 * Complexity: 2 decision points (find||, builder chain)
 *
 * @param data - Character creation data
 * @param level - Character level
 * @returns Equipment processing result with inventory and equipped items
 */
export const processEquipment = (
  data: CharacterCreationData,
  level: number
): EquipmentProcessingResult => {
  const equipmentPackage =
    EQUIPMENT_PACKAGES.find(pkg => pkg.level === level) || EQUIPMENT_PACKAGES[0];

  return new EquipmentInventoryBuilder()
    .addFromPackage(equipmentPackage)
    .addFromChoices(data.equipmentChoices)
    .addFromStartingInventory(data.startingInventory)
    .build();
};

/**
 * Alternative: Functional approach without builder
 *
 * Complexity: Still ~15, but more functional style
 */
export const processEquipmentFunctional = (
  data: CharacterCreationData,
  level: number
): EquipmentProcessingResult => {
  const equipmentPackage =
    EQUIPMENT_PACKAGES.find(pkg => pkg.level === level) || EQUIPMENT_PACKAGES[0];

  // Process package items
  const packageInventory = processPackageItems(equipmentPackage);

  // Process choice items
  const choiceInventory = processChoiceItems(data.equipmentChoices);

  // Merge starting inventory
  const finalInventory = mergeStartingInventory(
    [...packageInventory.inventory, ...choiceInventory.inventory],
    data.startingInventory
  );

  return {
    inventory: finalInventory,
    equippedArmor: packageInventory.equippedArmor,
    equippedWeapons: packageInventory.equippedWeapons,
  };
};

// ===================================================================
// Functional Helper Functions
// ===================================================================

function processPackageItems(pkg: EquipmentPackage): EquipmentProcessingResult {
  const inventory: EquippedItem[] = [];
  let equippedArmor: string | undefined;
  const equippedWeapons: string[] = [];

  pkg.items.forEach(item => {
    const itemSlug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    inventory.push({
      equipmentSlug: itemSlug,
      quantity: item.quantity,
      equipped: item.equipped || false,
    });

    if (item.equipped) {
      const equipment = loadEquipment().find(eq => eq.slug === itemSlug);

      if (equipment?.armor_category) {
        equippedArmor = itemSlug;
      } else if (equipment?.weapon_category) {
        equippedWeapons.push(itemSlug);
      }
    }
  });

  return { inventory, equippedArmor, equippedWeapons };
}

function processChoiceItems(choices: EquipmentChoice[]): EquipmentProcessingResult {
  const inventory: EquippedItem[] = [];

  choices.forEach(choice => {
    if (choice.selected === null) return;

    const selectedBundle = choice.options[choice.selected];

    selectedBundle.forEach(item => {
      const equipmentSlug = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const foundEquipment = loadEquipment().find(eq =>
        eq.slug === equipmentSlug || eq.name.toLowerCase() === item.name.toLowerCase()
      );

      if (foundEquipment) {
        inventory.push({
          equipmentSlug: foundEquipment.slug,
          quantity: item.quantity,
          equipped: false,
        });
      }
    });
  });

  return { inventory, equippedArmor: undefined, equippedWeapons: [] };
}

function mergeStartingInventory(
  inventory: EquippedItem[],
  startingInventory?: EquippedItem[]
): EquippedItem[] {
  if (!startingInventory) return inventory;

  const result = [...inventory];

  startingInventory.forEach(item => {
    const existingItem = result.find(inv => inv.equipmentSlug === item.equipmentSlug);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      result.push(item);
    }
  });

  return result;
}

// ===================================================================
// Usage Example in characterCalculator.ts
// ===================================================================

/*
// BEFORE (Complexity: ~18 in main function)
export const calculateCharacterStats = (data: CharacterCreationData): Character => {
  // ... other code ...

  const inventory: EquippedItem[] = [];
  let equippedArmor: string | undefined;
  const equippedWeapons: string[] = [];

  const equipmentPackage = EQUIPMENT_PACKAGES.find(pkg => pkg.level === level) || EQUIPMENT_PACKAGES[0];

  equipmentPackage.items.forEach(item => {
    const itemSlug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    inventory.push({
      equipmentSlug: itemSlug,
      quantity: item.quantity,
      equipped: item.equipped || false,
    });

    const equipment = loadEquipment().find(eq => eq.slug === itemSlug);
    if (item.equipped && equipment) {
      if (equipment.armor_category) {
        equippedArmor = itemSlug;
      } else if (equipment.weapon_category) {
        equippedWeapons.push(itemSlug);
      }
    }
  });

  data.equipmentChoices.forEach(choice => {
    if (choice.selected !== null) {
      const selectedBundle = choice.options[choice.selected];
      selectedBundle.forEach(item => {
        const equipmentSlug = item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const foundEquipment = loadEquipment().find(eq =>
          eq.slug === equipmentSlug || eq.name.toLowerCase() === item.name.toLowerCase()
        );

        if (foundEquipment) {
          inventory.push({
            equipmentSlug: foundEquipment.slug,
            quantity: item.quantity,
            equipped: false,
          });
        }
      });
    }
  });

  if (data.startingInventory) {
    data.startingInventory.forEach(item => {
      const existingItem = inventory.find(inv => inv.equipmentSlug === item.equipmentSlug);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        inventory.push({
          equipmentSlug: item.equipmentSlug,
          quantity: item.quantity,
          equipped: item.equipped || false,
        });
      }
    });
  }

  // ... rest of code ...
}

// AFTER (Complexity: ~2 in main function)
export const calculateCharacterStats = (data: CharacterCreationData): Character => {
  // ... other code ...

  const { inventory, equippedArmor, equippedWeapons } = processEquipment(data, level);

  // ... rest of code ...
}
*/

// ===================================================================
// Unit Tests Example
// ===================================================================

/*
// With builder pattern, each method can be tested independently

describe('EquipmentInventoryBuilder', () => {
  describe('addFromPackage', () => {
    it('should add all items from package to inventory', () => {
      const builder = new EquipmentInventoryBuilder();
      const pkg = {
        level: 1,
        startingGold: 100,
        items: [
          { name: 'Longsword', quantity: 1, equipped: true, slug: 'longsword' },
          { name: 'Shield', quantity: 1, equipped: false, slug: 'shield' },
        ],
      };

      const result = builder.addFromPackage(pkg).build();

      expect(result.inventory).toHaveLength(2);
      expect(result.inventory[0].equipmentSlug).toBe('longsword');
      expect(result.inventory[0].equipped).toBe(true);
    });

    it('should track equipped weapons', () => {
      const builder = new EquipmentInventoryBuilder();
      const pkg = {
        level: 1,
        startingGold: 100,
        items: [
          { name: 'Longsword', quantity: 1, equipped: true, slug: 'longsword' },
        ],
      };

      const result = builder.addFromPackage(pkg).build();

      expect(result.equippedWeapons).toContain('longsword');
    });
  });

  describe('mergeOrAddItem', () => {
    it('should merge quantities for existing items', () => {
      const builder = new EquipmentInventoryBuilder();

      builder.addFromStartingInventory([
        { equipmentSlug: 'torch', quantity: 5, equipped: false },
      ]);

      builder.addFromStartingInventory([
        { equipmentSlug: 'torch', quantity: 3, equipped: false },
      ]);

      const result = builder.build();
      const torch = result.inventory.find(i => i.equipmentSlug === 'torch');

      expect(torch?.quantity).toBe(8);
    });
  });
});
*/
