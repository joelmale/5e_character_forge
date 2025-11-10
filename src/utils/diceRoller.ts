// Dice roll types and utilities for 5e Character Forge

export interface DiceRoll {
  id: string;
  type: 'ability' | 'skill' | 'initiative';
  label: string;           // "STR Check" or "Acrobatics"
  notation: string;        // "1d20+3"
  diceResults: number[];   // [15]
  modifier: number;        // 3
  total: number;          // 18
  critical?: 'success' | 'failure';
  timestamp: number;
}

/**
 * Roll dice with specified count and sides
 * @param count Number of dice to roll
 * @param sides Number of sides on each die
 * @returns Array of individual dice results
 */
export function rollDice(count: number, sides: number): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * sides) + 1);
  }
  return results;
}

/**
 * Calculate D&D 5e ability modifier from ability score
 * @param score Ability score (1-30)
 * @returns Modifier (-5 to +10)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Detect if a roll is a critical success or failure
 * Only applies to d20 rolls
 * @param value The die value
 * @param sides The number of sides on the die
 * @returns 'success' for nat 20, 'failure' for nat 1, undefined otherwise
 */
export function detectCritical(
  value: number,
  sides: number
): 'success' | 'failure' | undefined {
  if (sides !== 20) return undefined;
  if (value === 20) return 'success';
  if (value === 1) return 'failure';
  return undefined;
}

/**
 * Create a dice roll for an ability check
 * @param abilityName The ability being checked (STR, DEX, etc.)
 * @param abilityScore The ability score
 * @returns DiceRoll object
 */
export function createAbilityRoll(
  abilityName: string,
  abilityScore: number
): DiceRoll {
  const modifier = calculateModifier(abilityScore);
  const diceResults = rollDice(1, 20);
  const dieValue = diceResults[0];
  const total = dieValue + modifier;
  const critical = detectCritical(dieValue, 20);

  return {
    id: crypto.randomUUID(),
    type: 'ability',
    label: `${abilityName} Check`,
    notation: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
    diceResults,
    modifier,
    total,
    critical,
    timestamp: Date.now(),
  };
}

/**
 * Create a dice roll for a skill check
 * @param skillName The skill being checked
 * @param skillValue The total skill modifier (ability + proficiency if applicable)
 * @returns DiceRoll object
 */
export function createSkillRoll(
  skillName: string,
  skillValue: number
): DiceRoll {
  const diceResults = rollDice(1, 20);
  const dieValue = diceResults[0];
  const total = dieValue + skillValue;
  const critical = detectCritical(dieValue, 20);

  return {
    id: crypto.randomUUID(),
    type: 'skill',
    label: skillName,
    notation: `1d20${skillValue >= 0 ? '+' : ''}${skillValue}`,
    diceResults,
    modifier: skillValue,
    total,
    critical,
    timestamp: Date.now(),
  };
}

/**
 * Create a dice roll for initiative
 * @param initiativeModifier The initiative modifier
 * @returns DiceRoll object
 */
export function createInitiativeRoll(initiativeModifier: number): DiceRoll {
  const diceResults = rollDice(1, 20);
  const dieValue = diceResults[0];
  const total = dieValue + initiativeModifier;
  const critical = detectCritical(dieValue, 20);

  return {
    id: crypto.randomUUID(),
    type: 'initiative',
    label: 'Initiative',
    notation: `1d20${initiativeModifier >= 0 ? '+' : ''}${initiativeModifier}`,
    diceResults,
    modifier: initiativeModifier,
    total,
    critical,
    timestamp: Date.now(),
  };
}

/**
 * Format a dice roll for display
 * @param roll The dice roll to format
 * @returns Formatted string
 */
export function formatDiceRoll(roll: DiceRoll): string {
  const criticalClass = roll.critical === 'success'
    ? 'text-green-400 font-bold'
    : roll.critical === 'failure'
    ? 'text-red-400 font-bold'
    : '';

  return `<span class="${criticalClass}">${roll.label}: ${roll.notation} → ${roll.total}</span>`;
}

/**
 * Get roll history from localStorage
 * @returns Array of dice rolls (max 10)
 */
export function getRollHistory(): DiceRoll[] {
  try {
    const stored = localStorage.getItem('5e-forge-rolls');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading roll history:', error);
    return [];
  }
}

/**
 * Save roll history to localStorage
 * @param rolls Array of dice rolls to save
 */
export function saveRollHistory(rolls: DiceRoll[]): void {
  try {
    // Keep only last 10 rolls
    const trimmed = rolls.slice(-10);
    localStorage.setItem('5e-forge-rolls', JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving roll history:', error);
  }
}

/**
 * Add a roll to history
 * @param roll The roll to add
 * @returns Updated roll history
 */
export function addRollToHistory(roll: DiceRoll): DiceRoll[] {
  const history = getRollHistory();
  history.push(roll);
  const updated = history.slice(-10); // Keep last 10
  saveRollHistory(updated);
  return updated;
}

/**
 * Clear roll history
 */
export function clearRollHistory(): void {
  localStorage.removeItem('5e-forge-rolls');
}
