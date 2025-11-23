import React from 'react';
import { SelectionPoolWidgetProps, SkillOption, WeaponOption } from '../../../types/widgets';
import { loadEquipment } from '../../../services/dataService';
import { Equipment } from '../../../types/dnd';

/**
 * SelectionPoolWidget
 *
 * Reusable component for selecting multiple items from a pool.
 * Used for: Expertise (skills/tools), Weapon Mastery (weapons)
 *
 * Features:
 * - Multi-select with count limit
 * - Dynamic filtering based on proficiencies
 * - Visual feedback for selection state
 * - Displays relevant metadata (properties, mastery, etc.)
 */
export const SelectionPoolWidget: React.FC<SelectionPoolWidgetProps> = ({
  feature,
  data,
  currentSelection,
  onSelectionChange,
}) => {
  const config = feature.widget_config;

  // ============================================================================
  // Get Available Options Based on Source
  // ============================================================================

  const getAvailableOptions = (): (SkillOption | WeaponOption)[] => {
    switch (config.source) {
      case 'skills_and_tools':
        return getSkillAndToolOptions();
      case 'weapons':
        return getWeaponOptions();
      case 'skills':
        return getSkillOptions();
      default:
        return [];
    }
  };

  /**
   * Get skill and tool options for Expertise
   */
  const getSkillAndToolOptions = (): SkillOption[] => {
    const options: SkillOption[] = [];

    // Add background skills
    if (data.backgroundSkills) {
      data.backgroundSkills.forEach(skill => {
        options.push({
          id: skill,
          name: formatSkillName(skill),
          type: 'skill',
          source: 'background',
        });
      });
    }

    // Add class skills
    data.selectedSkills.forEach(skill => {
      // Avoid duplicates
      if (!options.some(opt => opt.id === skill)) {
        options.push({
          id: skill,
          name: formatSkillName(skill),
          type: 'skill',
          source: 'class',
        });
      }
    });

    // Add overflow skills (from duplicate handling)
    if (data.overflowSkills) {
      data.overflowSkills.forEach(skill => {
        if (!options.some(opt => opt.id === skill)) {
          options.push({
            id: skill,
            name: formatSkillName(skill),
            type: 'skill',
            source: 'class',
          });
        }
      });
    }

    // Add specific tools (e.g., Thieves' Tools for Rogue)
    if (config.include_tools) {
      config.include_tools.forEach(tool => {
        options.push({
          id: tool,
          name: formatToolName(tool),
          type: 'tool',
          source: 'class',
        });
      });
    }

    return options;
  };

  /**
   * Get skill options only
   */
  const getSkillOptions = (): SkillOption[] => {
    return getSkillAndToolOptions().filter(opt => opt.type === 'skill');
  };

  /**
   * Get weapon options for Weapon Mastery
   */
  const getWeaponOptions = (): WeaponOption[] => {
    const allEquipment = loadEquipment();
    const weapons = allEquipment.filter(eq => eq.equipment_category === 'Weapon');

    // Filter based on class proficiencies
    const proficientWeapons = weapons.filter(weapon => {
      return isWeaponProficient(weapon);
    });

    return proficientWeapons.map(weapon => ({
      slug: weapon.index,
      name: weapon.name,
      damage: weapon.damage?.damage_dice || '—',
      properties: weapon.properties?.map(p => p.name) || [],
      mastery: weapon.mastery,
      category: weapon.weapon_category as 'simple' | 'martial',
    }));
  };

  /**
   * Check if character is proficient with a weapon
   */
  const isWeaponProficient = (weapon: Equipment): boolean => {
    // Simple weapons - all Rogues have this
    if (weapon.weapon_category === 'Simple') {
      return true;
    }

    // Martial weapons - check for Finesse OR Light property (2024 Rogue rule)
    if (weapon.weapon_category === 'Martial') {
      const properties = weapon.properties?.map(p => p.index) || [];
      return properties.includes('finesse') || properties.includes('light');
    }

    return false;
  };

  // ============================================================================
  // Selection Handlers
  // ============================================================================

  const handleSelect = (id: string) => {
    if (currentSelection.includes(id)) {
      // Deselect
      onSelectionChange(currentSelection.filter(item => item !== id));
    } else if (currentSelection.length < config.count) {
      // Select (only if under limit)
      onSelectionChange([...currentSelection, id]);
    }
  };

  const isSelected = (id: string): boolean => {
    return currentSelection.includes(id);
  };

  const isMaxSelected = (): boolean => {
    return currentSelection.length >= config.count;
  };

  // ============================================================================
  // Rendering
  // ============================================================================

  const availableOptions = getAvailableOptions();

  return (
    <div className="selection-pool-widget mb-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-amber-400 mb-2">
          {feature.name}
        </h3>
        <p className="text-gray-300 text-sm mb-3">
          {feature.desc}
        </p>
        <div className="text-amber-400 text-sm font-semibold">
          Selected: {currentSelection.length} / {config.count}
          {currentSelection.length === config.count && ' ✓'}
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableOptions.map((option) => {
          const selected = isSelected('id' in option ? option.id : option.slug);
          const disabled = !selected && isMaxSelected();

          if ('type' in option) {
            // Skill/Tool Option
            return (
              <SkillCard
                key={option.id}
                option={option}
                selected={selected}
                disabled={disabled}
                onClick={() => handleSelect(option.id)}
              />
            );
          } else {
            // Weapon Option
            return (
              <WeaponCard
                key={option.slug}
                option={option}
                selected={selected}
                disabled={disabled}
                showMastery={config.show_mastery_property || false}
                onClick={() => handleSelect(option.slug)}
              />
            );
          }
        })}
      </div>

      {/* Validation Message */}
      {currentSelection.length === 0 && (
        <div className="mt-4 text-amber-400 text-sm">
          ⚠️ Please select {config.count} {config.source === 'weapons' ? 'weapons' : 'skills/tools'}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

interface SkillCardProps {
  option: SkillOption;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ option, selected, disabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-3 rounded-lg border-2 text-left transition-all
        ${selected
          ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50'
          : disabled
          ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
          : 'border-gray-600 bg-gray-800/50 hover:border-amber-400/50 hover:bg-gray-700/50 cursor-pointer'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-semibold text-white">
            {option.name}
            {selected && <span className="ml-2 text-amber-400">✓</span>}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {option.type === 'skill' ? 'Skill' : 'Tool'} • From {option.source}
          </div>
        </div>
      </div>
    </button>
  );
};

interface WeaponCardProps {
  option: WeaponOption;
  selected: boolean;
  disabled: boolean;
  showMastery: boolean;
  onClick: () => void;
}

const WeaponCard: React.FC<WeaponCardProps> = ({ option, selected, disabled, showMastery, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-3 rounded-lg border-2 text-left transition-all
        ${selected
          ? 'border-amber-400 bg-amber-400/20 shadow-lg shadow-amber-400/50'
          : disabled
          ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
          : 'border-gray-600 bg-gray-800/50 hover:border-amber-400/50 hover:bg-gray-700/50 cursor-pointer'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-white">
          {option.name}
          {selected && <span className="ml-2 text-amber-400">✓</span>}
        </div>
        <div className="text-xs text-gray-400 uppercase">
          {option.category}
        </div>
      </div>

      <div className="text-sm text-gray-300 mb-1">
        Damage: {option.damage}
      </div>

      {option.properties.length > 0 && (
        <div className="text-xs text-gray-400 mb-2">
          {option.properties.join(', ')}
        </div>
      )}

      {showMastery && option.mastery && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-xs font-semibold text-amber-400">
            ⚔️ Mastery: {formatMasteryName(option.mastery)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {getMasteryDescription(option.mastery)}
          </div>
        </div>
      )}
    </button>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format skill name from slug
 */
const formatSkillName = (skill: string): string => {
  const skillMap: Record<string, string> = {
    'Acrobatics': 'Acrobatics',
    'AnimalHandling': 'Animal Handling',
    'Arcana': 'Arcana',
    'Athletics': 'Athletics',
    'Deception': 'Deception',
    'History': 'History',
    'Insight': 'Insight',
    'Intimidation': 'Intimidation',
    'Investigation': 'Investigation',
    'Medicine': 'Medicine',
    'Nature': 'Nature',
    'Perception': 'Perception',
    'Performance': 'Performance',
    'Persuasion': 'Persuasion',
    'Religion': 'Religion',
    'SleightOfHand': 'Sleight of Hand',
    'Stealth': 'Stealth',
    'Survival': 'Survival',
  };

  return skillMap[skill] || skill;
};

/**
 * Format tool name from slug
 */
const formatToolName = (tool: string): string => {
  if (tool === 'thieves_tools') return "Thieves' Tools";
  return tool.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

/**
 * Format mastery property name
 */
const formatMasteryName = (mastery: string): string => {
  return mastery.charAt(0).toUpperCase() + mastery.slice(1);
};

/**
 * Get mastery property description
 */
const getMasteryDescription = (mastery: string): string => {
  const descriptions: Record<string, string> = {
    'nick': 'Make off-hand attack as part of Attack action',
    'vex': 'Advantage on next attack after dealing damage',
    'slow': 'Reduce target Speed by 10 feet',
    'sap': 'Target has Disadvantage on next attack',
    'push': 'Push target 10 feet on hit',
    'topple': 'Knock target prone on failed save',
    'graze': 'Deal damage equal to ability modifier on miss',
    'cleave': 'Deal damage to another creature in reach',
  };

  return descriptions[mastery.toLowerCase()] || 'Special weapon property';
};
