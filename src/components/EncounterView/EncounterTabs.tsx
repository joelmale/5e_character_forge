import React, { useState } from 'react';
import { Monster, UserMonster } from '../../types/dnd';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EncounterTabsProps {
  monsters: (Monster | UserMonster)[];
}

const getModifier = (score: number): string => {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

const getACText = (armorClass: Monster['armor_class']): string => {
  if (Array.isArray(armorClass) && armorClass.length > 0) {
    const ac = armorClass[0];
    let text = ac.value.toString();
    if (ac.armor && ac.armor.length > 0) {
      text += ` (${ac.armor.map((a) => a.name).join(', ')})`;
    } else if (ac.type !== 'dex') {
      text += ` (${ac.type})`;
    }
    return text;
  }
  return '10';
};

const getSpeedText = (speed: Monster['speed']): string => {
  const speeds: string[] = [];
  if (speed.walk) speeds.push(speed.walk);
  if (speed.fly) speeds.push(`fly ${speed.fly}${speed.hover ? ' (hover)' : ''}`);
  if (speed.swim) speeds.push(`swim ${speed.swim}`);
  if (speed.burrow) speeds.push(`burrow ${speed.burrow}`);
  if (speed.climb) speeds.push(`climb ${speed.climb}`);
  return speeds.join(', ') || '0 ft.';
};

const getCRColor = (cr: number): string => {
  if (cr <= 4) return 'bg-green-600';
  if (cr <= 10) return 'bg-yellow-600';
  if (cr <= 16) return 'bg-orange-600';
  return 'bg-red-600';
};

export const EncounterTabs: React.FC<EncounterTabsProps> = ({ monsters }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (monsters.length === 0) {
    return <div className="text-center text-gray-400">No monsters in encounter</div>;
  }

  const monster = monsters[activeIndex];

  // Track instance numbers for duplicate monsters
  const monsterCounts = new Map<string, number>();
  const instanceNumbers: number[] = [];

  monsters.forEach((m) => {
    const currentCount = monsterCounts.get(m.index) || 0;
    monsterCounts.set(m.index, currentCount + 1);
    instanceNumbers.push(monsterCounts.get(m.index) || 1);
  });

  const instanceNumber = instanceNumbers[activeIndex];

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : monsters.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < monsters.length - 1 ? prev + 1 : 0));
  };

  const getSavingThrows = (): string => {
    const saves = monster.proficiencies.filter((p) => p.proficiency.name.startsWith('Saving Throw:'));
    if (saves.length === 0) return '';
    return saves.map((s) => `${s.proficiency.name.replace('Saving Throw: ', '')} +${s.value}`).join(', ');
  };

  const getSkills = (): string => {
    const skills = monster.proficiencies.filter((p) => p.proficiency.name.startsWith('Skill:'));
    if (skills.length === 0) return '';
    return skills.map((s) => `${s.proficiency.name.replace('Skill: ', '')} +${s.value}`).join(', ');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-6 bg-gray-800 rounded-lg p-2">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={handlePrevious}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            title="Previous monster"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-grow overflow-x-auto">
            <div className="flex gap-2">
              {monsters.map((m, index) => {
                const isActive = index === activeIndex;
                const inst = instanceNumbers[index];
                return (
                  <button
                    key={`${m.index}-${index}`}
                    onClick={() => setActiveIndex(index)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {m.name} {inst > 1 && `#${inst}`}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleNext}
            className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            title="Next monster"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center text-sm text-gray-400">
          {activeIndex + 1} of {monsters.length}
        </div>
      </div>

      {/* Full Stat Block */}
      <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-red-900 p-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">
              {monster.name}
              {instanceNumber > 1 && <span className="ml-2 text-2xl text-gray-300">#{instanceNumber}</span>}
            </h1>
            <span className={`px-3 py-1 ${getCRColor(monster.challenge_rating)} text-white text-sm rounded-full`}>
              CR {monster.challenge_rating}
            </span>
          </div>
          <p className="text-xl text-gray-300 italic">
            {monster.size} {monster.type}
            {monster.subtype && ` (${monster.subtype})`}, {monster.alignment}
          </p>
        </div>

        {/* Stat Block Content */}
        <div className="p-6 space-y-4">
          {/* Basic Stats */}
          <div className="space-y-2 pb-4 border-b-2 border-red-700">
            <div className="flex gap-2">
              <span className="font-bold text-red-400">Armor Class</span>
              <span className="text-gray-300">{getACText()}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-red-400">Hit Points</span>
              <span className="text-gray-300">
                {monster.hit_points} ({monster.hit_points_roll})
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-red-400">Speed</span>
              <span className="text-gray-300">{getSpeedText(monster.speed)}</span>
            </div>
          </div>

          {/* Ability Scores */}
          <div className="grid grid-cols-6 gap-3 pb-4 border-b-2 border-red-700">
            {[
              { name: 'STR', score: monster.strength },
              { name: 'DEX', score: monster.dexterity },
              { name: 'CON', score: monster.constitution },
              { name: 'INT', score: monster.intelligence },
              { name: 'WIS', score: monster.wisdom },
              { name: 'CHA', score: monster.charisma },
            ].map((ability) => (
              <div key={ability.name} className="text-center">
                <div className="font-bold text-red-400 text-sm">{ability.name}</div>
                <div className="text-2xl font-bold text-white">{ability.score}</div>
                <div className="text-sm text-gray-400">({getModifier(ability.score)})</div>
              </div>
            ))}
          </div>

          {/* Additional Stats */}
          <div className="space-y-2 pb-4 border-b-2 border-red-700 text-sm">
            {getSavingThrows() && (
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Saving Throws</span>
                <span className="text-gray-300">{getSavingThrows()}</span>
              </div>
            )}
            {getSkills() && (
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Skills</span>
                <span className="text-gray-300">{getSkills()}</span>
              </div>
            )}
            {monster.damage_vulnerabilities.length > 0 && (
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Damage Vulnerabilities</span>
                <span className="text-gray-300">{monster.damage_vulnerabilities.join(', ')}</span>
              </div>
            )}
            {monster.damage_resistances.length > 0 && (
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Damage Resistances</span>
                <span className="text-gray-300">{monster.damage_resistances.join(', ')}</span>
              </div>
            )}
            {monster.damage_immunities.length > 0 && (
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Damage Immunities</span>
                <span className="text-gray-300">{monster.damage_immunities.join(', ')}</span>
              </div>
            )}
            {monster.condition_immunities.length > 0 && (
              <div className="flex gap-2">
                <span className="font-bold text-red-400">Condition Immunities</span>
                <span className="text-gray-300">
                  {monster.condition_immunities.map((c) => c.name).join(', ')}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="font-bold text-red-400">Senses</span>
              <span className="text-gray-300">
                {Object.entries(monster.senses)
                  .map(([key, value]) => `${key} ${value}`)
                  .join(', ')}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-red-400">Languages</span>
              <span className="text-gray-300">{monster.languages || '—'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-red-400">Challenge</span>
              <span className="text-gray-300">
                {monster.challenge_rating} ({monster.xp.toLocaleString()} XP)
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-red-400">Proficiency Bonus</span>
              <span className="text-gray-300">+{monster.proficiency_bonus}</span>
            </div>
          </div>

          {/* Special Abilities */}
          {monster.special_abilities && monster.special_abilities.length > 0 && (
            <div className="pb-4 border-b-2 border-red-700">
              <h3 className="text-lg font-bold text-red-400 mb-3">Special Abilities</h3>
              <div className="space-y-3">
                {monster.special_abilities.map((ability, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-bold text-purple-400 italic">{ability.name}.</p>
                    <p className="text-gray-300 mt-1">{ability.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {monster.actions && monster.actions.length > 0 && (
            <div className="pb-4 border-b-2 border-red-700">
              <h3 className="text-lg font-bold text-red-400 mb-3">Actions</h3>
              <div className="space-y-3">
                {monster.actions.map((action, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-bold text-red-400 italic">{action.name}.</p>
                    <p className="text-gray-300 mt-1">{action.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legendary Actions */}
          {monster.legendary_actions && monster.legendary_actions.length > 0 && (
            <div className="pb-4 border-b-2 border-red-700">
              <h3 className="text-lg font-bold text-red-400 mb-3">Legendary Actions</h3>
              <p className="text-sm text-gray-300 italic mb-3">
                The {monster.name} can take 3 legendary actions, choosing from the options below. Only
                one legendary action option can be used at a time and only at the end of another
                creature's turn. The {monster.name} regains spent legendary actions at the start of its
                turn.
              </p>
              <div className="space-y-3">
                {monster.legendary_actions.map((action, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-bold text-yellow-400 italic">{action.name}.</p>
                    <p className="text-gray-300 mt-1">{action.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          {monster.reactions && monster.reactions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-red-400 mb-3">Reactions</h3>
              <div className="space-y-3">
                {monster.reactions.map((reaction, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-bold text-blue-400 italic">{reaction.name}.</p>
                    <p className="text-gray-300 mt-1">{reaction.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
