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
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRollIdRef = useRef<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diceVisible, setDiceVisible] = useState(false);

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

        const diceBox = new DiceBox(config);

        // Wait for initialization to complete
        await diceBox.init();

        if (!mounted) return;

        // Store the diceBox instance in ref
        diceBoxRef.current = diceBox;

        // Mark as initialized
        setIsInitialized(true);

        // Simple roll complete handler
        diceBox.onRollComplete = (_results) => {
          if (onRollComplete) {
            onRollComplete();
          }
        };

      } catch (err) {
        if (!mounted) return;

        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        if (errorMessage.includes('WebAssembly') || errorMessage.includes('wasm')) {
          setError('3D dice physics not available. WebAssembly support required.');
        } else if (errorMessage.includes('theme config')) {
          setError('Dice theme configuration not found. Check theme files.');
        } else {
          setError('Failed to initialize 3D dice. Check console for details.');
        }
      }
    };

    initDiceSystem();

const diceBox = diceBoxRef.current;
    // Cleanup function
    return () => {
      mounted = false;
      // Only clear if the diceBox is fully initialized and has the clear method
      if (diceBox && typeof diceBox.clear === 'function') {
        try {
          diceBox.clear();
      } catch {}
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
      let rollNotation = '';

      try {
        // Use the notation from the roll
        rollNotation = latestRoll.notation;

        // Show the dice box first
        diceBoxRef.current!.show();
        setDiceVisible(true);

        // Then roll the dice
        await diceBoxRef.current!.roll(rollNotation);

        // Auto-clear after settle time + 10 seconds (give user time to see results)
        const totalTime = 2000 + 10000; // settleTimeout + 10s
        clearTimeoutRef.current = setTimeout(() => {
          if (diceBoxRef.current) {
            diceBoxRef.current.hide();
            diceBoxRef.current.clear();
            setDiceVisible(false);
          }
        }, totalTime);

      } catch {} {
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

  // Handle click to dismiss dice
  const handleContainerClick = () => {
    if (diceBoxRef.current && clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      diceBoxRef.current.hide();
      diceBoxRef.current.clear();
      setDiceVisible(false);
    }
  };

  return (
    <div
      id="dice-box"
      ref={containerRef}
      className={`fixed inset-0 ${diceVisible ? 'cursor-pointer' : 'pointer-events-none'}`}
      style={{
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        top: 0,
        left: 0,
      }}
      onClick={handleContainerClick}
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