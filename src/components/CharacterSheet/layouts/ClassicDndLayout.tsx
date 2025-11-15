import React, { useState } from 'react';
import { CharacterSheetProps } from '../../../types/components';
import {
  CharacterHeader,
  CombatStatsPanel,
  AbilityScores,
  SkillsSection,
  SavingThrows,
  AttacksAndActions,
  ExperiencePoints,
  AttunementSlots,
  ProficienciesAndLanguages,
  Conditions,
  CoinManagement,
  SpellcastingSection,
  EquipmentSection,
  FeaturesSection
} from '../index';
import { SpellPreparationModal } from '../../SpellPreparationModal';

/**
 * ClassicDndLayout
 *
 * Traditional D&D 5e character sheet layout with 3 columns:
 * - Left: Ability scores (large circles) + Skills
 * - Center: Combat stats, attacks, equipment
 * - Right: Features, proficiencies, personality traits
 */
export const ClassicDndLayout: React.FC<CharacterSheetProps> = ({
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
    <div className="p-4 md:p-8 bg-gray-900 text-gray-100 min-h-screen pb-24">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <CharacterHeader
          character={character}
          onClose={onClose}
          onDelete={onDelete}
          onShortRest={onShortRest}
          onLongRest={onLongRest}
          onLevelUp={onLevelUp}
          onLevelDown={onLevelDown}
        />

        {/* 3-Column Traditional Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* LEFT COLUMN - Ability Scores + Skills */}
          <div className="col-span-3 space-y-4">
            {/* Ability Scores - Classic circular design */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold text-center mb-4 text-gray-400 uppercase tracking-wider font-cinzel">
                 Ability Scores
               </h2>
              <AbilityScores
                character={character}
                setRollResult={setRollResult}
                onDiceRoll={onDiceRoll}
                onToggleInspiration={onToggleInspiration}
                layoutMode="classic"
              />
            </div>

            {/* Skills - Compact checklist */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold text-center mb-4 text-gray-400 uppercase tracking-wider font-cinzel">
                 Skills
               </h2>
              <SkillsSection
                character={character}
                setRollResult={setRollResult}
                onDiceRoll={onDiceRoll}
                layoutMode="classic"
              />
            </div>

            {/* Saving Throws */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold text-center mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Saving Throws
               </h2>
              <SavingThrows
                character={character}
                setRollResult={setRollResult}
                onDiceRoll={onDiceRoll}
                onUpdateCharacter={onUpdateCharacter}
                layoutMode="classic"
              />
            </div>
          </div>

          {/* CENTER COLUMN - Combat Stats, Attacks, Equipment */}
          <div className="col-span-6 space-y-4">
            {/* Combat Stats Panel - AC, Initiative, Speed, HP, Hit Dice, Death Saves */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <CombatStatsPanel
                 character={character}
                 setRollResult={setRollResult}
                 onDiceRoll={onDiceRoll}
                 onUpdateCharacter={onUpdateCharacter}
               />
             </div>

            {/* Conditions */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Conditions
               </h2>
              <Conditions
                character={character}
                onUpdateCharacter={onUpdateCharacter}
              />
            </div>

            {/* Attacks & Actions */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Attacks & Spellcasting
               </h2>
              <AttacksAndActions
                character={character}
                setRollResult={setRollResult}
                onDiceRoll={onDiceRoll}
              />
            </div>

            {/* Equipment */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Equipment
               </h2>
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
            </div>

            {/* Coin Management */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Currency
               </h2>
              <CoinManagement
                character={character}
                onUpdateCharacter={onUpdateCharacter}
              />
            </div>
          </div>

          {/* RIGHT COLUMN - Features, Proficiencies, Traits */}
          <div className="col-span-3 space-y-4">
            {/* Proficiencies & Languages */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Proficiencies & Languages
               </h2>
              <ProficienciesAndLanguages
                character={character}
              />
            </div>

            {/* Features & Traits */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Features & Traits
               </h2>
              <FeaturesSection
                character={character}
                onFeatureClick={onFeatureClick}
              />
            </div>

            {/* Experience & Attunement */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
               <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                 Progression
               </h2>
              <div className="space-y-4">
                <ExperiencePoints
                  character={character}
                  onUpdateCharacter={onUpdateCharacter}
                />
                <div className="border-t border-gray-700 pt-3">
                  <AttunementSlots character={character} />
                </div>
              </div>
            </div>

             {/* Spellcasting (if applicable) */}
             {character.spellcasting && (
               <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                 <h2 className="text-sm font-bold mb-3 text-gray-400 uppercase tracking-wider font-cinzel">
                   Spellcasting
                 </h2>
                <SpellcastingSection
                  character={character}
                  onUpdateCharacter={onUpdateCharacter}
                  onSpellPreparation={() => setShowSpellPreparationModal(true)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Spell Preparation Modal */}
        {character.spellcasting?.spellcastingType === 'prepared' && (
          <SpellPreparationModal
            character={character}
            availableSpells={[]}
            isOpen={showSpellPreparationModal}
            onClose={() => setShowSpellPreparationModal(false)}
            onSave={handleSpellPreparationSave}
          />
        )}
      </div>
    </div>
  );
};
