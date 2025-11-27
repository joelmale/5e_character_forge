/**
 * Combat and Character Constants
 *
 * Centralizes magic numbers used throughout the application for combat calculations,
 * armor class, spell mechanics, and other D&D 5e rules.
 */

// ============================================================================
// Armor Class Constants
// ============================================================================

/**
 * Base armor class for an unarmored character (10 + DEX modifier)
 */
export const BASE_ARMOR_CLASS = 10;

/**
 * AC bonus provided by equipping a shield
 */
export const SHIELD_AC_BONUS = 2;

/**
 * Maximum DEX modifier bonus allowed when wearing medium armor
 */
export const MAX_DEX_BONUS_MEDIUM_ARMOR = 2;

// ============================================================================
// Spellcasting Constants
// ============================================================================

/**
 * Base value for spell save DC calculation (8 + ability modifier + proficiency bonus)
 */
export const SPELL_SAVE_DC_BASE = 8;

/**
 * Proficiency bonus at level 1 (used for initial spell DC calculations)
 */
export const LEVEL_1_PROFICIENCY_BONUS = 2;

// ============================================================================
// Equipment Constants
// ============================================================================

/**
 * Probability threshold for receiving bonus items during character creation
 * Value of 0.7 means 30% chance (when Math.random() > 0.7)
 */
export const BONUS_ITEM_PROBABILITY = 0.7;

/**
 * Quantity of items to receive when bonus item roll succeeds
 */
export const BONUS_ITEM_QUANTITY = 2;

/**
 * Standard quantity for regular item grants
 */
export const STANDARD_ITEM_QUANTITY = 1;

// ============================================================================
// Ability Score Constants
// ============================================================================

/**
 * Base value used in ability modifier calculation: (score - 10) / 2
 */
export const ABILITY_SCORE_BASE = 10;

/**
 * Divisor used in ability modifier calculation: (score - 10) / 2
 */
export const ABILITY_MODIFIER_DIVISOR = 2;

/**
 * Maximum ability score achievable through normal means (before magic items)
 */
export const MAX_ABILITY_SCORE = 20;

/**
 * Minimum ability score (typically lowest possible roll)
 */
export const MIN_ABILITY_SCORE = 3;
