import React, { useEffect, useRef, useState } from 'react';
import DiceBox, { type DiceBoxConfig } from '@3d-dice/dice-box';
import type { DiceRoll } from '../../services/diceService';

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
  const lastRollIdRef = useRef<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check WebGL support and initialize DiceBox
  useEffect(() => {
    let mounted = true;

    const initDiceSystem = async () => {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        if (mounted) {
          setWebGLSupported(false);
          setError('WebGL is not supported in your browser');
        }
        return;
      }

      try {
        // Create DiceBox instance with v1.1.0+ API (config object only)
        const config = {
          id: 'dice-canvas',
          assetPath: '/assets/dice-box/',  // This should point to the directory containing themes/ and ammo/
          container: '#dice-box',
          theme: 'default',
          themeColor: '#1e3a8a',  // Dark blue
          offscreen: false,  // Disable Web Worker to avoid CORS issues
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
          settleTimeout: 2000,
          enableShadows: true,
          lightIntensity: 1,
        };

        console.log('Initializing DiceBox with config:', config);

        const diceBox = new DiceBox(config);

        // Wait for initialization to complete
        await diceBox.init();

        if (!mounted) return;

        // Simple roll complete handler
        diceBox.onRollComplete = (results) => {
          console.log('Dice roll complete:', results);

          if (onRollComplete) {
            onRollComplete();
          }
        };

        diceBoxRef.current = diceBox;
        setIsInitialized(true);
        console.log('DiceBox initialized successfully!');

      } catch (err) {
        console.error('Failed to initialize DiceBox:', err);
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        if (errorMessage.includes('WebAssembly') || errorMessage.includes('wasm')) {
          setError('3D dice physics not available. WebAssembly support required.');
        } else if (errorMessage.includes('theme config')) {
          setError('Dice theme configuration not found. Check theme files.');
        } else {
          setError(`Failed to initialize 3D dice: ${errorMessage}`);
        }
      }
    };

    initDiceSystem();

    // Cleanup function
    return () => {
      mounted = false;
      // Only clear if the diceBox is fully initialized and has the clear method
      if (diceBoxRef.current && typeof diceBoxRef.current.clear === 'function') {
        try {
          diceBoxRef.current.clear();
        } catch (err) {
          console.warn('Error clearing dice box:', err);
        }
      }
    };
  }, [onRollComplete]);

  // Handle dice rolls
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

    // Roll the dice
    const rollDice = async () => {
      try {
        // Use the notation from the roll
        const rollNotation = latestRoll.notation;

        console.log('Rolling dice with notation:', rollNotation, 'for roll:', latestRoll);
        console.log('DiceBox instance:', diceBoxRef.current);

        // Show the dice box first
        diceBoxRef.current!.show();
        console.log('DiceBox shown');

        // Then roll the dice
        const result = await diceBoxRef.current!.roll(rollNotation);
        console.log('Roll result:', result);

        // Auto-clear after settle time + 3 seconds
        const totalTime = 2000 + 3000; // settleTimeout + 3s
        clearTimeoutRef.current = setTimeout(() => {
          if (diceBoxRef.current) {
            console.log('Hiding and clearing dice');
            diceBoxRef.current.hide();
            diceBoxRef.current.clear();
          }
        }, totalTime);

      } catch (err) {
        console.error('Error rolling dice:', err);
        setError('Failed to roll dice. Check notation format.');
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
      className="fixed inset-0 pointer-events-none"
      style={{
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        top: 0,
        left: 0,
      }}
    >
      <canvas
        id="dice-canvas"
        className="w-full h-full"
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
};

export default DiceBox3D;