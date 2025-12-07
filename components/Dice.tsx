
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
            <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">{label}</h3>
            <div 
                onClick={handleRoll}
                className={`
                    w-24 h-24 bg-white rounded-xl shadow-[0_6px_0_#9ca3af] flex flex-col items-center justify-center cursor-pointer
                    transition-all duration-100 select-none border-4 border-gray-200
                    ${rolling ? 'animate-spin' : 'hover:scale-105 active:translate-y-1 active:shadow-none'}
                    ${locked ? 'opacity-50 cursor-not-allowed' : ''}
                    ${resultIndex !== null ? 'bg-gradient-to-br from-yellow-100 to-white border-yellow-400' : ''}
                `}
            >
                {rolling ? (
                    <div className="text-4xl text-gray-400">?</div>
                ) : currentOption ? (
                    <>
                        {Icon && <Icon size={32} className="text-gray-800 mb-1" />}
                        <span className="text-[10px] font-bold text-gray-600 text-center px-1 leading-tight">{currentOption.label}</span>
                    </>
                ) : (
                    <span className="text-xs text-gray-400 font-bold">CLICK TO ROLL</span>
                )}
            </div>
        </div>
    );
};

export default Dice;
