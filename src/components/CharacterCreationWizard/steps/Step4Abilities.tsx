import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Dice6, Shuffle } from 'lucide-react';
import { StepProps } from '../types/wizard.types';
import { CharacterCreationData, AbilityName } from '../../../types/dnd';
import { getAllRaces, randomizeAbilities, getModifier } from '../../../services/dataService';
import { rollDice } from '../../../services/diceService';
import {
  ABILITY_NAMES,
  STANDARD_ARRAY_SCORES,
  POINT_BUY_COSTS,
  ABILITY_METHOD_TITLES,
  calculatePointBuyCost,
  isValidPointBuyChange,
  getAvailableStandardArrayScores,
  areAbilityScoresComplete
} from '../../../utils/abilityScoreUtils';

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

const formatModifier = (mod: number): string => mod >= 0 ? `+${mod}` : `${mod}`;

export const Step4Abilities: React.FC<StepProps> = ({ data, updateData, nextStep, prevStep, getNextStepLabel }) => {
  const allRaces = getAllRaces();
  const raceData = allRaces.find(r => r.slug === data.raceSlug);
  const abilityNames = ABILITY_NAMES;

  // Method-specific data
  const standardArrayScores = useMemo(() => STANDARD_ARRAY_SCORES, []);
  const [pointBuyPoints, setPointBuyPoints] = useState(27);
  const [rolledSets, setRolledSets] = useState<number[][]>([]);

  // Check if abilities are complete
  const isComplete = areAbilityScoresComplete(data.abilities);

  // Handle method change
  const handleMethodChange = (method: CharacterCreationData['abilityScoreMethod']) => {
    const resetAbilities = method === 'point-buy'
      ? { STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 }
      : { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 };

    updateData({
      abilityScoreMethod: method,
      abilities: resetAbilities
    });
    setRolledSets([]);
    setPointBuyPoints(27);
  };

  // Standard Array: assign scores from predefined array
  const availableScores = getAvailableStandardArrayScores(Object.values(data.abilities));

  const handleAssignScore = (ability: AbilityName, score: number) => {
    const currentScore = data.abilities[ability];

    if (currentScore === 0 && availableScores.includes(score)) {
      updateData({ abilities: { ...data.abilities, [ability]: score } });
      return;
    }

    const abilityToSwap = abilityNames.find(a => data.abilities[a] === score);

    if (abilityToSwap) {
      updateData({
        abilities: {
          ...data.abilities,
          [ability]: score,
          [abilityToSwap]: currentScore
        }
      });
    }
  };

  // Dice rolling methods
  const rollAbilityScores = (method: 'standard-roll' | 'classic-roll' | '5d6-drop-2') => {
    const sets: number[][] = [];

    for (let i = 0; i < 6; i++) {
      let rolls: number[];

      if (method === 'standard-roll') {
        // 4d6, drop lowest
        rolls = rollDice(4, 6).sort((a, b) => b - a).slice(0, 3);
      } else if (method === 'classic-roll') {
        // 3d6 straight
        rolls = rollDice(3, 6);
      } else {
        // 5d6, drop two lowest
        rolls = rollDice(5, 6).sort((a, b) => b - a).slice(0, 3);
      }

      sets.push(rolls);
    }

    setRolledSets(sets);

    // Auto-assign in order for classic roll
    if (method === 'classic-roll') {
      const scores = sets.map(s => s.reduce((a, b) => a + b, 0));
      updateData({
        abilities: {
          STR: scores[0],
          DEX: scores[1],
          CON: scores[2],
          INT: scores[3],
          WIS: scores[4],
          CHA: scores[5]
        }
      });
    }
  };

  // Assign rolled score
  const handleAssignRolledScore = (ability: AbilityName, setIndex: number) => {
    const score = rolledSets[setIndex].reduce((a, b) => a + b, 0);
    const currentScore = data.abilities[ability];

    // Find if this score is already assigned
    const assignedIndex = abilityNames.findIndex(a => {
      const abilityScore = data.abilities[a];
      return rolledSets.findIndex(set => set.reduce((sum, n) => sum + n, 0) === abilityScore) === setIndex;
    });

    if (assignedIndex !== -1) {
      // Swap
      const otherAbility = abilityNames[assignedIndex];
      updateData({
        abilities: {
          ...data.abilities,
          [ability]: score,
          [otherAbility]: currentScore
        }
      });
    } else {
      updateData({ abilities: { ...data.abilities, [ability]: score } });
    }
  };

  const handlePointBuyChange = (ability: AbilityName, newScore: number) => {
    const oldScore = data.abilities[ability];
    const pointDiff = calculatePointBuyCost(oldScore, newScore);

    if (isValidPointBuyChange(oldScore, newScore, pointBuyPoints)) {
      updateData({ abilities: { ...data.abilities, [ability]: newScore } });
      setPointBuyPoints(pointBuyPoints - pointDiff);
    }
  };

  // Custom input
  const handleCustomInput = (ability: AbilityName, value: string) => {
    const score = parseInt(value) || 0;
    if (score >= 0 && score <= 20) {
      updateData({ abilities: { ...data.abilities, [ability]: score } });
    }
  };

  return (
    <div className='space-y-6'>
      {/* Method Selection Dropdown */}
      <div>
        <label className="block text-sm font-medium text-theme-tertiary mb-2">Ability Score Method</label>
        <select
          value={data.abilityScoreMethod}
          onChange={(e) => handleMethodChange(e.target.value as CharacterCreationData['abilityScoreMethod'])}
          className="w-full p-3 bg-theme-tertiary text-theme-primary rounded-lg font-semibold text-lg"
        >
          {Object.entries(ABILITY_METHOD_TITLES).map(([key, title]) => (
            <option key={key} value={key}>{title}</option>
          ))}
        </select>
      </div>

      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold text-red-300'>
          Determine Ability Scores ({ABILITY_METHOD_TITLES[data.abilityScoreMethod]})
        </h3>
        <RandomizeButton
          onClick={() => {
            const abilities = randomizeAbilities();
            updateData(abilities);
          }}
          title="Randomize ability scores and method"
        />
      </div>

      {/* Standard Array UI */}
      {data.abilityScoreMethod === 'standard-array' && (
        <>
          <div className='flex flex-wrap gap-2 mb-4 p-3 bg-theme-tertiary rounded-lg'>
            <span className='text-sm font-semibold text-theme-muted mr-2'>Scores to Assign:</span>
            {standardArrayScores.map(s => (
              <span key={s} className={`px-3 py-1 text-lg font-bold rounded-full ${availableScores.includes(s) ? 'bg-accent-yellow text-gray-900' : 'bg-theme-quaternary text-theme-muted'}`}>
                {s}
              </span>
            ))}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {abilityNames.map(ability => {
              const baseScore = data.abilities[ability];
              const racialBonus = raceData?.ability_bonuses[ability] || 0;
              const finalScore = baseScore + racialBonus;
              const modifier = getModifier(finalScore);

              return (
                <div key={ability} className='p-3 bg-theme-secondary rounded-lg border-l-4 border-red-500'>
                  <p className='text-lg font-bold text-accent-red-light mb-1'>{ability}</p>
                  <div className='flex items-center justify-between'>
                    <select
                      value={baseScore}
                      onChange={(e) => handleAssignScore(ability, parseInt(e.target.value))}
                      className="p-2 bg-theme-tertiary rounded-lg text-theme-primary font-mono"
                    >
                      <option value={0}>Select...</option>
                      {standardArrayScores.map(s => (
                        <option
                          key={s}
                          value={s}
                          disabled={baseScore !== s && !availableScores.includes(s)}
                        >
                          {s}
                        </option>
                      ))}
                    </select>

                    <span className='text-xl text-accent-yellow-light font-bold'>
                      {baseScore > 0 && `${finalScore} (${formatModifier(modifier)})`}
                    </span>
                  </div>
                  {racialBonus > 0 && baseScore > 0 && <p className='text-xs text-accent-green-light mt-1'>+ {racialBonus} (Racial)</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Dice Rolling UIs */}
      {(data.abilityScoreMethod === 'standard-roll' || data.abilityScoreMethod === 'classic-roll' || data.abilityScoreMethod === '5d6-drop-2') && (
        <>
          <button
            onClick={() => rollAbilityScores(data.abilityScoreMethod as 'standard-roll' | 'classic-roll' | '5d6-drop-2')}
            className="w-full p-3 bg-accent-purple hover:bg-accent-purple-light rounded-lg text-theme-primary font-bold flex items-center justify-center gap-2"
          >
            <Dice6 className="w-5 h-5" />
            {rolledSets.length === 0 ? 'Roll Ability Scores' : 'Re-roll All Scores'}
          </button>

          {rolledSets.length > 0 && (
            <>
              {data.abilityScoreMethod !== 'classic-roll' && (
                <div className='p-3 bg-theme-tertiary rounded-lg'>
                  <span className='text-sm font-semibold text-theme-muted'>Rolled Sets (assign to abilities):</span>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    {rolledSets.map((set, idx) => {
                      const total = set.reduce((a, b) => a + b, 0);
                      const isAssigned = Object.values(data.abilities).includes(total);
                      return (
                        <div key={idx} className={`px-3 py-2 rounded-lg ${isAssigned ? 'bg-theme-quaternary' : 'bg-accent-yellow text-gray-900'}`}>
                          <div className='text-xs font-mono'>[{set.join(', ')}]</div>
                          <div className='text-lg font-bold text-center'>{total}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                {abilityNames.map((ability, idx) => {
                  const baseScore = data.abilities[ability];
                  const racialBonus = raceData?.ability_bonuses[ability] || 0;
                  const finalScore = baseScore + racialBonus;
                  const modifier = getModifier(finalScore);

                  return (
                    <div key={ability} className='p-3 bg-theme-secondary rounded-lg border-l-4 border-red-500'>
                      <p className='text-lg font-bold text-accent-red-light mb-1'>{ability}</p>
                      <div className='flex items-center justify-between'>
                        {data.abilityScoreMethod === 'classic-roll' ? (
                          <div className='text-sm font-mono text-theme-muted'>
                            [{rolledSets[idx]?.join(', ')}]
                          </div>
                        ) : (
                          <select
                            value={baseScore}
                            onChange={(e) => handleAssignRolledScore(ability, parseInt(e.target.value))}
                            className="p-2 bg-theme-tertiary rounded-lg text-theme-primary font-mono"
                          >
                            <option value={0}>Select...</option>
                            {rolledSets.map((set, setIdx) => {
                              const total = set.reduce((a, b) => a + b, 0);
                              return (
                                <option key={setIdx} value={setIdx}>
                                  {total} [{set.join(', ')}]
                                </option>
                              );
                            })}
                          </select>
                        )}

                        <span className='text-xl text-accent-yellow-light font-bold'>
                          {baseScore > 0 && `${finalScore} (${formatModifier(modifier)})`}
                        </span>
                      </div>
                      {racialBonus > 0 && baseScore > 0 && <p className='text-xs text-accent-green-light mt-1'>+ {racialBonus} (Racial)</p>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Point Buy UI */}
      {data.abilityScoreMethod === 'point-buy' && (
        <>
          <div className='p-4 bg-purple-900/30 border border-accent-purple rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-semibold text-theme-tertiary'>Points Remaining:</span>
              <span className='text-3xl font-bold text-accent-yellow-light'>{pointBuyPoints}</span>
            </div>
            <p className='text-xs text-theme-muted mt-2'>Scores range from 8-15. Higher scores cost more points.</p>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {abilityNames.map(ability => {
              const baseScore = data.abilities[ability] || 8;
              const racialBonus = raceData?.ability_bonuses[ability] || 0;
              const finalScore = baseScore + racialBonus;
              const modifier = getModifier(finalScore);

              return (
                <div key={ability} className='p-3 bg-theme-secondary rounded-lg border-l-4 border-red-500'>
                  <p className='text-lg font-bold text-accent-red-light mb-1'>{ability}</p>
                  <div className='flex items-center justify-between'>
                    <select
                      value={baseScore}
                      onChange={(e) => handlePointBuyChange(ability, parseInt(e.target.value))}
                      className="p-2 bg-theme-tertiary rounded-lg text-theme-primary font-mono"
                    >
                      {Object.keys(POINT_BUY_COSTS).map(score => {
                        const s = parseInt(score);
                        const cost = POINT_BUY_COSTS[s];
                        const currentCost = POINT_BUY_COSTS[baseScore] || 0;
                        const wouldExceed = (cost - currentCost) > pointBuyPoints;

                        return (
                          <option key={s} value={s} disabled={wouldExceed && baseScore !== s}>
                            {s} ({cost} pts)
                          </option>
                        );
                      })}
                    </select>

                    <span className='text-xl text-accent-yellow-light font-bold'>
                      {finalScore} ({formatModifier(modifier)})
                    </span>
                  </div>
                  {racialBonus > 0 && <p className='text-xs text-accent-green-light mt-1'>+ {racialBonus} (Racial)</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Custom Entry UI */}
      {data.abilityScoreMethod === 'custom' && (
        <>
          <div className='p-3 bg-yellow-900/30 border border-yellow-500 rounded-lg'>
            <p className='text-sm text-yellow-200'>
              <span className='font-bold'>DM Override:</span> Enter custom ability scores (1-20). Consult with your DM.
            </p>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {abilityNames.map(ability => {
              const baseScore = data.abilities[ability];
              const racialBonus = raceData?.ability_bonuses[ability] || 0;
              const finalScore = baseScore + racialBonus;
              const modifier = getModifier(finalScore);

              return (
                <div key={ability} className='p-3 bg-theme-secondary rounded-lg border-l-4 border-red-500'>
                  <p className='text-lg font-bold text-accent-red-light mb-1'>{ability}</p>
                  <div className='flex items-center justify-between'>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={baseScore || ''}
                      onChange={(e) => handleCustomInput(ability, e.target.value)}
                      className="p-2 bg-theme-tertiary rounded-lg text-theme-primary font-mono w-20"
                      placeholder="0"
                    />

                    <span className='text-xl text-accent-yellow-light font-bold'>
                      {baseScore > 0 && `${finalScore} (${formatModifier(modifier)})`}
                    </span>
                  </div>
                  {racialBonus > 0 && baseScore > 0 && <p className='text-xs text-accent-green-light mt-1'>+ {racialBonus} (Racial)</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className='flex justify-between'>
        <button onClick={prevStep} className="px-4 py-2 bg-theme-quaternary hover:bg-theme-hover rounded-lg text-theme-primary flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <button
          onClick={nextStep}
          disabled={!isComplete}
          className="px-4 py-2 bg-accent-red hover:bg-accent-red-light rounded-lg text-theme-primary flex items-center disabled:bg-theme-quaternary disabled:cursor-not-allowed"
        >
          Next: {getNextStepLabel?.() || 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};