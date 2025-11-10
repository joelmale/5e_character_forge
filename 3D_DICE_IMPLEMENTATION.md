# 3D Dice Rolling Implementation Guide

## Overview

This document describes the implementation of 3D dice rolling in Nexus VTT, which uses the `@3d-dice/dice-box` library for realistic WebGL-based dice physics and rendering. The system includes sound effects, server-side validation, and a clean separation between visual presentation and game logic.

## Architecture

### Component Structure

```
DiceBox3D (React Component)
  ├─ @3d-dice/dice-box (3D rendering engine)
  ├─ diceSounds (Audio manager)
  └─ gameStore.diceRolls (State management)

DiceRoller (UI Component)
  └─ Sends roll requests to server

Server (WebSocket)
  └─ Validates and calculates actual dice results
```

### Key Files

1. **`src/components/DiceBox3D.tsx`** - 3D dice renderer (247 lines)
2. **`src/utils/diceSounds.ts`** - Audio manager (278 lines)
3. **`src/utils/dice.ts`** - Dice parsing and formatting (256 lines)
4. **`src/types/dice-box.d.ts`** - TypeScript definitions
5. **`src/components/DiceRoller.tsx`** - UI for initiating rolls

## Dependencies

### NPM Package

```json
{
  "@3d-dice/dice-box": "^1.1.4"
}
```

### Assets Required

```
/public/assets/dice-box/
  ├─ [3D models and textures from @3d-dice/dice-box]
  └─ [Automatically provided by the library]

/public/assets/dicesound/
  ├─ 1d20Roll.mp3          (Single die sound)
  ├─ Shake2xRoll2D.mp3     (Two dice sound)
  └─ RollManyDice.mp3      (3+ dice sound)
```

## Implementation Details

### 1. DiceBox3D Component

**Purpose**: Renders 3D dice animations using WebGL

**Key Features**:
- WebGL support detection
- Automatic initialization and cleanup
- Predetermined dice values from server
- Configurable disappearance timing
- Theme support

**Configuration**:

```typescript
const config = {
  id: 'dice-canvas',
  container: '#dice-box',
  assetPath: '/assets/dice-box/',
  theme: 'default',
  offscreen: false,
  scale: 8,
  gravity: 1,
  mass: 1,
  friction: 0.8,
  restitution: 0,
  linearDamping: 0.4,
  angularDamping: 0.4,
  spinForce: 4,
  throwForce: 5,
  startingHeight: 8,
  settleTimeout: 5000,
  delay: 10,
  enableShadows: true,
  lightIntensity: 1,
};
```

**Initialization Flow**:

```typescript
// 1. Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  throw new Error('WebGL not supported');
}

// 2. Create DiceBox instance
const diceBox = new DiceBox(config);

// 3. Initialize
await diceBox.init();

// 4. Set up roll completion handler
diceBox.onRollComplete = (results) => {
  console.log('Roll complete', results);
};
```

**Rolling Dice with Predetermined Values**:

The key innovation in this implementation is that the server calculates the actual dice results, and the 3D animation simply displays those predetermined values:

```typescript
// Server sends roll results
const latestRoll = {
  id: 'uuid',
  pools: [
    { sides: 20, count: 1, results: [15] },
    { sides: 6, count: 2, results: [3, 5] }
  ]
};

// Convert to notation array
const rollNotations: string[] = [];
const rollValues: number[] = [];

for (const pool of latestRoll.pools) {
  for (const value of pool.results) {
    rollNotations.push(`1d${pool.sides}`);
    rollValues.push(value);
  }
}

// Roll with predetermined values
diceBox.roll(rollNotations, { values: rollValues });
// This will show: 1d20 → 15, 1d6 → 3, 1d6 → 5
```

**Auto-clear Feature**:

```typescript
// Clear dice after settle + configured time
const totalTime = 5000 + settings.diceDisappearTime;
setTimeout(() => {
  diceBox.clear();
}, totalTime);
```

### 2. Sound System (diceSounds.ts)

**Purpose**: Manages dice rolling audio effects

**Features**:
- Preloaded MP3 files for different dice counts
- Procedural Web Audio API sounds for critical hits/failures
- Volume control and muting
- Sound caching for performance

**Basic Usage**:

```typescript
import { diceSounds } from '@/utils/diceSounds';

// Play rolling sound based on dice count
diceSounds.playRollSound(3); // Plays "many dice" sound

// Play critical success (ascending chime)
diceSounds.playCritSuccessSound();

// Play critical failure (descending sad tones)
diceSounds.playCritFailureSound();

// Mute control
diceSounds.toggleMute();
diceSounds.setMuted(true);
const isMuted = diceSounds.isSoundMuted();
```

