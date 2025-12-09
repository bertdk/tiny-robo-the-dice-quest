
import React, { useState } from 'react';
import { audioManager } from '../utils/audioManager';

interface DiceProps {
    options: { type: any, icon: React.ElementType, label: string }[];
    onRollComplete: (result: any) => void;
    label: string;
    locked?: boolean;
}

const Dice: React.FC<DiceProps> = ({ options, onRollComplete, label, locked = false }) => {
    const [rolling, setRolling] = useState(false);
    const [resultIndex, setResultIndex] = useState<number | null>(null);

    const handleRoll = () => {
        if (rolling || locked || resultIndex !== null) return;

        // CRITICAL: Ensure audio context is ready on user interaction
        audioManager.init();
        audioManager.resume();
        
        setRolling(true);
        audioManager.playDiceRoll();

        // Animate for 1 second
        const interval = setInterval(() => {
            setResultIndex(Math.floor(Math.random() * options.length));
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            setRolling(false);
            const finalIndex = Math.floor(Math.random() * options.length);
            setResultIndex(finalIndex);
            onRollComplete(options[finalIndex].type);
        }, 1000);
    };

    const currentOption = resultIndex !== null ? options[resultIndex] : null;
    const Icon = currentOption?.icon;

    return (
        <div className="flex flex-col items-center">
            <h3 className="text-white font-bold mb-2 md:mb-4 text-xs md:text-lg uppercase tracking-wider landscape:mb-1 landscape:text-[10px] md:landscape:text-xl">{label}</h3>
            <div 
                onClick={handleRoll}
                className={`
                    w-28 h-28 landscape:w-24 landscape:h-24 md:landscape:w-48 md:landscape:h-48
                    bg-white rounded-xl shadow-[0_6px_0_#9ca3af] flex flex-col items-center justify-center cursor-pointer
                    transition-all duration-100 select-none border-4 border-gray-200
                    ${rolling ? 'animate-spin' : 'hover:scale-105 active:translate-y-1 active:shadow-none'}
                    ${locked ? 'opacity-50 cursor-not-allowed' : ''}
                    ${resultIndex !== null ? 'bg-gradient-to-br from-yellow-100 to-white border-yellow-400' : ''}
                    p-4 md:p-8 landscape:p-2
                `}
            >
                {rolling ? (
                    <div className="text-4xl md:text-7xl text-gray-400 landscape:text-2xl md:landscape:text-8xl">?</div>
                ) : currentOption ? (
                    <>
                        {Icon && <Icon size={32} className="text-gray-800 mb-2 landscape:w-8 landscape:h-8 landscape:mb-1 md:landscape:w-32 md:landscape:h-32 md:landscape:mb-4" />}
                        <span className="text-[10px] font-bold text-gray-600 text-center px-1 leading-tight landscape:text-[8px] md:landscape:text-3xl">{currentOption.label}</span>
                    </>
                ) : (
                    <span className="text-xs text-gray-400 font-bold px-2 text-center leading-tight landscape:text-[10px] md:landscape:text-3xl">CLICK TO ROLL</span>
                )}
            </div>
        </div>
    );
};

export default Dice;
