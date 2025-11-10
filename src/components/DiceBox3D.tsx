import React, { useEffect, useRef, useState } from 'react';
import DiceBox, { type DiceBoxConfig } from '@3d-dice/dice-box';
import type { DiceRoll } from '../utils/diceRoller';

interface DiceBox3DProps {
  latestRoll: DiceRoll | null;
  onRollComplete?: () => void;
}

export const DiceBox3D: React.FC<DiceBox3DProps> = ({
  latestRoll,
  onRollComplete,
}) => {
  const diceBoxRef = useRef<DiceBox | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRollIdRef = useRef<string | null>(null);

  // Check WebGL support
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) {
      setWebGLSupported(false);
      setError('WebGL is not supported in your browser');
      return;
    }

    // Initialize DiceBox
    const initDiceBox = async () => {
      try {
        const config: DiceBoxConfig = {
          id: 'dice-canvas',
          container: '#dice-box',
          assetPath: '/assets/dice-box/',
          theme: 'default',
          offscreen: false,
          scale: 6,
          gravity: 1,
          mass: 1,
          friction: 0.8,
          restitution: 0,
          linearDamping: 0.4,
          angularDamping: 0.4,
          spinForce: 3,
          throwForce: 4,
          startingHeight: 8,
          settleTimeout: 2500,
          delay: 10,
          enableShadows: true,
          lightIntensity: 1,
        };

        const diceBox = new DiceBox(config);
        await diceBox.init();

        diceBox.onRollComplete = (results) => {
          console.log('Dice roll complete:', results);
          if (onRollComplete) {
            onRollComplete();
          }
        };

        diceBoxRef.current = diceBox;
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize DiceBox:', err);
        setError('Failed to initialize 3D dice. Check console for details.');
      }
    };

    initDiceBox();

    return () => {
      if (diceBoxRef.current) {
        diceBoxRef.current.clear();
      }
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, [onRollComplete]);

  // Roll dice when latestRoll changes
  useEffect(() => {
    if (
      !isInitialized ||
      !diceBoxRef.current ||
      !latestRoll ||
      lastRollIdRef.current === latestRoll.id
    ) {
      return;
    }

    lastRollIdRef.current = latestRoll.id;

    // Clear any existing timeout
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }

    // Roll the dice with predetermined values
    const rollDice = async () => {
      try {
        // Convert dice results to notation array
        const rollNotations: string[] = [];
        const rollValues: number[] = [];

        // For single d20 roll (ability/skill checks)
        for (const result of latestRoll.diceResults) {
          rollNotations.push('1d20');
          rollValues.push(result);
        }

        console.log('Rolling dice:', rollNotations, 'values:', rollValues);

        // Roll dice with predetermined values
        await diceBoxRef.current!.roll(rollNotations, { values: rollValues });

        // Auto-clear after settle time + 3 seconds
        const totalTime = 2500 + 3000; // settleTimeout + 3s
        clearTimeoutRef.current = setTimeout(() => {
          if (diceBoxRef.current) {
            diceBoxRef.current.clear();
          }
        }, totalTime);
      } catch (err) {
        console.error('Error rolling dice:', err);
      }
    };

    rollDice();
  }, [latestRoll, isInitialized]);

  if (!webGLSupported) {
    return (
      <div className="fixed top-4 right-4 p-4 bg-red-900/90 text-white rounded-lg shadow-xl z-50 max-w-sm">
        <p className="font-bold">WebGL Not Supported</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed top-4 right-4 p-4 bg-red-900/90 text-white rounded-lg shadow-xl z-50 max-w-sm">
        <p className="font-bold">Dice Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div
      id="dice-box"
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <canvas id="dice-canvas" className="w-full h-full" />
    </div>
  );
};

export default DiceBox3D;
