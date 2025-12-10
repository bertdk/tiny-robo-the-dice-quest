
import React from 'react';
import { Volume2, VolumeX, Play, Eye, Home } from 'lucide-react';
import { BlockType, PowerUpType } from '../../types';
import { DICE_BLOCK_OPTIONS, DICE_POWERUP_OPTIONS } from '../../constants';

interface PauseMenuProps {
    activeBlockType: BlockType;
    activePowerUp: PowerUpType | null;
    volume: number;
    isMuted: boolean;
    onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onMuteToggle: () => void;
    onResume: () => void;
    onViewMode: () => void;
    onHome: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ 
    activeBlockType, activePowerUp, volume, isMuted, onVolumeChange, onMuteToggle, onResume, onViewMode, onHome 
}) => {
    const blockOption = DICE_BLOCK_OPTIONS.find(o => o.type === activeBlockType);
    const powerUpOption = DICE_POWERUP_OPTIONS.find(o => o.type === activePowerUp);
    const BlockIcon = blockOption?.icon;
    const PowerUpIcon = powerUpOption?.icon;

    return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm p-4">
            <div className="bg-gray-800 p-8 rounded-xl border-2 border-gray-600 text-center shadow-2xl max-w-md w-full max-h-full overflow-y-auto landscape:max-w-2xl">
                <h2 className="text-3xl font-bold text-white mb-6 landscape:mb-2">
                    PAUSED
                </h2>
                
                <div className="bg-gray-900 p-4 rounded-lg mb-4 border border-gray-700 landscape:p-2 landscape:mb-2 landscape:flex landscape:items-center landscape:justify-center landscape:gap-4">
                    <h3 className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider landscape:mb-0">Current Loadout</h3>
                    <div className="flex justify-center gap-8 landscape:gap-4">
                        <div className="flex flex-col items-center landscape:flex-row landscape:gap-2">
                             <div className="w-12 h-12 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center mb-2 landscape:mb-0 shadow-inner">
                                 {BlockIcon && <BlockIcon size={24} className="text-yellow-400" />}
                             </div>
                             <span className="text-[10px] text-gray-300 font-bold tracking-tight">{blockOption?.label}</span>
                        </div>
                        <div className="flex flex-col items-center landscape:flex-row landscape:gap-2">
                             <div className="w-12 h-12 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center mb-2 landscape:mb-0 shadow-inner">
                                 {PowerUpIcon && <PowerUpIcon size={24} className="text-blue-400" />}
                             </div>
                             <span className="text-[10px] text-gray-300 font-bold tracking-tight">{powerUpOption?.label}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 landscape:space-y-2">
                    <div className="bg-gray-900 p-4 rounded-lg landscape:p-2 landscape:flex landscape:items-center landscape:gap-4">
                        <label className="text-gray-300 flex items-center gap-2 mb-2 text-sm font-bold landscape:mb-0">
                            <Volume2 size={16} /> SOUND
                        </label>
                        <div className="flex items-center gap-4 flex-1">
                            <button 
                                onClick={onMuteToggle}
                                className="text-white bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={volume}
                                onChange={onVolumeChange}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 flex-1"
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 landscape:flex-row landscape:gap-2">
                        <button 
                            onClick={onResume}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg landscape:py-2 landscape:text-sm"
                        >
                            <Play size={20} /> RESUME
                        </button>
                        
                        <button 
                            onClick={onViewMode}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg landscape:py-2 landscape:text-sm"
                        >
                            <Eye size={20} /> VIEW
                        </button>

                         <button 
                            onClick={onHome}
                            className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg landscape:py-2 landscape:text-sm"
                        >
                            <Home size={20} /> HOME
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PauseMenu;
