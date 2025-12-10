
import React, { useEffect, useRef, useState } from 'react';
import { 
    CANVAS_WIDTH as DEFAULT_CANVAS_WIDTH, CANVAS_HEIGHT as DEFAULT_CANVAS_HEIGHT, TILE_SIZE, 
    InputKeys, PLAYER_WIDTH, PLAYER_HEIGHT, DUCK_HEIGHT, COLORS,
    MS_PER_UPDATE, BLOCK_COLORS, DICE_BLOCK_OPTIONS
} from '../constants';
import { 
    Entity, EntityType, PlayerState, LevelData, Camera, BuildState, FlyingFace,
    BlockType, PowerUpType
} from '../types';
import { createLevel } from '../utils/levelGenerator';
import { drawRect, drawRobot, drawSpike, drawSpider, drawCheckpoint, drawLamp, drawIntroDice, drawFlyingFace, drawProjectile, drawBuiltBlock, drawMovingPlatform, drawFruitFly } from '../utils/renderer';
import { audioManager } from '../utils/audioManager';
import { updatePlayerPhysics, updateEntities, checkHazardsAndTriggers, isRectIntersect } from '../utils/physicsEngine';
import { handleBuild, handleShoot, handlePhase } from '../utils/gameActions';

import GameHUD from './ui/GameHUD';
import MobileControls from './ui/MobileControls';
import PauseMenu from './ui/PauseMenu';
import { Map, ArrowLeft, ArrowRight, X, SkipForward } from 'lucide-react';