**Sound Selection Logic**:

```typescript
if (diceCount === 1) {
  soundKey = '1-die';          // 1d20Roll.mp3
} else if (diceCount === 2) {
  soundKey = '2-dice';         // Shake2xRoll2D.mp3
} else {
  soundKey = 'many-dice';      // RollManyDice.mp3
}
```

**Procedural Audio** (Web Audio API):

The critical hit/failure sounds are generated programmatically, no MP3 files needed:

```typescript
// Critical Success: C5, E5, G5, C6 ascending arpeggio + sparkles
const notes = [523.25, 659.25, 783.99, 1046.5];
notes.forEach((freq, i) => {
  this.playTone(ctx, freq, now + i * 0.1, 0.3, 'sine');
});

// Critical Failure: G4, E4, D4, B3 descending + dull thud
const notes = [392.0, 329.63, 293.66, 246.94];
notes.forEach((freq, i) => {
  this.playTone(ctx, freq, now + i * 0.15, 0.4, 'triangle');
});
```

### 3. Dice Expression Parser (dice.ts)

**Purpose**: Parses and validates dice notation strings

**Supported Formats**:

```typescript
// Simple
"1d20"       // 1 twenty-sided die
"2d6"        // 2 six-sided dice

// With modifiers
"1d20+5"     // 1d20 plus 5
"2d6-2"      // 2d6 minus 2

// Multiple dice types
"2d6+3d8"    // 2d6 and 3d8
"1d20+2d6+5" // 1d20, 2d6, plus 5

// Complex
"3d4, 6d20"  // Comma-separated pools
```

**Parser Function**:

```typescript
interface ParsedDiceExpression {
  pools: Array<{ count: number; sides: number }>;
  modifier: number;
}

export function parseDiceExpression(
  expression: string
): ParsedDiceExpression | null {
  // Returns parsed result or null if invalid
}
```

**Validation Rules**:

```typescript
// Count: 1-100 dice per pool
// Sides: 2-1000 sides per die
// No trailing operators (invalid: "2d6+", "1d20-")
```

**Example**:

```typescript
const result = parseDiceExpression("2d6+1d8+3");
// Returns:
// {
//   pools: [
//     { count: 2, sides: 6 },
//     { count: 1, sides: 8 }
//   ],
//   modifier: 3
// }
```

### 4. Roll Creation and Formatting

**Creating a Roll**:

```typescript
export function createDiceRoll(
  expression: string,
  userId: string,
  userName: string,
  options: {
    isPrivate?: boolean;
    advantage?: boolean;
    disadvantage?: boolean;
  } = {}
): DiceRoll | null
```

**Roll Object Structure**:

```typescript
interface DiceRoll {
  id: string;
  userId: string;
  userName: string;
  expression: string;           // "2d6+3"
  pools: DicePool[];           // [{ count: 2, sides: 6, results: [3, 5] }]
  modifier: number;            // 3
  results: number[];           // [3, 5]
  advResults?: number[];       // Optional for advantage/disadvantage
  total: number;               // 11
  crit?: 'success' | 'failure';
  timestamp: number;
  isPrivate: boolean;
}
```

**HTML Formatting**:

```typescript
export function formatDiceRoll(roll: DiceRoll): string {
  // Returns HTML string like:
  // "2d6+3: <span class="dice-pool">
  //   <span class="pool-label">2d6</span>
  //   <span>[3, 5]</span>
  // </span> +3 = <strong class="roll-total">11</strong>"
}
```

**Critical Hit Detection**:

```typescript
// Only for single d20 rolls
if (pools.length === 1 && pools[0].count === 1 && pools[0].sides === 20) {
  if (pools[0].results[0] === 20) crit = 'success';
  if (pools[0].results[0] === 1) crit = 'failure';
}
```

### 5. Server-Side Validation

**Purpose**: Prevent dice roll cheating by calculating results server-side

**WebSocket Message Flow**:

```typescript
// Client sends roll request
client → server: {
  type: 'event',
  data: {
    name: 'dice/roll-request',
    expression: '1d20+5',
    isPrivate: false,
    advantage: false,
    disadvantage: false
  }
}

// Server validates, rolls, and broadcasts
server → all clients: {
  type: 'event',
  data: {
    name: 'dice/roll-result',
    id: 'uuid',
    userId: 'user-id',
    userName: 'Player 1',
    expression: '1d20+5',
    pools: [{ count: 1, sides: 20, results: [15] }],
    modifier: 5,
    results: [15],
    total: 20,
    timestamp: 1234567890
  }
}
```

