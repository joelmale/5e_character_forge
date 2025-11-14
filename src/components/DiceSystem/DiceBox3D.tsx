import React, { useEffect, useRef, useState } from 'react';
import DiceBox, { type DiceBoxConfig } from '@3d-dice/dice-box';
import DiceParser from '@3d-dice/dice-parser-interface';
import DisplayResults from '@3d-dice/dice-ui/src/displayResults';
import type { DiceRoll } from '../../utils/diceRoller';

interface DiceBox3DProps {
  latestRoll: DiceRoll | null;
  onRollComplete?: () => void;
}

export const DiceBox3D: React.FC<DiceBox3DProps> = ({
  latestRoll,
  onRollComplete,
}) => {
  const diceBoxRef = useRef<DiceBox | null>(null);
  const diceParserRef = useRef<DiceParser | null>(null);
  const displayResultsRef = useRef<DisplayResults | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRollIdRef = useRef<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Dice Parser and Display Results
  useEffect(() => {
    diceParserRef.current = new DiceParser();
    displayResultsRef.current = new DisplayResults("#dice-box");
  }, []);

  // Check WebGL support and initialize DiceBox
  useEffect(() => {
    const initDiceSystem = async () => {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        setWebGLSupported(false);
        setError('WebGL is not supported in your browser');
        return;
      }

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

        console.log('Initializing enhanced DiceBox with config:', config);

        const diceBox = new DiceBox(config);
        await diceBox.init();

        // Enhanced roll complete handler with parser integration
        diceBox.onRollComplete = (results) => {
          console.log('Dice roll complete:', results);

          if (!diceParserRef.current || !displayResultsRef.current) {
            console.error('Dice parser or display results not initialized');
            return;
          }

          // Handle rerolls using the parser
          const rerolls = diceParserRef.current.handleRerolls(results);
          if (rerolls.length) {
            console.log('Processing rerolls:', rerolls);
            rerolls.forEach((roll: any) => diceBox.roll(roll));
            return rerolls;
          }

          // Parse final results and display them
          const finalResults = diceParserRef.current.parseFinalResults(results);
          console.log('Final parsed results:', finalResults);

          displayResultsRef.current.showResults(finalResults);

          if (onRollComplete) {
            onRollComplete();
          }
        };

        // Clear dice on click anywhere on the screen
        const clearDiceHandler = () => {
          const diceBoxCanvas = document.getElementById("dice-canvas");
          if (diceBoxCanvas && window.getComputedStyle(diceBoxCanvas).display !== "none") {
            diceBox.hide().clear();
            displayResultsRef.current?.clear();
          }
        };

        document.addEventListener("mousedown", clearDiceHandler);

        diceBoxRef.current = diceBox;
        setIsInitialized(true);

      } catch (err) {
        console.error('Failed to initialize enhanced DiceBox:', err);
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

    // Cleanup function
    return () => {
      if (diceBoxRef.current) {
        diceBoxRef.current.clear();
      }
      // Remove event listener if it was added
      const diceBoxCanvas = document.getElementById("dice-canvas");
      if (diceBoxCanvas) {
        document.removeEventListener("mousedown", () => {
          if (diceBoxCanvas && window.getComputedStyle(diceBoxCanvas).display !== "none") {
            diceBoxRef.current?.hide().clear();
            displayResultsRef.current?.clear();
          }
        });
      }
    };
  }, [onRollComplete]);

  // Handle dice rolls with enhanced notation support
  useEffect(() => {
    if (
      !isInitialized ||
      !diceBoxRef.current ||
      !diceParserRef.current ||
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

    // Enhanced roll processing with complex notation support
    const rollDice = async () => {
      try {
        // Support both simple rolls and complex notations
        let rollNotation: string;

        if (latestRoll.pools && latestRoll.pools.length > 0) {
          // Complex roll with multiple dice types - convert to notation
          const notations: string[] = [];
          latestRoll.pools.forEach(pool => {
            notations.push(`${pool.count}d${pool.sides}`);
          });
          rollNotation = notations.join('+');
        } else {
          // Simple d20 roll - convert to notation
          rollNotation = `1d20${latestRoll.modifier !== 0 ? (latestRoll.modifier > 0 ? '+' : '') + latestRoll.modifier : ''}`;
        }

        console.log('Rolling dice with notation:', rollNotation);

        // Roll dice with notation string
        await diceBoxRef.current!.show().roll(rollNotation);

        // Auto-clear after settle time + 3 seconds
        const totalTime = 2500 + 3000; // settleTimeout + 3s
        clearTimeoutRef.current = setTimeout(() => {
          if (diceBoxRef.current) {
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