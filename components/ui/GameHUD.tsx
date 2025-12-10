
import React from 'react';
import { Heart, Pause, Play, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { BlockType, PowerUpType } from '../../types';
import { DICE_BLOCK_OPTIONS, DICE_POWERUP_OPTIONS } from '../../constants';

interface GameHUDProps {
    currentLevel: number;
    lives: number;
    isAdminMode: boolean;
    activeBlockType: BlockType;
    activePowerUp: PowerUpType | null;
    timeLeft: number;
    isBuildMode: boolean;
    actionLabel: string;
    isPaused: boolean;
    onPauseToggle: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({
    currentLevel, lives, isAdminMode, activeBlockType, activePowerUp, timeLeft, isBuildMode, actionLabel, isPaused, onPauseToggle
}) => {
    const blockOption = DICE_BLOCK_OPTIONS.find(o => o.type === activeBlockType);
    const powerUpOption = DICE_POWERUP_OPTIONS.find(o => o.type === activePowerUp);
    const BlockIcon = blockOption?.icon;
    const PowerUpIcon = powerUpOption?.icon;

    return (
        <div className="absolute top-4 left-0 right-0 px-4 grid grid-cols-3 items-start pointer-events-none z-10">
            <div className="flex gap-2 sm:gap-4 items-center justify-start flex-wrap">
                <div className="bg-black/50 px-2 sm:px-3 py-1 rounded flex items-center gap-2 text-white font-bold text-xs sm:text-lg whitespace-nowrap">
                    <span>Level: {currentLevel}</span>
                </div>
                <div className="bg-black/50 px-2 sm:px-3 py-1 rounded flex items-center gap-1 text-red-500">
                    {isAdminMode ? (
                        <InfinityIcon size={20} />
                    ) : (
                        [...Array(5)].map((_, i) => (
                            i < lives && (
                            <Heart 
                                key={i} 
                                size={16} 
                                fill="currentColor" 
                                strokeWidth={2.5}
                                className="sm:w-5 sm:h-5"
                            />
                            )
                        ))
                    )}
                </div>
            </div>
            
            <div className="flex flex-col items-center justify-center pointer-events-auto gap-2">
                 <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded border border-gray-700 shadow-lg">
                    {BlockIcon && <BlockIcon size={20} className="text-yellow-400" />}
                    <div className="w-px h-4 bg-gray-600"></div>
                    {PowerUpIcon && <PowerUpIcon size={20} className="text-blue-400" />}
                 </div>
                 
                 {timeLeft > 0 && (
                     <div className={`flex items-center gap-2 bg-black/50 px-3 py-1 rounded border shadow-lg font-mono font-bold text-lg ${timeLeft <= 10 ? 'text-red-500 animate-pulse border-red-500' : 'text-white border-gray-700'}`}>
                         <Clock size={18} />
                         {timeLeft}s
                     </div>
                 )}
            </div>

            <div className="flex gap-2 sm:gap-4 justify-end pointer-events-auto items-start">
                <div className="hidden lg:flex flex-col items-end relative">
                    <div className={`px-3 py-1 rounded flex items-center gap-2 transition-colors duration-200 text-lg font-bold ${isBuildMode ? 'bg-orange-600 ring-2 ring-yellow-400 text-white' : 'bg-black/50 text-gray-300'}`}>
                        {isBuildMode ? 'BUILD MODE ON' : 'BUILD MODE'} <span className="text-xs bg-white/20 px-1 rounded">[F]</span>
                    </div>
                    
                    {actionLabel && (
                        <div className="absolute top-full right-0 mt-1 text-xs text-yellow-400 font-bold bg-black/80 px-2 py-1 rounded border border-yellow-400/30 whitespace-nowrap shadow-md">
                            {actionLabel}
                        </div>
                    )}
                </div>
                <button 
                    onClick={onPauseToggle}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded flex items-center transition-colors h-10 shadow-lg"
                >
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
            </div>
        </div>
    );
};

export default GameHUD;
