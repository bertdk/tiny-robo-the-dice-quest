import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Dice from './components/Dice';
import { Trophy, Skull, Lock, ArrowRight } from 'lucide-react';
import { BlockType, PowerUpType } from './types';
import { DICE_BLOCK_OPTIONS, DICE_POWERUP_OPTIONS, MAX_LEVELS } from './constants';

interface LevelProgress {
  [levelId: number]: {
    startedAt?: string;
    completedAt?: string;
  }
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'win' | 'reroll'>('start');
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [progress, setProgress] = useState<LevelProgress>({});
  const [gameId, setGameId] = useState(0); 

  // Loadout State
  const [blockType, setBlockType] = useState<BlockType | null>(null);
  const [powerUpType, setPowerUpType] = useState<PowerUpType | null>(null);
  const [diceRolled, setDiceRolled] = useState(false);

  // Auto-lock when both rolled
  useEffect(() => {
      if (blockType && powerUpType && !diceRolled) {
          // Add a tiny delay for animation feeling, but make it snappy
          const t = setTimeout(() => {
              setDiceRolled(true);
          }, 100); 
          return () => clearTimeout(t);
      }
  }, [blockType, powerUpType, diceRolled]);

  // Load progress
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem('roboAdventureProgress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress) as LevelProgress;
        setProgress(parsed);
        let maxUnlocked = 1;
        // Check up to MAX_LEVELS - 1 to see what should be unlocked
        for (let i = 1; i < MAX_LEVELS; i++) {
           if (parsed[i]?.completedAt) {
               maxUnlocked = Math.max(maxUnlocked, i + 1);
           }
        }
        setUnlockedLevels(Math.min(maxUnlocked, MAX_LEVELS));
      }
    } catch (e) {
      console.error("Failed to load progress", e);
    }
  }, []);

  // Expose Unlock Tool
  useEffect(() => {
      (window as any).unlockLevels = (n: number, pass: string) => {
          if (pass === 'robo') {
              setUnlockedLevels(Math.min(n, MAX_LEVELS));
              console.log(`Unlocked ${n} levels`);
          } else {
              console.log('Access Denied');
          }
      };
      (window as any).unlockLevels(1000, "robo");
  }, []);

  const saveProgress = (newProgress: LevelProgress) => {
      setProgress(newProgress);
      localStorage.setItem('roboAdventureProgress', JSON.stringify(newProgress));
  };

  const startGame = (level: number) => {
    if (!blockType || !powerUpType) return; // Should allow starting only if loaded out
    
    setSelectedLevel(level);
    setGameId(prev => prev + 1);
    
    const newProgress = { ...progress };
    if (!newProgress[level]) newProgress[level] = {};
    newProgress[level].startedAt = new Date().toISOString();
    saveProgress(newProgress);

    setGameState('playing');
  };
  
  const handleGameOver = (level: number) => {
    setGameState('gameover');
  };

  const handleWin = () => {
    const newProgress = { ...progress };
    if (!newProgress[selectedLevel]) newProgress[selectedLevel] = {};
    newProgress[selectedLevel].completedAt = new Date().toISOString();
    saveProgress(newProgress);

    const nextLevel = selectedLevel + 1;
    if (nextLevel <= MAX_LEVELS && nextLevel > unlockedLevels) {
      setUnlockedLevels(nextLevel);
    }
    
    // Go to Re-roll screen if there is a next level, otherwise simple Win screen
    if (nextLevel <= MAX_LEVELS) {
        setGameState('reroll');
    } else {
        setGameState('win'); // Game fully beat
    }
  };

  const handleHome = () => {
    resetLoadout();
    setGameState('start');
  };

  const resetLoadout = () => {
      setBlockType(null);
      setPowerUpType(null);
      setDiceRolled(false);
  };
  
  // Handlers for Dice
  const handleBlockRoll = (result: BlockType) => setBlockType(result);
  const handlePowerUpRoll = (result: PowerUpType) => setPowerUpType(result);

  return (
    <div className={`min-h-screen bg-neutral-900 flex flex-col items-center justify-center overflow-hidden ${gameState === 'playing' ? 'w-full h-full p-0' : 'p-0 md:p-4 h-[100dvh]'}`}>
      {/* Show Header ONLY in Menu screens, not during gameplay */}
      {gameState !== 'playing' && (
          <header className="mb-4 text-center mt-4 md:mt-0 p-4 pb-0">
            <h1 className="text-2xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 font-['Press_Start_2P']">
              TINY ROBO: THE DICE QUEST
            </h1>
            <p className="text-gray-400 text-xs md:text-base">Find the dice to escape the living room!</p>
          </header>
      )}

      <main className={`flex flex-col items-center justify-center ${gameState === 'playing' ? 'w-full h-full' : 'w-full max-w-5xl h-full'}`}>
        {gameState === 'start' && (
          <div className="bg-gray-800 p-4 md:p-10 rounded-none md:rounded-xl shadow-2xl text-center border-0 md:border-2 border-gray-700 w-full max-w-2xl h-full md:h-auto flex flex-col justify-center">
             
             {/* Dice Section */}
             <div className="bg-gray-900 p-4 md:p-6 rounded-lg mb-8 border border-gray-700 mx-2 md:mx-0">
                 <h2 className="text-white font-bold mb-4 text-sm md:text-base">SETUP YOUR LOADOUT</h2>
                 <div className="flex justify-center gap-6 md:gap-12 items-center">
                     <Dice 
                        label="BLOCK TYPE" 
                        options={DICE_BLOCK_OPTIONS} 
                        onRollComplete={handleBlockRoll} 
                        locked={diceRolled}
                     />
                     <Dice 
                        label="POWER UP" 
                        options={DICE_POWERUP_OPTIONS} 
                        onRollComplete={handlePowerUpRoll} 
                        locked={diceRolled}
                     />
                 </div>
             </div>

             <div className={`transition-opacity duration-500 ${diceRolled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <h3 className="text-white text-lg md:text-xl mb-4 font-bold">SELECT LEVEL</h3>
                 <div className="flex justify-center flex-wrap gap-3 md:gap-4 mb-8">
                    {Array.from({ length: MAX_LEVELS }, (_, i) => i + 1).map((level) => (
                      <button
                        key={level}
                        disabled={level > unlockedLevels}
                        onClick={() => startGame(level)}
                        className={`w-16 h-16 md:w-24 md:h-24 rounded-lg flex flex-col items-center justify-center text-xl md:text-2xl font-bold transition-transform transform hover:scale-105 shadow-lg border-b-4 
                          ${level <= unlockedLevels 
                            ? 'bg-blue-600 border-blue-800 text-white hover:bg-blue-500 cursor-pointer active:translate-y-1 active:border-b-0' 
                            : 'bg-gray-700 border-gray-800 text-gray-500 cursor-not-allowed opacity-70'
                          }`}
                      >
                        {level > unlockedLevels ? <Lock size={20} /> : level}
                        {progress[level]?.completedAt && <span className="text-[8px] md:text-[10px] text-green-300 mt-1">✔ DONE</span>}
                      </button>
                    ))}
                 </div>
             </div>
             
             {!diceRolled && (
                 <p className="text-yellow-500 text-xs md:text-sm mt-4">Roll both dice to unlock level selection!</p>
             )}
          </div>
        )}

        {gameState === 'playing' && blockType && powerUpType && (
          <GameCanvas 
            key={`${selectedLevel}-${gameId}`} 
            startLevel={selectedLevel}
            activeBlockType={blockType}
            activePowerUp={powerUpType}
            onGameOver={handleGameOver} 
            onWin={handleWin}
            onHome={handleHome}
          />
        )}

        {gameState === 'gameover' && (
          <div className="bg-gray-800 p-8 md:p-10 rounded-none md:rounded-xl shadow-2xl text-center border-0 md:border-2 border-red-900 w-full max-w-lg h-full md:h-auto flex flex-col justify-center">
             <Skull className="w-16 h-16 md:w-24 md:h-24 text-red-500 mx-auto mb-4" />
             <h2 className="text-3xl md:text-4xl text-red-500 mb-4 font-bold">GAME OVER</h2>
             <p className="text-white mb-8 text-sm md:text-base">The living room conquered you this time.</p>
             <div className="flex flex-col md:flex-row gap-4 justify-center px-4">
                <button 
                  onClick={handleHome}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                >
                  MAIN MENU
                </button>
                <button 
                  onClick={() => startGame(selectedLevel)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors shadow-[0_4px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none"
                >
                  RETRY LEVEL {selectedLevel}
                </button>
             </div>
          </div>
        )}

        {/* Re-roll Screen (Win Intermediate) */}
        {gameState === 'reroll' && (
            <div className="bg-gray-800 p-8 md:p-10 rounded-none md:rounded-xl shadow-2xl text-center border-0 md:border-2 border-purple-600 w-full max-w-2xl h-full md:h-auto flex flex-col justify-center">
                 <Trophy className="w-12 h-12 md:w-16 md:h-16 text-yellow-400 mx-auto mb-4" />
                 <h2 className="text-2xl md:text-3xl text-white mb-2 font-bold">LEVEL COMPLETE!</h2>
                 <p className="text-gray-300 mb-8 text-sm md:text-base">Choose one dice to re-roll for the next level, or keep your setup.</p>
                 
                 <div className="bg-gray-900 p-6 md:p-8 rounded-lg mb-8 flex flex-col md:flex-row justify-center gap-8 md:gap-12 mx-2 md:mx-0">
                     <div className="flex flex-col items-center">
                         <span className="text-white text-xs mb-2">CURRENT: {blockType}</span>
                         <Dice 
                            label="RE-ROLL BLOCK?" 
                            options={DICE_BLOCK_OPTIONS} 
                            onRollComplete={handleBlockRoll} 
                         />
                     </div>
                     <div className="flex flex-col items-center">
                         <span className="text-white text-xs mb-2">CURRENT: {powerUpType}</span>
                         <Dice 
                            label="RE-ROLL POWER?" 
                            options={DICE_POWERUP_OPTIONS} 
                            onRollComplete={handlePowerUpRoll} 
                         />
                     </div>
                 </div>

                 <button 
                    onClick={() => startGame(selectedLevel + 1)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-lg text-xl transition-colors shadow-[0_4px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none flex items-center gap-2 mx-auto w-full md:w-auto justify-center"
                 >
                   START LEVEL {selectedLevel + 1} <ArrowRight />
                 </button>
            </div>
        )}

        {gameState === 'win' && (
          <div className="bg-gray-800 p-10 rounded-none md:rounded-xl shadow-2xl text-center border-0 md:border-2 border-yellow-600 w-full max-w-lg h-full md:h-auto flex flex-col justify-center">
             <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
             <h2 className="text-4xl text-yellow-400 mb-4 font-bold">VICTORY!</h2>
             <p className="text-white mb-8">You have conquered the entire house!</p>
             <button 
                onClick={handleHome}
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
             >
               MAIN MENU
             </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;