interface GameCanvasProps {
    startLevel: number;
    initialCheckpoint?: number;
    activeBlockType: BlockType;
    activePowerUp: PowerUpType | null;
    isAdminMode?: boolean;
    onGameOver: (level: number) => void;
    onWin: () => void;
    onHome: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ startLevel, initialCheckpoint = 0, activeBlockType, activePowerUp, isAdminMode = false, onGameOver, onWin, onHome }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const previousTimeRef = useRef<number>(0);
    const lagRef = useRef<number>(0);
    const deathTimeoutRef = useRef<number | null>(null);
    
    // Dynamic Canvas Dimensions
    const [canvasSize, setCanvasSize] = useState({ width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT });
    const canvasSizeRef = useRef({ width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT });
    
    const keysPressed = useRef<Set<string>>(new Set());
    const jumpAllowed = useRef(true); 
    const canShootRef = useRef(true);
    const canPhaseRef = useRef(true);
    const canActionRef = useRef(true); // Throttle space action

    const levelData = useRef<LevelData>(createLevel(startLevel));
    const player = useRef<PlayerState>({
        id: 'player',
        type: EntityType.PLAYER,
        x: 0, 
        y: 0,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        vx: 0,
        vy: 0,
        isGrounded: false,
        lastGroundedTime: 0,
        isDucking: false,
        facingRight: true,
        buildMode: false,
        animFrame: 0,
        state: 'idle',
        lives: activePowerUp === PowerUpType.EXTRA_LIFE ? 4 : 3,
        currentLevel: startLevel,
        lastCheckpointIndex: initialCheckpoint,
        
        jumpCount: 0,
        canDoubleJump: activePowerUp === PowerUpType.DOUBLE_JUMP,
        hasPhased: false,
        phaseActiveUntil: 0,
        dashEndTime: 0
    });
    
    const camera = useRef<Camera>({ x: 0, y: 0 });
    const viewCamera = useRef<Camera>({ x: 0, y: 0 }); // Camera for View Mode
    
    // Intro State
    const introState = useRef({ active: initialCheckpoint === 0, x: 0, rotation: 0, nextCheckpointIndex: 1 });
    const flyingFaces = useRef<FlyingFace[]>([]);

    const lastBuildTime = useRef<number>(0);
    const lastStepTime = useRef<number>(0);
    const hasInitializedAudio = useRef<boolean>(false);
    
    // Timer Logic
    const timerRef = useRef<number>(0); 

    const [currentLevel, setCurrentLevel] = useState(startLevel);
    const [lives, setLives] = useState(player.current.lives);
    const [isPaused, setIsPaused] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [volume, setVolume] = useState(audioManager.getVolume());
    const [isMuted, setIsMuted] = useState(audioManager.isAudioMuted());
    const [isBuildMode, setIsBuildMode] = useState(false); // UI State
    const [isIntroActive, setIsIntroActive] = useState(initialCheckpoint === 0); // State to trigger re-renders for UI
    const [timeLeft, setTimeLeft] = useState<number>(0); // UI State for Timer
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Refs for state access in event listeners and loop
    const isPausedRef = useRef(isPaused);
    const viewModeRef = useRef(viewMode);
    const isTouchDeviceRef = useRef(false);

    // Determine Action Label
    let actionLabel = '';
    if (isBuildMode) {
        actionLabel = 'BUILD [SPACE]';
    } else {
        if (activePowerUp === PowerUpType.LASER) actionLabel = 'SHOOT [SPACE]';
        else if (activePowerUp === PowerUpType.PHASE) actionLabel = 'PHASE [SPACE]';
    }

    useEffect(() => {
        isPausedRef.current = isPaused;
    }, [isPaused]);

    useEffect(() => {
        viewModeRef.current = viewMode;
    }, [viewMode]);

    useEffect(() => {
        const handleResize = () => {
            const aspect = window.innerWidth / window.innerHeight;
            let newWidth, newHeight;
            if (aspect >= 1) {
                newHeight = 768;
                newWidth = newHeight * aspect;
            } else {
                newWidth = 640;
                newHeight = newWidth / aspect;
            }
            const MAX_DIM = 2560;
            if (newWidth > MAX_DIM || newHeight > MAX_DIM) {
                const scale = MAX_DIM / Math.max(newWidth, newHeight);
                newWidth *= scale;
                newHeight *= scale;
            }
            const dims = { width: Math.round(newWidth), height: Math.round(newHeight) };
            setCanvasSize(dims);
            canvasSizeRef.current = dims;
        };

        window.addEventListener('resize', handleResize);
        handleResize(); 

        resetLevel(startLevel, initialCheckpoint, initialCheckpoint === 0);
        
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(hasTouch);
        isTouchDeviceRef.current = hasTouch;
        
        const handleInteraction = () => {
             if (!hasInitializedAudio.current) {
                 audioManager.init();
                 audioManager.resume();
                 audioManager.startMusic();
                 hasInitializedAudio.current = true;
             }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            handleInteraction();
            const k = e.key.toLowerCase();
            let key = k;
            if (k === 'arrowup') key = InputKeys.W;
            else if (k === 'arrowdown') key = InputKeys.S;
            else if (k === 'arrowleft') key = InputKeys.A;
            else if (k === 'arrowright') key = InputKeys.D;
            else if (k === ' ') key = InputKeys.SPACE;

            keysPressed.current.add(key);
            
            if (viewModeRef.current) {
                if (k === InputKeys.ESCAPE || k === InputKeys.SPACE) {
                    setViewMode(false); 
                    setIsPaused(true); 
                }
                return;
            }
            
            if (introState.current.active) {
                if (k === InputKeys.SPACE && !isTouchDeviceRef.current) {
                    skipIntro();
                }
                return;
            }

            if (k === InputKeys.ESCAPE) {
                setIsPaused(prev => !prev);
            }

            if (isPausedRef.current || player.current.state === 'dead') return; 

            if (k === InputKeys.F) {
                toggleBuildMode();
            }
            
            if (k === InputKeys.SPACE) {
                if (canActionRef.current) {
                    if (player.current.buildMode) {
                        performBuild();
                    } else {
                        performAction();
                    }
                    canActionRef.current = false;
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
            let key = k;
            if (k === 'arrowup') key = InputKeys.W;
            else if (k === 'arrowdown') key = InputKeys.S;
            else if (k === 'arrowleft') key = InputKeys.A;
            else if (k === 'arrowright') key = InputKeys.D;
            else if (k === ' ') key = InputKeys.SPACE;

            keysPressed.current.delete(key);
            if (k === ' ') canActionRef.current = true;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('click', handleInteraction);

        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('click', handleInteraction);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (deathTimeoutRef.current) clearTimeout(deathTimeoutRef.current);
            audioManager.stopMusic();
            audioManager.stopRolling();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const toggleBuildMode = () => {
        player.current.buildMode = !player.current.buildMode;
        setIsBuildMode(player.current.buildMode);
    };

    const handleTouchStart = (key: string) => {
        if (!hasInitializedAudio.current) {
             audioManager.init();
             audioManager.resume();
             audioManager.startMusic();
             hasInitializedAudio.current = true;
        }

        if (introState.current.active && key === InputKeys.SPACE) {
            skipIntro();
            return;
        }

        if (key === InputKeys.F) {
            toggleBuildMode();
            return;
        }

        keysPressed.current.add(key);
        
        if (key === InputKeys.SPACE) {
            if (canActionRef.current) {
                 if (player.current.buildMode) {
                     performBuild();
                 } else {
                     performAction();
                 }
                 canActionRef.current = false;
            }
        }
    };

    const handleTouchEnd = (key: string) => {
        if (key !== InputKeys.F) {
            keysPressed.current.delete(key);
        }
        if (key === InputKeys.SPACE) {
            canActionRef.current = true;
        }
    };

    const toggleViewMode = () => {
        if (!viewMode) {
            viewCamera.current = { ...camera.current };
        } 
        setViewMode(!viewMode);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        audioManager.setVolume(val);
    };

    const handleMuteToggle = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        audioManager.toggleMute(newState);
    };

    const skipIntro = () => {
        introState.current.active = false;
        setIsIntroActive(false);
        audioManager.stopRolling();
        flyingFaces.current = [];
        
        levelData.current.entities.forEach(e => {
            if (e.type === EntityType.CHECKPOINT) {
                e.visible = true;
            }
        });

        const targetX = player.current.x - canvasSizeRef.current.width / 2;
        camera.current.x = Math.max(0, Math.min(targetX, levelData.current.width - canvasSizeRef.current.width));
    };

    const resetLevel = (lvlIndex: number, checkpointIndex: number, showIntro: boolean, preservedTime?: number) => {
        levelData.current = createLevel(lvlIndex);
        
        if (preservedTime !== undefined && levelData.current.timeLimit) {
            timerRef.current = preservedTime;
            setTimeLeft(Math.ceil(preservedTime / 1000));
        } else if (levelData.current.timeLimit) {
            timerRef.current = levelData.current.timeLimit * 1000;
            setTimeLeft(levelData.current.timeLimit);
        } else {
            timerRef.current = 0;
            setTimeLeft(0);
        }

        let spawn = levelData.current.spawnPoint;
        if (checkpointIndex > 0) {
            const cpEntity = levelData.current.entities.find(
                e => e.type === EntityType.CHECKPOINT && e.properties.index === checkpointIndex
            );
            if (cpEntity) {
                spawn = { x: cpEntity.x, y: cpEntity.y - PLAYER_HEIGHT - 5 };
                levelData.current.entities.forEach(e => {
                    if (e.type === EntityType.CHECKPOINT && e.properties.index <= checkpointIndex) {
                        e.visible = true;
                    }
                });
            }
        }

        player.current.x = spawn.x;
        player.current.y = spawn.y;
        player.current.vx = 0;
        player.current.vy = 0;
        player.current.isDucking = false;
        player.current.isGrounded = false;
        player.current.lastGroundedTime = 0;
        player.current.height = PLAYER_HEIGHT;
        player.current.currentLevel = lvlIndex;
        player.current.lastCheckpointIndex = checkpointIndex;
        player.current.state = 'idle';
        player.current.buildMode = false;
        player.current.jumpCount = 0;
        player.current.phaseActiveUntil = 0;
        player.current.dashEndTime = 0;
        
        if (checkpointIndex === 0 && showIntro) {
            player.current.lives = activePowerUp === PowerUpType.EXTRA_LIFE ? 4 : 3;
            setLives(player.current.lives);
        }

        if (showIntro) {
            introState.current = { active: true, x: 0, rotation: 0, nextCheckpointIndex: checkpointIndex + 1 };
            setIsIntroActive(true);
            flyingFaces.current = [];
            audioManager.playRolling();
        } else {
            levelData.current.entities.forEach(e => {
                if (e.type === EntityType.CHECKPOINT) e.visible = true;
            });
            introState.current = { active: false, x: 0, rotation: 0, nextCheckpointIndex: checkpointIndex + 1 };
            setIsIntroActive(false);
            audioManager.stopRolling();
            
            const w = canvasSizeRef.current.width;
            camera.current.x = Math.max(0, Math.min(spawn.x - w / 2, levelData.current.width - w));
        }
        
        setIsBuildMode(false);
        setCurrentLevel(lvlIndex);
    };

    const performAction = () => {
        if (player.current.state === 'dead') return;

        if (activePowerUp === PowerUpType.LASER) {
             if (canShootRef.current) handleShoot(player.current, levelData.current, audioManager);
        } else if (activePowerUp === PowerUpType.PHASE) {
             if (canPhaseRef.current) handlePhase(player.current, audioManager);
        }
    };

    const performBuild = () => {
        if (player.current.state === 'dead') return;
        const now = Date.now();
        if (now - lastBuildTime.current < 200) return;
        lastBuildTime.current = now;
        
        handleBuild(player.current, levelData.current, activeBlockType, audioManager);
    };

    const updateViewModeCamera = () => {
        const speed = 10;
        const keys = keysPressed.current;
        const width = canvasSizeRef.current.width;
        if (keys.has(InputKeys.A) || keys.has(InputKeys.ARROW_LEFT)) viewCamera.current.x -= speed;
        if (keys.has(InputKeys.D) || keys.has(InputKeys.ARROW_RIGHT)) viewCamera.current.x += speed;

        viewCamera.current.x = Math.max(0, Math.min(viewCamera.current.x, levelData.current.width - width));
    };

    const updateIntroLogic = () => {
        const speed = 15;
        const groundY = 14 * TILE_SIZE; 
        const diceSize = TILE_SIZE * 2;
        const width = canvasSizeRef.current.width;
        
        introState.current.x += speed;
        introState.current.rotation += 0.2;

        const entities = levelData.current.entities;
        const nextIdx = introState.current.nextCheckpointIndex;
        
        const cp = entities.find(e => e.type === EntityType.CHECKPOINT && e.properties.index === nextIdx);
        
        if (cp && introState.current.x > cp.x) {
            flyingFaces.current.push({
                x: introState.current.x,
                y: groundY - diceSize/2,
                targetX: cp.x,
                targetY: cp.y,
                value: nextIdx,
                reached: false
            });
            introState.current.nextCheckpointIndex++;
        }

        flyingFaces.current.forEach(face => {
            if (face.reached) return;
            const dx = face.targetX - face.x;
            const dy = face.targetY - face.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 20) {
                face.reached = true;
                const targetCp = entities.find(e => e.type === EntityType.CHECKPOINT && e.properties.index === face.value);
                if (targetCp) targetCp.visible = true;
                audioManager.playDing();
            } else {
                face.x += dx * 0.1;
                face.y += dy * 0.1;
            }
        });

        camera.current.x = introState.current.x - width / 2;
        camera.current.x = Math.max(0, Math.min(camera.current.x, levelData.current.width - width));

        if (introState.current.x > levelData.current.width + 200) {
            skipIntro();
        }
    };

    const triggerDeathAnimation = () => {
        if (player.current.state === 'dead') return;
        player.current.state = 'dead';
        player.current.vx = 0;
        player.current.vy = -12; 
        audioManager.playDie();
        
        if (deathTimeoutRef.current) clearTimeout(deathTimeoutRef.current);
        deathTimeoutRef.current = window.setTimeout(() => handleLifeLost(), 500); 
    };

    const handleLifeLost = () => {
        if (levelData.current.timeLimit && timerRef.current <= 0 && !isAdminMode) {
             onGameOver(player.current.currentLevel);
             return;
        }

        if (!isAdminMode) {
            player.current.lives -= 1;
            setLives(player.current.lives);
        }

        if (player.current.lives <= 0 && !isAdminMode) {
             onGameOver(player.current.currentLevel);
        } else {
             let nextTimer = timerRef.current;
             if (isAdminMode && levelData.current.timeLimit && timerRef.current <= 0) {
                 nextTimer = levelData.current.timeLimit * 1000;
             }
             resetLevel(player.current.currentLevel, player.current.lastCheckpointIndex, false, nextTimer);
        }
    };

    const updateCamera = () => {
        const { width, height } = canvasSizeRef.current;
        const isPortrait = height > width;
        let offsetY;
        if (isTouchDeviceRef.current) {
            if (isPortrait) offsetY = height / 1.6; 
            else offsetY = height / 2.2;
        } else {
            offsetY = height / 1.5;
        }
        
        let targetX = player.current.x - width / 2;
        targetX = Math.max(0, Math.min(targetX, levelData.current.width - width));
        
        let trackY = player.current.y;
        if (player.current.isDucking) {
            trackY -= (PLAYER_HEIGHT - DUCK_HEIGHT);
        }

        let targetY = trackY - offsetY;
        targetY = Math.max(0, Math.min(targetY, levelData.current.height - height)); 
        
        camera.current.x += (targetX - camera.current.x) * 0.1;
        camera.current.y += (targetY - camera.current.y) * 0.1;
    };

    const gameLoop = (time: number) => {
        if (!previousTimeRef.current) previousTimeRef.current = time;
        const deltaTime = time - previousTimeRef.current;
        previousTimeRef.current = time;
        lagRef.current += Math.min(deltaTime, 100);

        while (lagRef.current >= MS_PER_UPDATE) {
            if (introState.current.active) {
                updateIntroLogic();
            } else if (viewModeRef.current) {
                updateViewModeCamera();
            } else if (!isPausedRef.current) {
                // Update Physics via Utility
                const physicsResult = updatePlayerPhysics(
                    player.current, 
                    levelData.current, 
                    keysPressed.current, 
                    jumpAllowed, 
                    activePowerUp, 
                    audioManager
                );
                
                if (physicsResult.wasGrounded && !player.current.isGrounded) {
                     // Just took off
                }
                
                if (physicsResult.isMoving && player.current.isGrounded) {
                     const stepInterval = player.current.buildMode ? 400 : 250;
                     if (Date.now() - lastStepTime.current > stepInterval) {
                         audioManager.playStep();
                         lastStepTime.current = Date.now();
                     }
                }

                checkHazardsAndTriggers(player.current, levelData.current, audioManager, {
                    onLevelComplete: onWin,
                    onDeath: triggerDeathAnimation
                });

                if (player.current.y > canvasSizeRef.current.height + 200) {
                    handleLifeLost();
                }
                
                // Entity Updates
                updateEntities(levelData.current, player.current, canvasSizeRef.current.height, audioManager, triggerDeathAnimation);

                if (timerRef.current > 0 && player.current.state !== 'dead') {
                    timerRef.current -= MS_PER_UPDATE;
                    if (timerRef.current <= 0) {
                         timerRef.current = 0;
                         triggerDeathAnimation(); 
                    }
                }
            }
            lagRef.current -= MS_PER_UPDATE;
        }
        
        const secondsLeft = Math.ceil(timerRef.current / 1000);
        if (secondsLeft !== timeLeft) {
            setTimeLeft(secondsLeft);
        }

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const activeCam = introState.current.active 
                ? camera.current 
                : viewModeRef.current ? viewCamera.current : camera.current;
            
            const { width, height } = canvasSizeRef.current;
            
            if (!viewModeRef.current && !introState.current.active) updateCamera();

            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, width, height);
            
            const entities = levelData.current.entities;
            const visibleEntities = entities.filter(e => 
                e.x + e.width > activeCam.x && e.x < activeCam.x + width
            );

            visibleEntities.forEach(e => {
                if (e.type === EntityType.PLATFORM) {
                     drawRect(ctx, activeCam, e.x, e.y, e.width, e.height, e.color || '#000');
                } else if (e.type === EntityType.MOVING_PLATFORM) {
                     drawMovingPlatform(ctx, activeCam, e);
                } else if (e.type === EntityType.BUILT_BLOCK) {
                     drawBuiltBlock(ctx, activeCam, e); 
                } else if (e.type === EntityType.SPIKE || e.type === EntityType.FALLING_SPIKE) {
                    drawSpike(ctx, activeCam, e);
                } else if (e.type === EntityType.ENEMY_SPIDER) {
                    drawSpider(ctx, activeCam, e);
                } else if (e.type === EntityType.FRUIT_FLY) {
                    drawFruitFly(ctx, activeCam, e);
                } else if (e.type === EntityType.CHECKPOINT) {
                    drawCheckpoint(ctx, activeCam, e, e.properties.index <= player.current.lastCheckpointIndex);
                } else if (e.type === EntityType.LAMP) {
                    drawLamp(ctx, activeCam, e);
                } else if (e.type === EntityType.PROJECTILE) {
                    drawProjectile(ctx, activeCam, e);
                }
            });
            
            if (introState.current.active) {
                drawIntroDice(ctx, activeCam, introState.current.x, (14 * TILE_SIZE) - (TILE_SIZE * 2), introState.current.rotation);
                flyingFaces.current.forEach(face => {
                    if (!face.reached) drawFlyingFace(ctx, activeCam, face);
                });
            }

            let buildState: BuildState = 'invalid';
            
            if (!introState.current.active && !viewModeRef.current && !isPausedRef.current && player.current.buildMode && player.current.state !== 'dead') {
                const p = player.current;
                
                let typeToBuild = activeBlockType;
                if (typeToBuild === BlockType.RANDOM) {
                    // Visual only, logic handled in action
                }
                
                let buildWidth = TILE_SIZE;
                let buildHeight = TILE_SIZE;
                
                if (typeToBuild === BlockType.HIGH) {
                    buildWidth = TILE_SIZE / 2;
                    buildHeight = TILE_SIZE * 2;
                } else if (typeToBuild === BlockType.WIDE) {
                    buildWidth = TILE_SIZE * 2;
                    buildHeight = TILE_SIZE / 2;
                }

                let buildX, buildY;
                const GAP = 2;
                if (p.facingRight) buildX = p.x + p.width + GAP;
                else buildX = p.x - buildWidth - GAP;

                if (p.isDucking) buildY = p.y + p.height; 
                else buildY = p.y + p.height - buildHeight;
        
                let intersectingType: EntityType | null = null;
                const playerOverlap = isRectIntersect(buildX, buildY, buildWidth, buildHeight, p.x, p.y, p.width, p.height);

                for (const e of levelData.current.entities) {
                    if (isRectIntersect(buildX, buildY, buildWidth, buildHeight, e.x, e.y, e.width, e.height)) {
                         intersectingType = e.type;
                         break; 
                    }
                }

                if (intersectingType === EntityType.BUILT_BLOCK) buildState = 'deconstruct';
                else if (intersectingType === EntityType.ENEMY_SPIDER || intersectingType === EntityType.FRUIT_FLY) buildState = 'valid';
                else if (intersectingType === EntityType.PLATFORM || intersectingType === EntityType.LAMP || intersectingType === EntityType.MOVING_PLATFORM || playerOverlap) buildState = 'invalid';
                else buildState = 'valid';
                
                const ghostColor = BLOCK_COLORS[typeToBuild] ? BLOCK_COLORS[typeToBuild].replace('1)', '0.3)') : undefined;
                drawRobot(ctx, activeCam, player.current, activePowerUp, buildState, {
                    width: buildWidth, height: buildHeight, color: ghostColor || 'rgba(241, 196, 15, 0.3)'
                });

            } else if (!introState.current.active) {
                 drawRobot(ctx, activeCam, player.current, activePowerUp, buildState);
            }
        }

        requestRef.current = requestAnimationFrame(gameLoop);
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center overflow-hidden touch-none">
            <canvas 
                ref={canvasRef}
                width={canvasSize.width} 
                height={canvasSize.height}
                className="block max-w-full max-h-full object-contain"
            />
            {/* View Mode UI */}
            {viewMode && !isTouchDevice && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-900/90 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2 border border-indigo-500 z-20">
                    <Map size={18} />
                    VIEW MODE ACTIVE - [A/D] TO MOVE - [ESC/SPACE] TO EXIT
                </div>
            )}
            
            {/* View Mode Mobile Controls */}
            {viewMode && isTouchDevice && (
                <div className="absolute inset-0 pointer-events-none z-30">
                    <div className="absolute bottom-4 left-4 flex gap-4 pointer-events-auto">
                        <button 
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                            onTouchStart={() => handleTouchStart(InputKeys.A)}
                            onTouchEnd={() => handleTouchEnd(InputKeys.A)}
                        >
                            <ArrowLeft size={24} className="text-white" />
                        </button>
                        <button 
                            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                            onTouchStart={() => handleTouchStart(InputKeys.D)}
                            onTouchEnd={() => handleTouchEnd(InputKeys.D)}
                        >
                            <ArrowRight size={24} className="text-white" />
                        </button>
                    </div>
                    <button 
                        onClick={() => setViewMode(false)}
                        className="absolute top-4 right-4 pointer-events-auto bg-red-500/80 text-white px-4 py-2 rounded-full font-bold border-2 border-white/30 shadow-lg flex items-center gap-2"
                    >
                         <X size={20} /> EXIT
                    </button>
                </div>
            )}
            
            {/* Intro Skip UI */}
            {isIntroActive && !isTouchDevice && (
                <div className="absolute bottom-8 right-8 text-white font-bold text-lg animate-pulse select-none pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-20">
                    PRESS [SPACE] TO SKIP
                </div>
            )}

            {isIntroActive && isTouchDevice && (
                <button 
                    onClick={skipIntro}
                    className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md border border-white/50 text-white px-6 py-3 rounded-full font-bold shadow-lg active:scale-95 z-40 flex items-center gap-2"
                >
                    SKIP <SkipForward size={20} fill="currentColor" />
                </button>
            )}
            
            {/* Main Mobile Controls */}
            {!viewMode && !isPaused && isTouchDevice && !isIntroActive && (
                <MobileControls 
                    onTouchStart={handleTouchStart} 
                    onTouchEnd={handleTouchEnd} 
                    activePowerUp={activePowerUp} 
                    isBuildMode={isBuildMode} 
                />
            )}
            
            {/* HUD */}
            {!viewMode && !isIntroActive && (
                <GameHUD 
                    currentLevel={currentLevel}
                    lives={lives}
                    isAdminMode={isAdminMode}
                    activeBlockType={activeBlockType}
                    activePowerUp={activePowerUp}
                    timeLeft={timeLeft}
                    isBuildMode={isBuildMode}
                    actionLabel={actionLabel}
                    isPaused={isPaused}
                    onPauseToggle={() => setIsPaused(!isPaused)}
                />
            )}

            {/* Pause Menu */}
            {isPaused && !viewMode && (
                <PauseMenu 
                    activeBlockType={activeBlockType}
                    activePowerUp={activePowerUp}
                    volume={volume}
                    isMuted={isMuted}
                    onVolumeChange={handleVolumeChange}
                    onMuteToggle={handleMuteToggle}
                    onResume={() => setIsPaused(false)}
                    onViewMode={toggleViewMode}
                    onHome={onHome}
                />
            )}
            
            <div className="absolute bottom-4 left-4 text-gray-500 text-xs pointer-events-none font-bold hidden lg:block">
                Controls: WASD / ARROWS to Move
            </div>
        </div>
    );
};

export default GameCanvas;
