import React from 'react';
import { X } from 'lucide-react';

interface RacialTraitModalProps {
  isOpen: boolean;
  onClose: () => void;
  traitName: string;
  raceName: string;
  traitDescription?: string;
  position?: { x: number; y: number } | null;
}

const RacialTraitModal: React.FC<RacialTraitModalProps> = ({
  isOpen,
  onClose,
  traitName,
  raceName,
  traitDescription,
  position
}) => {
  if (!isOpen) return null;

  // Default descriptions for common racial traits
  const getTraitDescription = (trait: string): string => {
    if (traitDescription) return traitDescription;

    const traitDescriptions: Record<string, string> = {
      'Darkvision': 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light. You can\'t discern color in darkness, only shades of gray.',
      'Dwarven Resilience': 'You have advantage on saving throws against poison, and you have resistance against poison damage.',
      'Stonecunning': 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.',
      'Dwarven Combat Training': 'You have proficiency with the battleaxe, handaxe, light hammer, and warhammer.',
      'Dwarven Toughness': 'Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.',
      'Tool Proficiency': 'You gain proficiency with the artisan\'s tools of your choice: smith\'s tools, brewer\'s supplies, or mason\'s tools.',
      'Extra Language': 'You can speak, read, and write one extra language of your choice.',
      'Fey Ancestry': 'You have advantage on saving throws against being charmed, and magic can\'t put you to sleep.',
      'Trance': 'Elves don\'t need to sleep. Instead, they meditate deeply, remaining semiconscious, for 4 hours a day.',
      'Keen Senses': 'You have proficiency in the Perception skill.',
      'Elf Weapon Training': 'You have proficiency with the longsword, shortsword, shortbow, and longbow.',
      'High Elf Cantrip': 'You know one cantrip of your choice from the wizard spell list.',
      'Lucky': 'When you roll a 1 on the d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
      'Brave': 'You have advantage on saving throws against being frightened.',
      'Halfling Nimbleness': 'You can move through the space of any creature that is of a size larger than yours.',
      'Naturally Stealthy': 'You can attempt to hide even when you are obscured only by a creature that is at least one size larger than you.',
      'Stout Resilience': 'You have advantage on saving throws against poison, and you have resistance against poison damage.',
      'Gnome Cunning': 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
      'Natural Illusionist': 'You know the minor illusion cantrip. Intelligence is your spellcasting ability for it.',
      'Speak with Small Beasts': 'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.',
      'Artificer\'s Lore': 'Whenever you make an Intelligence (History) check related to magic items, alchemical objects, or technological devices, you can add twice your proficiency bonus.',
      'Tinker': 'You have proficiency with artisan\'s tools (tinker\'s tools). Using those tools, you can spend 1 hour and 10 gp worth of materials to construct a Tiny clockwork device.',
      'Draconic Ancestry': 'You have draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type.',
      'Breath Weapon': 'You can use your action to exhale destructive energy. Your draconic ancestry determines the size, shape, and damage type of the exhalation.',
      'Damage Resistance': 'You have resistance to the damage type associated with your draconic ancestry.',
      'Skill Versatility': 'You gain proficiency in two skills of your choice.',
      'Aggressive': 'This trait represents a creature\'s overwhelming predatory instinct or boundless battle-fury. When they see a foe, their first impulse is to close the distance and attack, moving with a surprising burst of speed to get into the thick of the fight.\n\nMechanical Effect: As a bonus action on your turn, you can move up to your speed toward an enemy of your choice that you can see or hear. You must end this move closer to the enemy than you started.',
      'Menacing': 'Your very presence is unsettling. Whether due to a fierce demeanor, imposing physique, or a cultural reputation for violence, you have an innate talent for inspiring fear and making others back down.\n\nMechanical Effect: You gain proficiency in the Intimidation skill.',
      'Powerful Build': 'You are significantly larger, broader, and more muscular than a typical humanoid of your size. You can shoulder burdens, push heavy objects, and carry supplies that would cause others to buckle.\n\nMechanical Effect: You count as one size larger (e.g., Medium becomes Large) when determining your carrying capacity and the weight you can push, drag, or lift.\n\nImportant Note: This trait does not make you Large for other game purposes, such as your reach, the weapons you can wield, or the space you occupy on a grid.',
      'Superior Darkvision': 'Your darkvision has a radius of 120 feet.',
      'Drow Magic': 'You know the dancing lights cantrip. When you reach 3rd level, you can cast the faerie fire spell once per long rest. When you reach 5th level, you can also cast the darkness spell once per long rest.',
      'Sunlight Sensitivity': 'You have disadvantage on attack rolls and on Wisdom (Perception) checks that rely on sight when you, the target of your attack, or whatever you are trying to perceive is in direct sunlight.',
      'Hellish Resistance': 'You have resistance to fire damage.',
      'Favored Enemy': 'You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them.',
      'Natural Explorer': 'You are particularly familiar with one type of natural environment and are adept at traveling and surviving in such regions.',
      'Primeval Awareness': 'You can use your action and expend one ranger spell slot to focus your awareness on the region around you.',
      'Hunter\'s Mark': 'You know the hunter\'s mark spell and can cast it as a 1st-level spell.',
      'Unarmored Defense': 'While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier.',
      'Martial Arts': 'Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons.',
      'Ki': 'You harness the mystic energy of ki. Some features require your ki points.',
      'Flurry of Blows': 'Immediately after you take the Attack action on your turn, you can spend 1 ki point to make two unarmed strikes as a bonus action.',
      'Divine Sense': 'The presence of strong evil registers on your senses like a noxious odor, and powerful good rings like heavenly music in your ears.',
      'Lay on Hands': 'Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest.',
      'Divine Smite': 'When you hit a creature with a melee weapon attack, you can expend one spell slot to deal radiant damage to the target.',
      'Aura of Protection': 'Whenever you or a friendly creature within 10 feet of you must make a saving throw, the creature gains a bonus to the saving throw equal to your Charisma modifier.',
      'Sneak Attack': 'Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll.',
      'Cunning Action': 'You can take a bonus action on each of your turns in combat. This action can be used to Dash, Disengage, or Hide.',
      'Uncanny Dodge': 'When an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\'s damage against you.',
      'Evasion': 'When you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, you instead take no damage if you succeed.',
      'Spellcasting': 'You have learned to cast spells through study, innate talent, or divine blessing.',
      'Flexible Casting': 'You can use your sorcery points to gain additional spell slots, or sacrifice spell slots to gain sorcery points.',
      'Metamagic': 'You can twist your spells to suit your needs by using a sorcery point to create one of several Metamagic effects.',
      'Otherworldly Patron': 'You have struck a bargain with an otherworldly being of your choice.',
      'Eldritch Invocations': 'You gain the ability to cast spells using eldritch energy.',
      'Pact Boon': 'Your otherworldly patron grants you a special boon in the form of a pact.',
      'Arcane Recovery': 'You have learned to regain some of your magical energy by studying your spellbook.',
      'Spellbook': 'The repository of your arcane knowledge and power.',
      'Ritual Casting': 'You can cast a wizard spell as a ritual if that spell has the ritual tag.',
      'Rage': 'In battle, you fight with primal ferocity. On your turn, you can enter a rage as a bonus action.',
      'Reckless Attack': 'When you make your first attack on your turn, you can decide to attack recklessly.',
      'Extra Attack': 'You can attack twice, instead of once, whenever you take the Attack action on your turn.',
      'Bardic Inspiration': 'You can inspire others through stirring words or music. To do so, you use a bonus action on your turn to choose one creature other than yourself within 60 feet of you who can hear you.',
      'Jack of All Trades': 'You can add half your proficiency bonus, rounded down, to any ability check you make that doesn\'t already include your proficiency bonus.',
      'Song of Rest': 'You can use soothing music or oration to help revitalize your wounded allies during a short rest.',
      'Divine Domain': 'Choose one domain related to your deity. Your domain grants you domain spells and other features when you choose it at 1st level.',
      'Turn Undead': 'As an action, you present your holy symbol and speak a prayer censuring the undead. Each undead that can see or hear you within 30 feet of you must make a Wisdom saving throw.',
      'Wild Shape': 'You can use your action to magically assume the shape of a beast that you have seen before.',
      'Druidcraft': 'You know the druidcraft cantrip, and you can speak Druidic.',
      'Circle Spells': 'Your mystical connection to the land infuses you with the ability to cast certain spells.',
      'Fighting Style': 'You adopt a particular style of fighting as your specialty.',
      'Second Wind': 'You have a limited well of stamina that you can draw on to protect yourself from harm.',
      'Action Surge': 'You can push yourself beyond your normal limits for a moment.',
      'Relentless Endurance': 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead.',
      'Savage Attacks': 'When you score a critical hit with a melee weapon attack, you can roll one of the weapon\'s damage dice one additional time and add it to the extra damage of the critical hit.',
      'Expert Forgery': 'You can duplicate other creatures\' handwriting and craftwork.',
      'Kenku Training': 'You gain proficiency with two of the following skills of your choice: Acrobatics, Deception, Stealth, or Sleight of Hand.',
      'Mimicry': 'You can mimic sounds you have heard, including voices.',
      'Feline Agility': 'Your reflexes and agility allow you to move with a burst of speed.',
      'Cat\'s Claws': 'Because of your claws, you have a climbing speed of 20 feet.',
      'Cat\'s Talent': 'You have proficiency in the Perception and Stealth skills.',
      'Control Air and Water': 'You can command air and water, using them to move creatures and objects.',
      'Emissary of the Sea': 'Aquatic beasts have an extraordinary affinity with your people.',
      'Guardians of the Depths': 'You are now even more at home in the depths.',
      'Loxodon Serenity': 'You have advantage on saving throws against being charmed or frightened.',
      'Natural Armor': 'You have thick, leathery skin. When you aren\'t wearing armor, your AC is 13 + your Dexterity modifier.',
      'Trunk': 'You can grasp things with your trunk, and you can use it as a snorkel.',
      'Flight': 'You have a flying speed of 30 feet. To use this speed, you can\'t be wearing medium or heavy armor.',
      'Silent Feathers': 'You can use a bonus action to magically give yourself a flying speed of 30 feet.',
      'Hare-Trigger': 'You can add your proficiency bonus to your initiative rolls.',
      'Leporine Senses': 'You have proficiency in the Perception skill.',
      'Lucky Footwork': 'When you fail a Dexterity saving throw, you can use your reaction to roll a d4 and add it to the save.',
      'Rabbit Hop': 'As a bonus action, you can jump a number of feet equal to five times your proficiency bonus.',
      'Fairy Magic': 'You know the druidcraft cantrip. When you reach 3rd level, you can cast the enlarge/reduce spell on yourself once per long rest.',
      'Celestial Resistance': 'You have resistance to necrotic damage and radiant damage.',
      'Healing Hands': 'As an action, you can touch a creature and cause it to regain a number of hit points equal to your level.',
      'Light Bearer': 'You know the light cantrip. Charisma is your spellcasting ability for it.',
      'Firbolg Magic': 'You can cast detect magic and disguise self with this trait.',
      'Hidden Step': 'As a bonus action, you can magically turn invisible until the start of your next turn or until you attack, make a damage roll, or force someone to make a saving throw.',
      'Speech of Beast and Leaf': 'You have the ability to communicate in a limited manner with beasts and plants.',
      'Stone\'s Endurance': 'You can focus yourself to occasionally shrug off injury.',
      'Mountain Born': 'You\'re acclimated to high altitude. You\'re also naturally adapted to cold climates.',
      'Amphibious': 'You can breathe air and water.',
      'Innate Spellcasting': 'You know a number of spells that you can cast innately.',
      'Magic Resistance': 'You have advantage on saving throws against spells and other magical effects.',
      'Poison Immunity': 'You are immune to poison damage and the poisoned condition.',
      'Decadent Mastery': 'You learn one language of your choice, and you are proficient with one tool of your choice.',
      'Githyanki Psionics': 'You know the mage hand cantrip. When you reach 3rd level, you can cast the shield spell once per long rest.',
      'Martial Prodigy': 'You are proficient with light and medium armor and with shortswords.',
      'Reach to the Blaze': 'You know the produce flame cantrip. Once you reach 3rd level, you can cast the burning hands spell once per long rest.',
      'Saving Face': 'As a bonus action, you can gain advantage on your next ability check or attack roll.',
      'Grovel, Cower, and Beg': 'As an action on your turn, you can cower pathetically to distract nearby foes.',
      'Pack Tactics': 'You have advantage on an attack roll against a creature if at least one of your allies is within 5 feet of the creature and the ally isn\'t incapacitated.',
      'Long-Limbed': 'When you make a melee attack on your turn, your reach for it is 5 feet greater than normal.',
      'Surprise Attack': 'If you surprise a creature and hit it with an attack on your first turn in combat, the attack deals an extra 2d6 damage.',
      'Fury of the Small': 'When you damage a creature with an attack or a spell and the creature\'s size is larger than yours, you can cause the attack or spell to deal extra damage.',
      'Nimble Escape': 'You can take the Disengage or Hide action as a bonus action on each of your turns.',
      'Infernal Legacy': 'You know the thaumaturgy cantrip. Once you reach 3rd level, you can cast the hellish rebuke spell as a 2nd-level spell once per long rest.'
    };

    return traitDescriptions[trait] || `This racial trait provides special abilities or bonuses to ${raceName} characters.`;
  };

  // Calculate modal position
  const getModalStyle = () => {
    if (position) {
      // Position near the click location with some offset
      return {
        position: 'fixed' as const,
        left: Math.min(position.x + 10, window.innerWidth - 400), // 400px is approx modal width
        top: Math.min(position.y + 10, window.innerHeight - 300), // 300px is approx modal height
        zIndex: 60,
      };
    }
    // Default centered position
    return {
      position: 'fixed' as const,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 60,
    };
  };

  return (
    <div
      className="fixed inset-0 z-[60]"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={position ? {} : { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        className="bg-gray-800 border border-gray-600 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={getModalStyle()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h3 className="text-lg font-bold text-yellow-300">{traitName}</h3>
           <button
             onClick={(e) => {
               e.stopPropagation();
               onClose();
             }}
             className="text-gray-400 hover:text-white transition-colors"
           >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <span className="text-sm text-gray-400">From: </span>
            <span className="text-sm text-blue-300">{raceName}</span>
          </div>

          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {getTraitDescription(traitName)}
            </p>
          </div>
         </div>
      </div>
    </div>
  );
};

export default RacialTraitModal;