**Server Validation** (in `server/index.ts`):

```typescript
// Validate expression
const parsed = parseDiceExpression(expression);
if (!parsed) {
  return sendMessage(connection, {
    type: 'error',
    message: 'Invalid dice expression'
  });
}

// Server rolls the dice (client cannot manipulate)
const roll = createDiceRoll(expression, userId, userName, options);

// Broadcast to room
broadcastToRoom(roomId, {
  type: 'event',
  data: { name: 'dice/roll-result', ...roll }
});
```

## Integration Steps

### Step 1: Install Dependencies

```bash
npm install @3d-dice/dice-box
```

### Step 2: Add Assets

1. Copy dice sound files to `/public/assets/dicesound/`
2. Dice-box assets are served from `/public/assets/dice-box/` (automatically handled)

### Step 3: Add TypeScript Types

Create `src/types/dice-box.d.ts`:

```typescript
declare module '@3d-dice/dice-box' {
  export default class DiceBox {
    constructor(config: any);
    init(): Promise<void>;
    roll(notation: string | string[], options?: { values?: number[] }): Promise<any>;
    clear(): void;
    updateConfig(config: any): void;
    onRollComplete?: (results: any) => void;
  }
}
```

### Step 4: Create Dice Utilities

Copy or adapt:
- `src/utils/dice.ts` - Expression parsing
- `src/utils/diceSounds.ts` - Audio management

### Step 5: Create DiceBox3D Component

Copy `src/components/DiceBox3D.tsx` and customize:
- Adjust positioning (currently top-right corner)
- Modify physics config for your needs
- Update asset paths if different

### Step 6: Integrate with State

```typescript
// In your game store (Zustand example)
interface GameStore {
  diceRolls: DiceRoll[];
  addDiceRoll: (roll: DiceRoll) => void;
}

// Listen for roll results from server
webSocket.on('dice/roll-result', (roll: DiceRoll) => {
  gameStore.addDiceRoll(roll);

  // Optional: Play sound
  diceSounds.playRollSound(roll.results.length);

  // Optional: Play crit sounds
  if (roll.crit === 'success') {
    diceSounds.playCritSuccessSound();
  } else if (roll.crit === 'failure') {
    diceSounds.playCritFailureSound();
  }
});
```

### Step 7: Add to Your UI

```tsx
import { DiceBox3D } from '@/components/DiceBox3D';

function GameCanvas() {
  return (
    <div>
      {/* Your game content */}
      <DiceBox3D />
    </div>
  );
}
```

## Configuration Options

### Physics Tweaking

```typescript
{
  scale: 8,              // Size multiplier (higher = bigger dice)
  gravity: 1,            // Gravity strength (default Earth gravity)
  mass: 1,               // Die mass (affects momentum)
  friction: 0.8,         // Surface friction (0-1)
  restitution: 0,        // Bounciness (0 = no bounce)
  linearDamping: 0.4,    // Linear velocity dampening
  angularDamping: 0.4,   // Rotational dampening
  spinForce: 4,          // Initial spin strength
  throwForce: 5,         // Initial throw strength
  startingHeight: 8,     // Drop height
}
```

### Timing Configuration

```typescript
{
  settleTimeout: 5000,   // Time before dice settle (ms)
  delay: 10,             // Delay between multiple dice (ms)
}
```

### Visual Configuration

```typescript
{
  theme: 'default',      // Available themes vary by library version
  enableShadows: true,   // Render shadows (performance impact)
  lightIntensity: 1,     // Scene lighting (0-2)
  offscreen: false,      // Use offscreen canvas (better performance)
}
```

## Common Patterns

### Pattern 1: Roll with Advantage/Disadvantage

```typescript
// Client requests with advantage
const rollRequest = {
  expression: '1d20+5',
  advantage: true
};

// Server rolls twice, takes highest
const roll1 = rollDice(1, 20); // [15]
const roll2 = rollDice(1, 20); // [12]
const total = Math.max(15, 12) + 5; // 20

// 3D animation shows both dice
rollNotations = ['1d20', '1d20'];
rollValues = [15, 12];
```

### Pattern 2: Multiple Dice Types

