/* eslint-disable no-empty */
import React, { useEffect, useRef, useState } from 'react';
import type { DiceRoll } from '../../services/diceService';
import DiceBox from '@3d-dice/dice-box';

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
  const lastRollIdRef = useRef<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diceVisible, setDiceVisible] = useState(false);

  // Initialize DiceBox lazily on first roll
  const initDiceBoxIfNeeded = async () => {
    if (isInitialized || diceBoxRef.current) {
      return;
    }

    try {
      console.log('Initializing DiceBox...');
      const diceBox = new DiceBox('#dice-box', {
        assetPath: '/assets/dice-box/',
        offscreen: false,
        gravity: 1,
        friction: 0.8,
        restitution: 0.6,
        linearDamping: 0.4,
        angularDamping: 0.4,
        spinForce: 3,
        throwForce: 4,
        startingHeight: 8,
        settleTimeout: 5000,
        enableShadows: true,
        scale: 6
      });

      await diceBox.init();
      console.log('DiceBox initialized successfully');

      // Check if canvas was created
      setTimeout(() => {
        const container = document.getElementById('dice-box');
        if (container) {
          console.log('Container found, children:', Array.from(container.children));
          const canvas = container.querySelector('canvas');
          if (canvas) {
            console.log('Canvas found:', canvas, 'size:', canvas.width, 'x', canvas.height);
          } else {
            console.log('No canvas found in container');
          }
        }
      }, 100);

      diceBoxRef.current = diceBox;
      setIsInitialized(true);

      diceBox.onRollComplete = (results) => {
        console.log('Roll completed:', results);
        if (onRollComplete) {
          onRollComplete();
        }
      };

    } catch (err) {
      console.error('Failed to initialize 3D dice:', err);
      setError('Failed to initialize 3D dice');
    }
  };

  // Handle dice rolls
  useEffect(() => {
    if (!latestRoll || lastRollIdRef.current === latestRoll.id) {
      return;
    }

    const performRoll = async () => {
      // Initialize DiceBox if needed
      await initDiceBoxIfNeeded();

      if (!diceBoxRef.current) {
        console.error('DiceBox not available after initialization');
        return;
      }

      lastRollIdRef.current = latestRoll.id;

      // Extract just the dice notation (remove modifiers)
      const diceNotation = latestRoll.notation.replace(/[+-]\d+/, '');
      console.log('Original notation:', latestRoll.notation, 'Parsed notation:', diceNotation);

      // Show dice and roll
      setDiceVisible(true);

      console.log('Attempting to roll dice with notation:', diceNotation);
      // Temporarily try a hardcoded simple roll
      diceBoxRef.current.roll('1d20')
        .then(results => {
          console.log('Dice roll succeeded with results:', results);
        })
        .catch(err => {
          console.error('Dice roll failed:', err);
        });

      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        if (diceBoxRef.current) {
          diceBoxRef.current.hide();
          diceBoxRef.current.clear();
          setDiceVisible(false);
        }
      }, 8000);

      return () => clearTimeout(timer);
    };

    performRoll();
  }, [latestRoll]);

  if (error) {
    return (
      <div className="fixed top-4 right-4 p-4 bg-red-900/90 text-white rounded-lg shadow-xl z-50 max-w-sm">
        <p className="font-bold">Dice Error</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div
      id="dice-box"
      ref={containerRef}
      className={diceVisible ? 'cursor-pointer' : ''}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: diceVisible ? 'auto' : 'none',
        // Temporarily removed opacity and background for debugging
        // opacity: diceVisible ? 1 : 0,
        // backgroundColor: diceVisible ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
      }}
      onClick={() => {
        if (diceBoxRef.current) {
          diceBoxRef.current.hide();
          diceBoxRef.current.clear();
          setDiceVisible(false);
        }
      }}
    >
      {/* Placeholder content to ensure container is not empty */}
      <div style={{ display: 'none' }}>Dice Box Container</div>
    </div>
  );
};

export default DiceBox3D;