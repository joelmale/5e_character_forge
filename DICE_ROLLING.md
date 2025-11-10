# 3D Dice Rolling Feature

This document describes the 3D dice rolling implementation in the 5e Character Forge.

## Overview

The app uses the `@3d-dice/dice-box` library to provide realistic 3D dice physics when clicking on ability scores, skills, or initiative. All dice calculations are done client-side in the browser using `Math.random()`.

## Features

✅ **3D Physics** - Realistic WebGL-based dice rolling with physics simulation
✅ **Client-Side** - All calculations happen in your browser, no server needed
✅ **Audio Feedback** - Rolling sounds and special effects for criticals
✅ **Roll History** - Last 10 rolls saved with timestamps
✅ **Auto-Clear** - Dice disappear after 3 seconds
✅ **Mobile Compatible** - Works on iOS and Android browsers

## How It Works

### 1. Click to Roll

Click any of the following to trigger a dice roll:
- **Ability Scores** (STR, DEX, CON, INT, WIS, CHA) - Rolls 1d20 + ability modifier
- **Skills** (Acrobatics, Stealth, etc.) - Rolls 1d20 + skill modifier
- **Initiative** - Rolls 1d20 + initiative modifier

### 2. Dice Animation

- Dice appear in a 3D container over the character sheet
- Physics simulation shows realistic rolling, bouncing, and spinning
- Results match what was calculated by the browser
- Dice auto-clear after 3 seconds

### 3. Roll History

**Two viewing options:**

**Option A: Bottom Ticker**
- Horizontal scrolling bar at bottom of screen
- Shows last rolls in real-time
- Always visible when viewing character sheet

**Option B: History Modal**
- Click the history button (bottom-right)
- Opens popup with detailed roll information
- Shows dice values, modifiers, and totals
- Highlights critical successes (nat 20) and failures (nat 1)

### 4. Sound Effects

**Rolling Sounds** (MP3 files):
- 1 die: `1d20Roll.mp3`
- 2 dice: `Shake2xRoll2D.mp3`
- 3+ dice: `RollManyDice.mp3`

**Critical Sounds** (Procedural Web Audio):
- **Natural 20**: Ascending arpeggio (C5-E5-G5-C6) with sparkles
- **Natural 1**: Descending tones (G4-E4-D4-B3) with sad thud

## Technical Details

### Architecture

```
User clicks ability → createAbilityRoll() → Math.random() →
Update state → DiceBox3D animation → Play sounds →
Add to history → Auto-clear after 3s
```

### Components

1. **DiceBox3D.tsx** - 3D dice renderer using @3d-dice/dice-box
2. **RollHistory.tsx** - Ticker and modal components for history
3. **diceRoller.ts** - Utility functions for rolling and calculations
4. **diceSounds.ts** - Audio manager for sound effects

### Data Flow

```typescript
// 1. User clicks STR ability (score: 16)
// 2. Create roll
const roll = createAbilityRoll('STR', 16);
// Returns: {
//   id: 'uuid',
//   type: 'ability',
//   label: 'STR Check',
//   notation: '1d20+3',
//   diceResults: [15],  // Random 1-20
//   modifier: 3,         // (16-10)/2
//   total: 18,           // 15 + 3
//   critical: undefined,
//   timestamp: 1234567890
// }

// 3. Add to history (last 10 stored in localStorage)
addRollToHistory(roll);

// 4. Trigger 3D animation with predetermined value [15]
<DiceBox3D latestRoll={roll} />

// 5. Play sound based on dice count
diceSounds.playRollSound(1);
```

### Critical Detection

Critical hits/failures only apply to **single d20 rolls**:

```typescript
// Natural 20
if (diceResults[0] === 20 && sides === 20) {
  roll.critical = 'success';
  diceSounds.playCritSuccessSound();
}

// Natural 1
if (diceResults[0] === 1 && sides === 20) {
  roll.critical = 'failure';
  diceSounds.playCritFailureSound();
}
```

### Roll History Storage

Stored in `localStorage` under key `'5e-forge-rolls'`:

```typescript
// Save
localStorage.setItem('5e-forge-rolls', JSON.stringify(rolls));

// Load
const rolls = JSON.parse(localStorage.getItem('5e-forge-rolls'));

// Keep only last 10
const trimmed = rolls.slice(-10);
```

## Configuration

### Dice Physics

Edit `src/components/DiceBox3D.tsx` config:

```typescript
{
  scale: 6,              // Die size
  gravity: 1,            // Gravity strength
  throwForce: 4,         // How hard dice are thrown
  spinForce: 3,          // Initial spin
  settleTimeout: 2500,   // Time to settle (ms)
  enableShadows: true,   // Render shadows
}
```

### Auto-Clear Timing

Modify in `DiceBox3D.tsx`:

```typescript
const totalTime = 2500 + 3000; // settle + delay
// Change 3000 to desired delay in milliseconds
```

### Sound Volume

```typescript
diceSounds.setVolume(0.5); // 0.0 to 1.0
```

### Mute Sounds

```typescript
diceSounds.toggleMute();
// or
diceSounds.setMuted(true);
```

## Browser Compatibility

**WebGL Required** (for 3D dice):
- ✅ Chrome/Edge 56+
- ✅ Firefox 51+
- ✅ Safari 10+
- ✅ iOS Safari 10+
- ✅ Chrome Android
- ❌ IE 11 (not supported)

**Fallback**: If WebGL unavailable, shows error message. Dice calculations still work.

## Adding Sound Files

See `public/assets/dicesound/README.md` for instructions on:
- Where to download free sound effects
- Required file names and formats
- Installation steps

Without sound files, the app works but rolling sounds are silent (critical sounds still play via Web Audio API).

## Performance Tips

1. **Lower Scale** - Smaller dice render faster
2. **Disable Shadows** - Set `enableShadows: false`
3. **Reduce Settle Time** - Lower `settleTimeout` value
4. **Limit History** - Already capped at 10 rolls

## Troubleshooting

### Dice Not Appearing

1. Check browser console for errors
2. Verify WebGL is supported: `chrome://gpu`
3. Check that container element exists
4. Inspect z-index layering

### Wrong Dice Values

This shouldn't happen - values are predetermined. If it does:
1. Check console logs
2. Verify `rollValues` array matches `rollNotations` length
3. Ensure Math.random() is working

### No Sound

1. Check MP3 files exist in `public/assets/dicesound/`
2. Verify file names match exactly
3. Check browser autoplay policy
4. Ensure sounds aren't muted: `diceSounds.isSoundMuted()`

### Performance Issues

1. Lower `scale` value
2. Disable shadows
3. Use fewer dice per roll
4. Check browser hardware acceleration

## Future Enhancements

Possible additions:
- [ ] Advantage/disadvantage rolls (roll 2d20, take higher/lower)
- [ ] Damage rolls (multiple dice types)
- [ ] Custom dice themes
- [ ] Dice tray position options
- [ ] Sound effect customization
- [ ] Roll macros/presets
- [ ] Export roll history to CSV

## Credits

- **@3d-dice/dice-box** - 3D dice library
- **Web Audio API** - Procedural sound generation
- **Lucide React** - Icons
- **5e SRD** - D&D 5e rules

## License

MIT License - See LICENSE file

---

**Happy Rolling!** May your crits be plentiful and your fails be few! 🎲
