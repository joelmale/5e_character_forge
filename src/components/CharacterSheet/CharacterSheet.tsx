import React, { useState, useEffect } from 'react';
import { Shield, Sword, Dice6, Trophy, Zap, BookOpen, AlertTriangle, Coins, Sparkles, Package, Star } from 'lucide-react';
import { CharacterSheetProps } from '../../types/components';
import {
  CharacterHeader,
  CharacterStats,
  AbilityScores,
  SkillsSection,
  SavingThrows,
  AttacksAndActions,
  HitDice,
  ExperiencePoints,
  AttunementSlots,
  ProficienciesAndLanguages,
  Conditions,
  CoinManagement,
  CollapsibleSection,
  SpellcastingSection,
  EquipmentSection,
  FeaturesSection
} from './index';
import { SpellPreparationModal } from '../SpellPreparationModal';

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  character, onClose, onDelete, setRollResult, onDiceRoll, onToggleInspiration, onFeatureClick,
  onLongRest, onShortRest, onLevelUp, onLevelDown, onUpdateCharacter, onEquipArmor, onEquipWeapon, onUnequipItem,
  onAddItem, onRemoveItem, setEquipmentModal
}) => {
  const [showSpellPreparationModal, setShowSpellPreparationModal] = useState(false);

  // Collapse state management
  const getDefaultCollapsedState = (character: any) => ({
    'stats': false,      // Always expanded
    'savingThrows': false, // Core combat info
    'attacks': true,     // Collapsed by default
    'hitDice': character.hitDice.current === character.hitDice.max, // Collapse if full
    'experience': character.level >= 20, // Collapse if max level
    'attunement': character.level < 6, // Collapse if no slots
    'proficiencies': true,
    'conditions': !character.conditions?.length, // Expand if has conditions
    'coin': true,
    'spellcasting': !character.spellcasting,
    'equipment': true,
    'features': true
  });

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() =>
    getDefaultCollapsedState(character)
  );

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(`character-${character.id}-collapsed-sections`);
    if (saved) {
      try {
        setCollapsedSections(JSON.parse(saved));
      } catch (e) {
        // Fall back to defaults if parsing fails
        setCollapsedSections(getDefaultCollapsedState(character));
      }
    }
  }, [character.id]);

  // Save preferences
  useEffect(() => {
    localStorage.setItem(`character-${character.id}-collapsed-sections`, JSON.stringify(collapsedSections));
  }, [collapsedSections, character.id]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const expandAll = () => {
    setCollapsedSections(Object.keys(collapsedSections).reduce((acc, key) => ({
      ...acc,
      [key]: false
    }), {}));
  };

  const collapseAll = () => {
    setCollapsedSections(Object.keys(collapsedSections).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {}));
  };

  const handleSpellPreparationSave = (preparedSpells: string[]) => {
    onUpdateCharacter({
      ...character,
      spellcasting: {
        ...character.spellcasting!,
        preparedSpells
      }
    });
  };

  return (
    <div className="p-4 md:p-8 bg-gray-900 text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <CharacterHeader
          character={character}
          onClose={onClose}
          onDelete={onDelete}
          onShortRest={onShortRest}
          onLongRest={onLongRest}
          onLevelUp={onLevelUp}
          onLevelDown={onLevelDown}
        />

        {/* Global Section Controls */}
        <div className="flex gap-2 mb-4 p-3 bg-gray-800/50 rounded-lg">
          <button
            onClick={expandAll}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
            title="Expand all sections"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium transition-colors"
            title="Collapse all sections"
          >
            Collapse All
          </button>
          <span className="text-xs text-gray-400 self-center ml-4">
            {Object.values(collapsedSections).filter(Boolean).length} of {Object.keys(collapsedSections).length} sections collapsed
          </span>
        </div>

        <CharacterStats
          character={character}
          setRollResult={setRollResult}
          onDiceRoll={onDiceRoll}
        />

        <CollapsibleSection
          title="Conditions"
          icon={AlertTriangle}
          isCollapsed={collapsedSections.conditions}
          onToggle={() => toggleSection('conditions')}
          className="border-red-500 bg-red-900"
          badge={character.conditions?.length || 0}
        >
          <Conditions
            character={character}
            onUpdateCharacter={onUpdateCharacter}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Experience Points"
          icon={Trophy}
          isCollapsed={collapsedSections.experience}
          onToggle={() => toggleSection('experience')}
          className="border-indigo-500 bg-indigo-900"
        >
          <ExperiencePoints
            character={character}
            onUpdateCharacter={onUpdateCharacter}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Attacks & Actions"
          icon={Sword}
          isCollapsed={collapsedSections.attacks}
          onToggle={() => toggleSection('attacks')}
          className="border-red-500 bg-red-900"
        >
          <AttacksAndActions
            character={character}
            setRollResult={setRollResult}
            onDiceRoll={onDiceRoll}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Saving Throws"
          icon={Shield}
          isCollapsed={collapsedSections.savingThrows}
          onToggle={() => toggleSection('savingThrows')}
          className="border-orange-500 bg-orange-900"
        >
          <SavingThrows
            character={character}
            setRollResult={setRollResult}
            onDiceRoll={onDiceRoll}
          />
        </CollapsibleSection>

        {/* DEBUG: Saving Throws */}
        <div style={{backgroundColor: 'orange', color: 'white', padding: '20px', margin: '10px', border: '2px solid yellow'}}>
          <h2>DEBUG: SavingThrows Component Should Render Here</h2>
        </div>

        <SavingThrows
          character={character}
          setRollResult={setRollResult}
          onDiceRoll={onDiceRoll}
        />

        <CollapsibleSection
          title="Hit Dice"
          icon={Dice6}
          isCollapsed={collapsedSections.hitDice}
          onToggle={() => toggleSection('hitDice')}
          className="border-purple-500 bg-purple-900"
          badge={`${character.hitDice.current}/${character.hitDice.max}`}
        >
          <HitDice
            character={character}
            onUpdateCharacter={onUpdateCharacter}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Attunement Slots"
          icon={Zap}
          isCollapsed={collapsedSections.attunement}
          onToggle={() => toggleSection('attunement')}
          className="border-cyan-500 bg-cyan-900"
        >
          <AttunementSlots
            character={character}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Proficiencies & Languages"
          icon={BookOpen}
          isCollapsed={collapsedSections.proficiencies}
          onToggle={() => toggleSection('proficiencies')}
          className="border-emerald-500 bg-emerald-900"
        >
          <ProficienciesAndLanguages
            character={character}
          />
        </CollapsibleSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AbilityScores
            character={character}
            setRollResult={setRollResult}
            onDiceRoll={onDiceRoll}
            onToggleInspiration={onToggleInspiration}
          />

          <SkillsSection
            character={character}
            setRollResult={setRollResult}
            onDiceRoll={onDiceRoll}
          />
        </div>

        {character.spellcasting && (
          <CollapsibleSection
            title="Spellcasting"
            icon={Sparkles}
            isCollapsed={collapsedSections.spellcasting}
            onToggle={() => toggleSection('spellcasting')}
            className="border-purple-500 bg-purple-900"
          >
            <SpellcastingSection
              character={character}
              onUpdateCharacter={onUpdateCharacter}
              onSpellPreparation={() => setShowSpellPreparationModal(true)}
            />
          </CollapsibleSection>
        )}

        <CollapsibleSection
          title="Features & Traits"
          icon={Star}
          isCollapsed={collapsedSections.features}
          onToggle={() => toggleSection('features')}
          className="border-blue-500 bg-blue-900"
        >
          <FeaturesSection
            character={character}
            onFeatureClick={onFeatureClick}
          />
        </CollapsibleSection>

        <AttunementSlots
          character={character}
        />

        <CollapsibleSection
          title="Coin Pouch"
          icon={Coins}
          isCollapsed={collapsedSections.coin}
          onToggle={() => toggleSection('coin')}
          className="border-yellow-500 bg-yellow-900"
        >
          <CoinManagement
            character={character}
            onUpdateCharacter={onUpdateCharacter}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Equipment & Inventory"
          icon={Package}
          isCollapsed={collapsedSections.equipment}
          onToggle={() => toggleSection('equipment')}
          className="border-yellow-500 bg-yellow-900"
        >
          <EquipmentSection
            character={character}
            onUpdateCharacter={onUpdateCharacter}
            onEquipArmor={onEquipArmor}
            onEquipWeapon={onEquipWeapon}
            onUnequipItem={onUnequipItem}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            setEquipmentModal={setEquipmentModal}
          />
        </CollapsibleSection>

        <ProficienciesAndLanguages
          character={character}
        />

        <FeaturesSection
          character={character}
          onFeatureClick={onFeatureClick}
        />

        {character.spellcasting?.spellcastingType === 'prepared' && (
          <SpellPreparationModal
            character={character}
            availableSpells={[]} // TODO: Get from SPELL_DATABASE
            isOpen={showSpellPreparationModal}
            onClose={() => setShowSpellPreparationModal(false)}
            onSave={handleSpellPreparationSave}
          />
        )}
      </div>
    </div>
  );
};