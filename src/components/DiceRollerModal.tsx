import React, { useEffect, useRef, useState, useCallback } from 'react';
import DiceBox from '@3d-dice/dice-box';
import './DiceRollerModal.css';
import { diceSounds } from '../utils/diceSounds';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRollComplete?: (results: any[]) => void;
}

interface DiceRollResult {
  qty: number;
  sides: number;
  value: number;
  groupId: number;
  rollId: string;
  theme: string;
}

interface DiceConfig {
  type: string;
  label: string;
  icon: string;
  color?: string;
}

const DICE_TYPES: DiceConfig[] = [
  { type: 'd4', label: 'D4', icon: '▲', color: '#FF6B6B' },
  { type: 'd6', label: 'D6', icon: '□', color: '#4ECDC4' },
  { type: 'd8', label: 'D8', icon: '◆', color: '#45B7D1' },
  { type: 'd10', label: 'D10', icon: '◈', color: '#96CEB4' },
  { type: 'd12', label: 'D12', icon: '⬟', color: '#FFEAA7' },
  { type: 'd20', label: 'D20', icon: '⬢', color: '#DDA0DD' },
  { type: 'd100', label: 'D100', icon: '%', color: '#98D8C8' },
];

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({
  isOpen,
  onClose,
  onRollComplete,
}) => {
  const diceBoxRef = useRef<HTMLDivElement>(null);
  const diceBoxInstanceRef = useRef<DiceBox | null>(null);
  const [selectedDice, setSelectedDice] = useState<Map<string, number>>(new Map());
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);
  const [diceBoxReady, setDiceBoxReady] = useState(false);
  const [modifier, setModifier] = useState<number>(0);


  // Initialize dice box when modal opens
  useEffect(() => {
    if (isOpen && diceBoxRef.current && !diceBoxInstanceRef.current) {
      const initDiceBox = async () => {
        try {
          console.log('🎲 [DiceRollerModal] Initializing DiceBox with v1.1.0+ API...');

          // v1.1.0+ API - single config object
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const box = new (DiceBox as any)({
            container: '#dice-box-container',  // Changed from 'id' to 'container' per v1.1.x docs
            assetPath: '/assets/dice-box/',
            theme: 'default',
            scale: 8, // Increased scale for better visibility
            gravity: 1, // Increased gravity for faster settling
            mass: 1,
            friction: 0.8,
            restitution: 0.8, // Increased restitution for more bounce
            linearDamping: 0.4, // Added linear damping
            angularDamping: 0.4,  // Added angular damping
            spinForce: 4, // Increased spin for more dynamic rolls
            throwForce: 7, // Increased throw force
            startingHeight: 8, // Increased starting height
            settleTimeout: 5000, // Reduced settle timeout
            offscreen: false, // Ensure canvas is onscreen
            delay: 0, 
          });
          } as any);

          console.log('🎲 [DiceRollerModal] DiceBox instance created, calling init()...');
          await box.init();
          console.log('🎲 [DiceRollerModal] DiceBox initialized successfully!');

          // IMMEDIATE canvas check (synchronous)
          const container = document.getElementById('dice-box-container');
          if (container) {
            console.log('🎲 [DiceRollerModal] Container found immediately after init');
            console.log('🎲 [DiceRollerModal] Container children COUNT:', container.children.length);
            console.log('🎲 [DiceRollerModal] Container children:', Array.from(container.children));

            const containerStyles = window.getComputedStyle(container);
            console.log('🎲 [DiceRollerModal] Container dimensions:', {
              width: containerStyles.width,
              height: containerStyles.height,
              clientWidth: container.clientWidth,
              clientHeight: container.clientHeight,
              offsetWidth: container.offsetWidth,
              offsetHeight: container.offsetHeight,
            });
            console.log('🎲 [DiceRollerModal] Container styles:', {
              display: containerStyles.display,
              position: containerStyles.position,
              overflow: containerStyles.overflow,
              flex: containerStyles.flex,
            });

            const canvas = container.querySelector('canvas');
            if (canvas) {
              console.log('✅ [DiceRollerModal] Canvas found immediately!');
              const canvasStyles = window.getComputedStyle(canvas);
              console.log('🎲 [DiceRollerModal] Canvas attributes:', {
                width: canvas.width,
                height: canvas.height,
                clientWidth: canvas.clientWidth,
                clientHeight: canvas.clientHeight,
              });
              console.log('🎲 [DiceRollerModal] Canvas computed styles:', {
                width: canvasStyles.width,
                height: canvasStyles.height,
                display: canvasStyles.display,
                visibility: canvasStyles.visibility,
                opacity: canvasStyles.opacity,
                position: canvasStyles.position,
                zIndex: canvasStyles.zIndex,
                top: canvasStyles.top,
                left: canvasStyles.left,
              });
            } else {
              console.error('❌ [DiceRollerModal] No canvas found immediately after init!');
              // Check again after a delay
              setTimeout(() => {
                const canvasDelayed = container.querySelector('canvas');
                if (canvasDelayed) {
                  console.log('✅ [DiceRollerModal] Canvas appeared after delay');
                } else {
                  console.error('❌ [DiceRollerModal] Still no canvas after 500ms delay');
                }
              }, 500);
            }
          } else {
            console.error('❌ [DiceRollerModal] Container not found in DOM after init!');
          }

          // Set up roll complete callback
          box.onRollComplete = (results: DiceRollResult[]) => {
            setIsRolling(false);

            // Calculate total from all dice
            const total = results.reduce((sum, die) => sum + die.value, 0);

            // Store aggregated result
            setLastResult({
              qty: results.length,
              sides: 0, // Mixed dice types
              value: total,
              groupId: results[0]?.groupId || 0,
              rollId: results[0]?.rollId || '',
              theme: results[0]?.theme || 'default',
            });

            onRollComplete?.(results);
          };

          diceBoxInstanceRef.current = box;
          setDiceBoxReady(true);
          console.log('🎲 [DiceRollerModal] DiceBox ready state set to true');
        } catch (error) {
          console.error('❌ [DiceRollerModal] Failed to initialize dice box:', error);
          setDiceBoxReady(false);
        }
      };

      initDiceBox();
    }

    // Cleanup
    return () => {
      if (!isOpen && diceBoxInstanceRef.current) {
        console.log('🎲 [DiceRollerModal] Cleaning up DiceBox instance');
        diceBoxInstanceRef.current.clear();
        diceBoxInstanceRef.current = null;
        setDiceBoxReady(false);
      }
    };
  }, [isOpen, onRollComplete]);

  const updateDiceCount = useCallback((diceType: string, delta: number) => {
    setSelectedDice((prev) => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(diceType) || 0;
      const newCount = Math.max(0, Math.min(10, currentCount + delta));

      if (newCount === 0) {
        newMap.delete(diceType);
      } else {
        newMap.set(diceType, newCount);
      }

      return newMap;
    });
  }, []);

  const buildNotation = useCallback(() => {
    const parts: string[] = [];

    selectedDice.forEach((count, type) => {
      if (count > 0) {
        parts.push(`${count}${type}`);
      }
    });

    if (parts.length === 0) return '';

    let notation = parts.join('+');
    if (modifier !== 0) {
      notation += modifier > 0 ? `+${modifier}` : `${modifier}`;
    }

    return notation;
  }, [selectedDice, modifier]);

  const rollDice = useCallback(async () => {
    const notation = buildNotation();

    if (!notation || !diceBoxInstanceRef.current || !diceBoxReady) {
      return;
    }

    setIsRolling(true);
    setLastResult(null);

    try {
      await diceBoxInstanceRef.current.clear();

      // Build array of individual dice notations
      const rollNotations: string[] = [];
      selectedDice.forEach((count, type) => {
        if (count > 0) {
          rollNotations.push(`${count}${type}`);
        }
      });

      // Calculate total number of dice for sound
      const totalDice = Array.from(selectedDice.values()).reduce((sum, count) => sum + count, 0);

      // Play dice sound when roll starts
      diceSounds.playRollSound(totalDice);

      // Roll all dice simultaneously
      await diceBoxInstanceRef.current.roll(rollNotations);
    } catch (error) {
      console.error('❌ [DiceRollerModal] Roll failed:', error);
      setIsRolling(false);
    }
  }, [buildNotation, diceBoxReady, selectedDice]);

  const clearSelection = useCallback(() => {
    setSelectedDice(new Map());
    setModifier(0);
    setLastResult(null);
    diceBoxInstanceRef.current?.clear();
  }, []);

  const quickRoll = useCallback((diceType: string) => {
    setSelectedDice(new Map([[diceType, 1]]));
    setModifier(0);
    setTimeout(() => rollDice(), 100);
  }, [rollDice]);

  if (!isOpen) return null;

  return (
    <div className="dice-modal-overlay" onClick={onClose}>
      <div className="dice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dice-modal-header">
          <h2>Dice Roller</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="dice-selector">
          {DICE_TYPES.map((dice) => (
            <div key={dice.type} className="dice-control">
              <button
                className={`dice-button ${selectedDice.has(dice.type) ? 'selected' : ''}`}
                style={{ '--dice-color': dice.color } as React.CSSProperties}
                onClick={() => quickRoll(dice.type)}
                title={`Quick roll ${dice.label}`}
              >
                <span className="dice-icon">{dice.icon}</span>
                <span className="dice-label">{dice.label}</span>
              </button>
              <div className="dice-counter">
                <button
                  className="counter-btn"
                  onClick={() => updateDiceCount(dice.type, -1)}
                >
                  -
                </button>
                <span className="counter-value">
                  {selectedDice.get(dice.type) || 0}
                </span>
                <button
                  className="counter-btn"
                  onClick={() => updateDiceCount(dice.type, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="modifier-section">
          <label>Modifier:</label>
          <input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
            min="-20"
            max="20"
            className="modifier-input"
          />
        </div>

        <div className="dice-notation">
          {buildNotation() || 'Select dice to roll'}
        </div>

        <div id="dice-box-container" ref={diceBoxRef} className="dice-box-container">
          {!diceBoxReady && <div className="loading">Initializing dice box...</div>}
        </div>

        {lastResult && (
          <div className="result-display">
            <span className="result-label">Result:</span>
            <span className="result-value">
              {lastResult.value + modifier}
            </span>
            <span className="result-breakdown">
              ({buildNotation()})
              {modifier !== 0 && (
                <span className="ml-1">
                  = {lastResult.value} {modifier > 0 ? '+' : ''}{modifier}
                </span>
              )}
            </span>
          </div>
        )}

        <div className="dice-actions">
          <button
            className="roll-button"
            onClick={rollDice}
            disabled={!buildNotation() || isRolling || !diceBoxReady}
          >
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
          <button
            className="clear-button"
            onClick={clearSelection}
            disabled={isRolling}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};