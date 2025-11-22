import React from 'react';
import { ArrowLeft, ArrowRight, Shuffle, ChevronDown, Dice6, Info } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { EquipmentPackage, TrinketData } from '../../../types/dnd';
import { loadClasses, BACKGROUNDS, EQUIPMENT_PACKAGES } from '../../../services/dataService';
import { validateEquipmentChoices } from '../../../utils/equipmentSelectionUtils';
import trinketTable from '../../../data/trinketTable.json';

interface EquipmentPackDisplayProps {
  pack: EquipmentPackage;
  isSelected?: boolean;
  onClick?: () => void;
  showRecommendation?: boolean;
  characterClass?: string;
}

const EquipmentPackDisplay: React.FC<EquipmentPackDisplayProps> = ({
  pack,
  isSelected = false,
  onClick,
  showRecommendation = false,
  characterClass
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const isRecommended = characterClass && pack.recommendedFor?.includes(characterClass);

  return (
    <div className={`border-2 rounded-lg transition-all ${
      isSelected
        ? 'bg-accent-blue-darker border-blue-500'
        : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
    }`}>
      <button
        onClick={onClick}
        className="w-full p-3 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-theme-primary font-medium">{pack.name}</span>
            {pack.startingGold && pack.startingGold > 0 && (
              <span className="text-accent-yellow-light text-sm">({pack.startingGold} gp)</span>
            )}
            {showRecommendation && isRecommended && (
              <span className="px-2 py-1 text-xs bg-accent-green-dark text-green-200 rounded">
                Recommended
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-theme-quaternary rounded"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-theme-primary mt-2 pt-2">
          <div className="text-xs text-theme-muted mb-2">Contents:</div>
          <ul className="text-sm space-y-1">
            {pack.items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between">
                <span className="text-theme-tertiary">
                  • {item.name}
                  {item.quantity > 1 && <span className="text-theme-muted ml-1">x{item.quantity}</span>}
                </span>
                {item.equipped && (
                  <span className="text-xs text-accent-green-light">(equipped)</span>
                )}
              </li>
            ))}
          </ul>
          {pack.description && (
            <p className="text-xs text-theme-disabled mt-2 italic">{pack.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

const RandomizeButton: React.FC<{ onClick: () => void; title?: string; className?: string }> = ({
  onClick,
  title = "Randomize this section",
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 bg-accent-purple hover:bg-accent-purple-light rounded-lg text-theme-primary text-sm font-medium transition-colors flex items-center gap-2 ${className}`}
      title={title}
    >
      <Shuffle className="w-4 h-4" />
      Randomize
    </button>
  );
};

export const Step6Equipment: React.FC<StepProps & { skipToStep?: (step: number) => void }> = ({
  data,
  updateData,
  nextStep,
  prevStep,
  skipToStep,
  getNextStepLabel
}) => {
  const allClasses = loadClasses();
  const selectedClass = allClasses.find(c => c.slug === data.classSlug);

  // Trinket rolling state
  const [useExtendedTrinkets, setUseExtendedTrinkets] = React.useState(false);
  const [rolledTrinket, setRolledTrinket] = React.useState<TrinketData | null>(data.selectedTrinket || null);

  if (!selectedClass) {
    return <div>Loading...</div>;
  }

  // Initialize equipment choices if not already set
  const equipmentChoices = data.equipmentChoices || [];
  if (equipmentChoices.length === 0 && Array.isArray(selectedClass.equipment_choices) && selectedClass.equipment_choices.length > 0) {
    updateData({ equipmentChoices: selectedClass.equipment_choices });
  }

  const handleEquipmentChoice = (choiceId: string, optionIndex: number) => {
    const currentChoices = data.equipmentChoices || [];
    const updatedChoices = currentChoices.map(choice =>
      choice.choiceId === choiceId ? { ...choice, selected: optionIndex } : choice
    );
    updateData({ equipmentChoices: updatedChoices });
  };

  const allChoicesMade = validateEquipmentChoices(data.equipmentChoices || []);

  // Trinket rolling function
  const rollForTrinket = () => {
    const maxRoll = useExtendedTrinkets ? 200 : 100;
    const roll = Math.floor(Math.random() * maxRoll) + 1;
    const trinket = (trinketTable as TrinketData[]).find(t => t.roll === roll);

    if (trinket) {
      updateData({ selectedTrinket: trinket });
      setRolledTrinket(trinket);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <h3 className='text-xl font-bold text-red-300'>Select Starting Equipment</h3>
          <p className="text-sm text-theme-muted mt-1">
            Choose your starting equipment based on your class. Your background will also grant additional items.
          </p>
        </div>
        <RandomizeButton
          onClick={() => {
            // Randomize equipment choices - this would need implementation

          }}
          title="Randomize equipment choices"
        />
      </div>

      {/* Equipment Choices */}
      {(data.equipmentChoices || []).map((choice, idx) => (
        <div key={choice.choiceId} className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-accent-yellow-light">
            {idx + 1}. {choice.description}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {choice.options.map((option, optionIdx) => {
              // Check if this option contains an equipment pack
              const packOption = option.find(item =>
                EQUIPMENT_PACKAGES.some(pack => pack.name === item.name)
              );
              const pack = packOption ? EQUIPMENT_PACKAGES.find(p => p.name === packOption.name) : null;

              if (pack) {
                // Display as expandable pack
                return (
                  <EquipmentPackDisplay
                    key={optionIdx}
                    pack={pack}
                    isSelected={choice.selected === optionIdx}
                    onClick={() => handleEquipmentChoice(choice.choiceId, optionIdx)}
                    showRecommendation={true}
                    characterClass={data.classSlug}
                  />
                );
              } else {
                // Display as regular equipment option
                return (
                  <button
                    key={optionIdx}
                    onClick={() => handleEquipmentChoice(choice.choiceId, optionIdx)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      choice.selected === optionIdx
                        ? 'bg-accent-blue-darker border-blue-500'
                        : 'bg-theme-tertiary border-theme-primary hover:bg-theme-quaternary'
                    }`}
                  >
                    <div className="space-y-1">
                      {option.map((item, itemIdx) => (
                        <div key={itemIdx} className="text-sm">
                          <span className="text-theme-primary font-medium">{item.name}</span>
                          {item.quantity > 1 && (
                            <span className="text-theme-muted ml-1">x{item.quantity}</span>
                          )}
                          {item.weight && item.weight > 0 && (
                            <span className="text-theme-disabled text-xs ml-2">({item.weight} lb)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              }
            })}
          </div>
        </div>
      ))}

      {/* Background Equipment Info */}
      {(() => {
        const backgroundData = BACKGROUNDS.find(bg => bg.name === data.background);
        if (backgroundData?.equipment) {
          return (
            <div className="p-3 bg-accent-green-darker/20 border border-accent-green-dark rounded-lg">
              <div className="text-xs font-semibold text-accent-green-light mb-2">
                Background Equipment (Auto-granted from {data.background}):
              </div>
              <div className="space-y-1">
                {Array.isArray(backgroundData.equipment)
                  ? backgroundData.equipment.map((item, index) => (
                    <div key={index} className="text-sm text-theme-tertiary">• {item}</div>
                  ))
                  : <p className="text-sm text-theme-tertiary">{backgroundData.equipment}</p>
                }
              </div>
            </div>
          );
        }
        return null;
      })()}

       {!allChoicesMade && (
         <div className="text-xs text-accent-yellow-light">
           ⚠️ Please make all equipment choices before continuing
         </div>
       )}

       {/* Fighter Build Recommendations */}
       {selectedClass?.slug === 'fighter' && (
         <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-4">
           <h4 className="text-lg font-bold text-accent-yellow-light">Fighter Build Recommendations</h4>
           <p className="text-xs text-theme-muted">
             Choose your starting equipment based on your preferred playstyle. Each build optimizes for different combat roles.
           </p>

           {/* Build 1: The Defender (Tank) */}
           <div className="border border-accent-green rounded-lg p-3 bg-green-900/10">
             <h5 className="font-semibold text-accent-green-light text-sm">Build 1: The Defender (Tank)</h5>
             <p className="text-xs text-theme-tertiary mt-1">Highest possible Armor Class from level 1. You are the party's protector.</p>
             <div className="text-xs text-theme-muted mt-2 space-y-1">
               <p><strong>Choice 1:</strong> (a) Chain Mail → Gives you 16 AC right away</p>
               <p><strong>Choice 2:</strong> (a) Martial weapon + shield → Shield gives +2 AC bonus</p>
               <p><strong>Choice 3:</strong> (b) Two handaxes → Strength-based ranged backup</p>
               <p><strong>Choice 4:</strong> (a) Dungeoneer's pack → Crowbar and utility items</p>
               <p className="text-accent-yellow-light font-medium mt-2">Result: 18 AC, solid melee weapon, ranged backup</p>
             </div>
           </div>

           {/* Build 2: The Striker (Two-Handed Damage) */}
           <div className="border border-accent-red rounded-lg p-3 bg-red-900/10">
             <h5 className="font-semibold text-accent-red-light text-sm">Build 2: The Striker (Two-Handed Damage)</h5>
             <p className="text-xs text-theme-tertiary mt-1">Maximum damage output, sacrificing some AC for power.</p>
             <div className="text-xs text-theme-muted mt-2 space-y-1">
               <p><strong>Choice 1:</strong> (a) Chain Mail → Best armor available (16 AC)</p>
               <p><strong>Choice 2:</strong> (b) Two martial weapons → Greatsword/Maul (2d6 damage)</p>
               <p><strong>Choice 3:</strong> (b) Two handaxes → Strength-based ranged backup</p>
               <p><strong>Choice 4:</strong> (a) Dungeoneer's pack → Utility items</p>
               <p className="text-accent-yellow-light font-medium mt-2">Result: 16 AC, highest damage dice, ranged backups</p>
             </div>
           </div>

           {/* Build 3: The Archer (Dexterity-Based) */}
           <div className="border border-accent-blue rounded-lg p-3 bg-blue-900/10">
             <h5 className="font-semibold text-accent-blue-light text-sm">Build 3: The Archer (Dexterity-Based)</h5>
             <p className="text-xs text-theme-tertiary mt-1">Ranged combat specialist using high Dexterity.</p>
             <div className="text-xs text-theme-muted mt-2 space-y-1">
               <p><strong>Choice 1:</strong> (b) Leather armor + longbow + 20 arrows</p>
               <p><strong>Choice 2:</strong> (a) Rapier + shield → Finesse melee backup</p>
               <p><strong>Choice 3:</strong> (a) Light crossbow → Sell for 25 gp</p>
               <p><strong>Choice 4:</strong> (a) Dungeoneer's pack → Rope/pitons for positioning</p>
               <p className="text-accent-yellow-light font-medium mt-2">Result: 14 AC, best bow, finesse melee option</p>
             </div>
           </div>

           {/* Build 4: Gold Option */}
           <div className="border border-accent-yellow rounded-lg p-3 bg-yellow-900/10">
             <h5 className="font-semibold text-accent-yellow-light text-sm">Pro-Tip: The Gold Option</h5>
             <p className="text-xs text-theme-tertiary mt-1">Take starting gold instead of equipment for maximum flexibility.</p>
             <div className="text-xs text-theme-muted mt-2 space-y-1">
               <p><strong>Average Gold:</strong> 175 gp (5d4 × 10)</p>
               <p><strong>Can Buy:</strong> Chain Mail (50 gp) + Greatsword (50 gp) + 2 Handaxes (10 gp) + Dungeoneer's Pack (12 gp)</p>
               <p><strong>Remaining:</strong> 53 gp for javelins, potions, etc.</p>
               <p className="text-accent-yellow-light font-medium mt-2">Advantage: More flexibility, potentially better gear</p>
             </div>
           </div>
         </div>
       )}

       {/* Trinket Rolling Section */}
       <div className="bg-theme-tertiary/50 border border-theme-primary rounded-lg p-4 space-y-3">
         <h4 className="text-lg font-bold text-accent-yellow-light">Roll for Trinket</h4>
         <p className="text-xs text-theme-muted">
           Optionally roll for a trinket from the Player's Handbook. Extended trinkets include additional items from The Wild Beyond the Witchlight.
         </p>

         {/* Extended Trinkets Checkbox */}
         <label className="flex items-center space-x-2 cursor-pointer">
           <input
             type="checkbox"
             checked={useExtendedTrinkets}
             onChange={(e) => setUseExtendedTrinkets(e.target.checked)}
             className="w-4 h-4 text-accent-blue bg-theme-tertiary border-theme-primary rounded focus:ring-blue-500 focus:ring-2"
           />
           <span className="text-sm text-theme-tertiary">Extended Trinkets</span>
           <span title="Trinkets from The Wild Beyond the Witchlight">
             <Info className="w-4 h-4 text-theme-muted" />
           </span>
         </label>

         {/* Roll Button */}
         <button
           onClick={rollForTrinket}
           className="flex items-center space-x-2 px-4 py-2 bg-accent-purple hover:bg-accent-purple-light rounded-lg text-theme-primary transition-colors"
         >
           <Dice6 className="w-4 h-4" />
           <span>Roll d{useExtendedTrinkets ? '200' : '100'}</span>
         </button>

         {/* Rolled Trinket Display */}
         {rolledTrinket && (
           <div className="bg-theme-secondary/50 border border-theme-primary rounded-lg p-3 space-y-2">
             <div className="flex items-center justify-between">
               <h5 className="text-sm font-semibold text-accent-yellow-light">
                 {rolledTrinket.short_name} (Roll: {rolledTrinket.roll})
               </h5>
               <span className="text-xs text-theme-disabled">{rolledTrinket.source}</span>
             </div>
             <p className="text-sm text-theme-tertiary leading-relaxed">
               {rolledTrinket.description}
             </p>
             <div className="border-t border-theme-primary pt-2">
               <p className="text-xs text-blue-300 italic">
                 {rolledTrinket.roleplay_prompt}
               </p>
             </div>
           </div>
         )}
       </div>

       <div className='flex justify-between items-center gap-3'>
        <button onClick={prevStep} className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-theme-primary flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
          disabled={!allChoicesMade}
          className="px-4 py-2 bg-accent-yellow-dark hover:bg-accent-yellow rounded-lg text-theme-primary flex items-center disabled:bg-theme-quaternary disabled:cursor-not-allowed"
        >
          {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
        <button
          onClick={() => {
            // Skip custom equipment step, go directly to traits (step 11)
            if (allChoicesMade && skipToStep) {
              skipToStep(11); // Skip to Traits/Final details step
            }
          }}
          disabled={!allChoicesMade}
          className="px-4 py-2 bg-accent-red hover:bg-accent-red-light rounded-lg text-theme-primary flex items-center disabled:bg-theme-quaternary disabled:cursor-not-allowed"
        >
          Skip to Traits <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};