
import React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Hammer, Crosshair, Zap } from 'lucide-react';
import { InputKeys } from '../../constants';
import { PowerUpType } from '../../types';

interface MobileControlsProps {
    onTouchStart: (key: string) => void;
    onTouchEnd: (key: string) => void;
    activePowerUp: PowerUpType | null;
    isBuildMode: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({ onTouchStart, onTouchEnd, activePowerUp, isBuildMode }) => {
    return (
        <div className="absolute inset-0 pointer-events-none z-30">
            <div className="absolute bottom-4 left-4 flex gap-1 pointer-events-auto landscape:bottom-4 landscape:left-4">
                <button 
                    className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                    onTouchStart={() => onTouchStart(InputKeys.A)}
                    onTouchEnd={() => onTouchEnd(InputKeys.A)}
                >
                    <ArrowLeft size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                </button>
                <div className="flex flex-col gap-1 sm:gap-2">
                     <div className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12"></div> {/* Spacer */}
                     <button 
                        className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                        onTouchStart={() => onTouchStart(InputKeys.S)}
                        onTouchEnd={() => onTouchEnd(InputKeys.S)}
                    >
                        <ArrowDown size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                    </button>
                </div>
                <button 
                    className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                    onTouchStart={() => onTouchStart(InputKeys.D)}
                    onTouchEnd={() => onTouchEnd(InputKeys.D)}
                >
                    <ArrowRight size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                </button>
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto items-end landscape:bottom-4 landscape:right-4">
                 <button 
                    className={`w-10 h-10 sm:w-14 sm:h-14 landscape:w-10 landscape:h-10 landscape:sm:w-12 landscape:sm:h-12 rounded-full border-2 flex items-center justify-center active:scale-95 transition-colors touch-none ${isBuildMode ? 'bg-orange-500 border-yellow-300' : 'bg-gray-700/50 border-white/30'}`}
                    onTouchStart={() => onTouchStart(InputKeys.F)}
                    onTouchEnd={() => onTouchEnd(InputKeys.F)}
                >
                    <Hammer size={18} className="text-white sm:w-6 sm:h-6 landscape:w-5 landscape:h-5" />
                </button>
                
                <div className="flex flex-col gap-2 sm:gap-4">
                    <button 
                        className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-blue-500/30 backdrop-blur-sm rounded-full border-2 border-blue-300/50 flex items-center justify-center active:bg-blue-500/50 touch-none"
                        onTouchStart={() => onTouchStart(InputKeys.W)}
                        onTouchEnd={() => onTouchEnd(InputKeys.W)}
                    >
                        <ArrowUp size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                    </button>
                    <button 
                        className={`w-16 h-16 sm:w-20 sm:h-20 landscape:w-14 landscape:h-14 landscape:sm:w-16 landscape:sm:h-16 rounded-full border-2 border-white/40 flex items-center justify-center active:scale-95 shadow-lg touch-none ${isBuildMode ? 'bg-yellow-500/40' : 'bg-red-500/40'}`}
                        onTouchStart={() => onTouchStart(InputKeys.SPACE)}
                        onTouchEnd={() => onTouchEnd(InputKeys.SPACE)}
                    >
                        {isBuildMode ? (
                            <Hammer size={24} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                        ) : activePowerUp === PowerUpType.LASER ? (
                            <Crosshair size={24} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                        ) : activePowerUp === PowerUpType.PHASE ? (
                            <Zap size={24} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-white/50" /> 
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileControls;