```typescript
// Expression: "2d6+1d8+3"
// Server calculates:
pools = [
  { count: 2, sides: 6, results: [4, 5] },
  { count: 1, sides: 8, results: [7] }
];
modifier = 3;
total = 4 + 5 + 7 + 3 = 19;

// 3D animation:
rollNotations = ['1d6', '1d6', '1d8'];
rollValues = [4, 5, 7];
```

### Pattern 3: Private Rolls (DM Only)

```typescript
// Client sends with isPrivate flag
const rollRequest = {
  expression: '1d20',
  isPrivate: true
};

// Server only sends result to DM
if (isPrivate && userId !== dmUserId) {
  return; // Don't broadcast to this user
}
```

## Performance Considerations

### Optimization Tips

1. **Limit Simultaneous Dice**: Cap at ~20 dice per roll
2. **Use Offscreen Canvas**: Set `offscreen: true` for better performance
3. **Disable Shadows on Low-End**: Set `enableShadows: false`
4. **Preload Sounds**: Sounds are preloaded in constructor
5. **Clear Dice Regularly**: Auto-clear prevents memory buildup
6. **Use Lower Scale**: Smaller dice render faster

### Memory Management

```typescript
// Clean up on unmount
useEffect(() => {
  return () => {
    if (diceBoxRef.current) {
      diceBoxRef.current.clear();
    }
    // Clear timeouts
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
  };
}, []);
```

## Troubleshooting

### WebGL Not Available

```typescript
// Check support before initializing
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  // Fall back to 2D dice or show error
  console.error('WebGL not supported');
}
```

### Dice Not Appearing

1. Check container element exists: `document.querySelector('#dice-box')`
2. Verify asset path: `/assets/dice-box/` must exist
3. Check z-index: Container must be above other elements
4. Inspect console for initialization errors

### Dice Values Don't Match

- Ensure you're using the `values` option in `roll()`
- Verify server is sending `results` array in correct order
- Check that `rollNotations` and `rollValues` arrays have same length

### Sound Not Playing

1. Check MP3 files exist in `/assets/dicesound/`
2. Verify browser autoplay policy (requires user interaction)
3. Check volume/mute state: `diceSounds.isSoundMuted()`
4. Try playing after a user click event

## Advanced Features

### Custom Themes

```typescript
// Register custom theme (if supported by library version)
diceBox.updateConfig({
  theme: 'custom',
  themeColor: '#ff0000'
});
```

### Camera Control

```typescript
// Some versions support camera manipulation
diceBox.updateConfig({
  cameraPosition: { x: 0, y: 10, z: 10 }
});
```

### Custom Physics

```typescript
// Slow-motion effect
diceBox.updateConfig({
  gravity: 0.5,
  linearDamping: 0.2,
  angularDamping: 0.2
});

// Chaotic rolls
diceBox.updateConfig({
  spinForce: 10,
  throwForce: 10,
  restitution: 0.5  // Add bounce
});
```

## Testing Recommendations

### Unit Tests

```typescript
describe('parseDiceExpression', () => {
  it('parses simple expressions', () => {
    expect(parseDiceExpression('2d6')).toEqual({
      pools: [{ count: 2, sides: 6 }],
      modifier: 0
    });
  });

  it('rejects invalid expressions', () => {
    expect(parseDiceExpression('2d6+')).toBeNull();
  });
});
```

### Integration Tests

```typescript
it('rolls dice and shows 3D animation', async () => {
  const roll = createDiceRoll('1d20', 'user1', 'Player 1');
  gameStore.addDiceRoll(roll);

  await waitFor(() => {
    expect(screen.getByText(/rolled 1d20/)).toBeInTheDocument();
  });
});
```

## License & Attribution

- **@3d-dice/dice-box**: Check package license (typically MIT)
- **Sound Effects**: Ensure you have rights to use dice sound MP3s
- **Web Audio API**: Browser standard, no licensing issues

## Resources

- [@3d-dice/dice-box GitHub](https://github.com/3d-dice/dice-box)
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [WebGL Fundamentals](https://webglfundamentals.org/)

## Summary

This implementation provides:
✅ Realistic 3D dice physics
✅ Server-side roll validation (anti-cheat)
✅ Rich audio feedback
✅ Support for complex dice expressions
✅ Advantage/disadvantage mechanics
✅ Critical hit/failure detection
✅ Performance optimizations
✅ Clean separation of concerns

The key architectural decision is **server authority**: the 3D dice are purely cosmetic, displaying predetermined results from the server, ensuring fair play in multiplayer scenarios.
