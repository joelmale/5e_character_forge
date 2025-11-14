import React, { useState } from 'react';
import { CharacterSheetProps } from '../../types/components';
import {
  CharacterHeader,
  CharacterStats,
  AbilityScores,
  SkillsSection,
  SavingThrows,
  AttacksAndActions,
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

        <CharacterStats
          character={character}
          setRollResult={setRollResult}
          onDiceRoll={onDiceRoll}
        />

        <AttacksAndActions
          character={character}
          setRollResult={setRollResult}
          onDiceRoll={onDiceRoll}
        />

        <SavingThrows
          character={character}
          setRollResult={setRollResult}
          onDiceRoll={onDiceRoll}
        />

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

        <SpellcastingSection
          character={character}
          onUpdateCharacter={onUpdateCharacter}
          onSpellPreparation={() => setShowSpellPreparationModal(true)}
        />

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