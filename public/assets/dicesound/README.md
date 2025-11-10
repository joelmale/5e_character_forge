# Dice Sound Files

This directory should contain MP3 files for dice rolling sound effects.

## Required Files

1. **1d20Roll.mp3** - Single die rolling sound
2. **Shake2xRoll2D.mp3** - Two dice rolling sound
3. **RollManyDice.mp3** - Multiple (3+) dice rolling sound

## Where to Find Sound Files

### Free Options

1. **Freesound.org** (https://freesound.org/)
   - Search for "dice roll", "dice rolling", "rolling dice"
   - Filter by Creative Commons licenses
   - Download and rename to match the filenames above

2. **ZapSplat** (https://www.zapsplat.com/)
   - Free sound effects library
   - Search for dice sounds
   - Attribution required for free tier

3. **YouTube Audio Library** (https://www.youtube.com/audiolibrary)
   - Free sound effects
   - No attribution required
   - Search for "dice"

### Recommended Searches

- "dice roll"
- "rolling dice"
- "dice rolling sound"
- "tabletop dice"
- "rpg dice"

## File Specifications

- **Format**: MP3
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps or higher
- **Length**: 1-3 seconds recommended
- **Volume**: Normalized to -3dB to -6dB

## Notes

- Critical success and critical failure sounds are generated procedurally using Web Audio API
- Only rolling sounds need to be provided as MP3 files
- If files are missing, the app will still work but without rolling sound effects
- Sounds are preloaded for better performance

## Installation

1. Download or record three dice rolling sounds
2. Convert to MP3 if needed
3. Rename to match the filenames above
4. Place in this directory (`public/assets/dicesound/`)
5. Rebuild the app if necessary

The app will automatically load these sounds when initialized.
