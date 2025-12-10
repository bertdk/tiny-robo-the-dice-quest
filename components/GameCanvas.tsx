
import React, { useEffect, useRef, useState } from 'react';
import { 
    CANVAS_WIDTH as DEFAULT_CANVAS_WIDTH, CANVAS_HEIGHT as DEFAULT_CANVAS_HEIGHT, TILE_SIZE, GRAVITY, FALL_GRAVITY_MULTIPLIER, JUMP_FORCE, COYOTE_TIME_MS, MOVE_SPEED, 
    InputKeys, PLAYER_WIDTH, PLAYER_HEIGHT, DUCK_HEIGHT, MAX_FALL_SPEED, COLORS,
    MS_PER_UPDATE, LASER_SPEED, PHASE_DURATION, SPEED_BOOST_MULTIPLIER, GRAVITY_BOOTS_MULTIPLIER,
    DICE_BLOCK_OPTIONS, BLOCK_COLORS, DICE_POWERUP_OPTIONS
} from '../constants';
import { 
    Entity, EntityType, PlayerState, LevelData, Camera, BuildState, FlyingFace,
    BlockType, PowerUpType
} from '../types';
import { createLevel } from '../utils/levelGenerator';
import { drawRect, drawRobot, drawSpike, drawSpider, drawCheckpoint, drawLamp, drawIntroDice, drawFlyingFace, drawProjectile, drawBuiltBlock, drawMovingPlatform, drawFruitFly } from '../utils/renderer';
import { audioManager } from '../utils/audioManager';
import { Heart, Pause, Play, Eye, Map, Volume2, VolumeX, Home, Clock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, Hammer, Zap, SkipForward, X, Infinity as InfinityIcon } from 'lucide-react';

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
    // If we start at a specific checkpoint (admin mode), skip intro
    const introState = useRef({ active: initialCheckpoint === 0, x: 0, rotation: 0, nextCheckpointIndex: 1 });
    const flyingFaces = useRef<FlyingFace[]>([]);

    const lastBuildTime = useRef<number>(0);
    const lastStepTime = useRef<number>(0);
    const hasInitializedAudio = useRef<boolean>(false);
    
    // Timer Logic
    const timerRef = useRef<number>(0); // Current time left in ms

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

    // Icons/Data for HUD and Pause Menu
    const blockOption = DICE_BLOCK_OPTIONS.find(o => o.type === activeBlockType);
    const powerUpOption = DICE_POWERUP_OPTIONS.find(o => o.type === activePowerUp);
    const BlockIcon = blockOption?.icon;
    const PowerUpIcon = powerUpOption?.icon;

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
        // Initialize logic for determining canvas size based on window aspect ratio
        const handleResize = () => {
            const aspect = window.innerWidth / window.innerHeight;
            let newWidth, newHeight;

            // Base tile targets to ensure consistent "zoom" level
            if (aspect >= 1) {
                // Landscape: Fix height to ~19 tiles (768px), scale width
                newHeight = 768;
                newWidth = newHeight * aspect;
            } else {
                // Portrait: Fix width to ~16 tiles (640px), scale height
                // This makes vertical view "taller" (seeing deeper)
                newWidth = 640;
                newHeight = newWidth / aspect;
            }
            
            // Limit max internal resolution to prevent performance issues on huge screens
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
        handleResize(); // Initial call

        // Initialize level on mount ONLY
        resetLevel(startLevel, initialCheckpoint, initialCheckpoint === 0);
        
        // Touch Detection
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
            
            // Map Arrows to WASD for consistent internal handling
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
            
            // Consolidated Space Action
            if (k === InputKeys.SPACE) {
                if (canActionRef.current) {
                    if (player.current.buildMode) {
                        handleBuild();
                    } else {
                        handleAction();
                    }
                    canActionRef.current = false;
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const k = e.key.toLowerCase();
             // Map Arrows to WASD
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

    // Touch Controls
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
                     handleBuild();
                 } else {
                     handleAction();
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
        
        // Force reveal all checkpoints
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
        
        // Timer Initialization
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
        
        // Reset lives to full + bonus if applicable on fresh level start
        if (checkpointIndex === 0 && showIntro) {
            player.current.lives = activePowerUp === PowerUpType.EXTRA_LIFE ? 4 : 3;
            setLives(player.current.lives);
        }

        // Setup Intro
        if (showIntro) {
            introState.current = { active: true, x: 0, rotation: 0, nextCheckpointIndex: checkpointIndex + 1 };
            setIsIntroActive(true);
            flyingFaces.current = [];
            audioManager.playRolling();
        } else {
            // No intro (respawn), so make sure all checkpoints are visible!
            levelData.current.entities.forEach(e => {
                if (e.type === EntityType.CHECKPOINT) e.visible = true;
            });
            
            introState.current = { active: false, x: 0, rotation: 0, nextCheckpointIndex: checkpointIndex + 1 };
            setIsIntroActive(false);
            audioManager.stopRolling();
            
            // Use current canvas dimensions for camera centering
            const w = canvasSizeRef.current.width;
            camera.current.x = Math.max(0, Math.min(spawn.x - w / 2, levelData.current.width - w));
        }
        
        setIsBuildMode(false);
        setCurrentLevel(lvlIndex);
    };

    // ... [Rest of the file remains unchanged from previous versions, only resetLevel logic updated above] ...
    
    const handleAction = () => {
        if (player.current.state === 'dead') return;

        // Trigger Powerup Actions (Laser or Phase)
        if (activePowerUp === PowerUpType.LASER) {
            handleShoot();
        } else if (activePowerUp === PowerUpType.PHASE) {
            handlePhase();
        }
    };

    const handleShoot = () => {
        if (!canShootRef.current) return;
        audioManager.playLaser();
        
        const p = player.current;
        const projectile: Entity = {
            id: `laser-${Date.now()}`,
            type: EntityType.PROJECTILE,
            x: p.facingRight ? p.x + p.width : p.x - 20,
            y: p.y + p.height / 2 - 2,
            width: 20,
            height: 4,
            vx: p.facingRight ? LASER_SPEED : -LASER_SPEED
        };
        levelData.current.entities.push(projectile);
    };

    const handlePhase = () => {
        if (!canPhaseRef.current) return;
        
        // Phase now combines Ghost Wall + Dash Speed
        const p = player.current;
        p.phaseActiveUntil = Date.now() + PHASE_DURATION;
        
        // Dash physics logic
        const dashSpeed = 15;
        p.vx = p.facingRight ? dashSpeed : -dashSpeed;
        p.dashEndTime = Date.now() + 150; // Dash duration
        
        audioManager.playDash();
    };

    const handleBuild = () => {
        if (player.current.state === 'dead') return;
        
        const now = Date.now();
        if (now - lastBuildTime.current < 200) return;
        lastBuildTime.current = now;

        const p = player.current;
        const GAP = 2;
        
        let typeToBuild = activeBlockType;
        if (typeToBuild === BlockType.RANDOM) {
             const options = DICE_BLOCK_OPTIONS.filter(o => o.type !== BlockType.RANDOM);
             typeToBuild = options[Math.floor(Math.random() * options.length)].type;
        }

        // Strict dimensions for different types
        let buildWidth = TILE_SIZE;
        let buildHeight = TILE_SIZE;

        if (typeToBuild === BlockType.HIGH) {
            buildWidth = TILE_SIZE / 2;
            buildHeight = TILE_SIZE * 2;
        } else if (typeToBuild === BlockType.WIDE) {
            buildWidth = TILE_SIZE * 2;
            buildHeight = TILE_SIZE / 2;
        }

        let buildX: number;
        let buildY: number;

        if (p.facingRight) {
            buildX = p.x + p.width + GAP;
        } else {
            buildX = p.x - buildWidth - GAP;
        }

        if (p.isDucking) {
             buildY = p.y + p.height; 
        } else {
             buildY = p.y + p.height - buildHeight;
        }

        let intersectingEntityIndex = -1;
        
        for (let i = 0; i < levelData.current.entities.length; i++) {
            const e = levelData.current.entities[i];
            if (isRectIntersect(buildX, buildY, buildWidth, buildHeight, e.x, e.y, e.width, e.height)) {
                intersectingEntityIndex = i;
                
                if (e.type === EntityType.BUILT_BLOCK) {
                    audioManager.playDeconstruct();
                    levelData.current.entities.splice(i, 1); 
                    return; 
                }
                
                if (e.type === EntityType.PLATFORM || e.type === EntityType.LAMP || e.type === EntityType.MOVING_PLATFORM) {
                    return; 
                }
                
                if (e.type === EntityType.ENEMY_SPIDER || e.type === EntityType.FRUIT_FLY) {
                    levelData.current.entities.splice(i, 1);
                    intersectingEntityIndex = -1; 
                    break; 
                }
            }
        }
        
        const playerOverlap = isRectIntersect(buildX, buildY, buildWidth, buildHeight, p.x, p.y, p.width, p.height);

        if (intersectingEntityIndex === -1 && !playerOverlap) {
            audioManager.playBuild();
            
            const isFalling = typeToBuild === BlockType.SQUARE || typeToBuild === BlockType.HIGH || typeToBuild === BlockType.WIDE;
            const isFloating = typeToBuild === BlockType.FLOATING;
            const color = BLOCK_COLORS[typeToBuild] || COLORS.platforms.block;

            const newBlock: Entity = {
                id: `block-${Date.now()}`,
                type: EntityType.BUILT_BLOCK,
                x: buildX,
                y: buildY,
                width: buildWidth,
                height: buildHeight,
                color: color,
                falling: isFalling && !isFloating, 
                vy: 0,
                expiresAt: typeToBuild === BlockType.TEMPORARY ? Date.now() + 2000 : undefined
            };
            
            levelData.current.entities.push(newBlock);
        }
    };

    const isRectIntersect = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
        return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
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
        
        // Spawn faces logic
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

        // Update faces
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

        // Stop Intro Logic
        // Ensure dice goes past level width to trigger visibility for all (safeguard)
        if (introState.current.x > levelData.current.width + 200) {
            skipIntro();
        }
    };

    const updatePhysics = () => {
        const p = player.current;
        const now = Date.now();
        
        if (p.state === 'dead') {
            p.vy += GRAVITY;
            p.y += p.vy;
            // Early return to prevent collision logic or getting stuck
            return;
        }

        const keys = keysPressed.current;
        let baseSpeed = p.buildMode ? MOVE_SPEED * 0.5 : MOVE_SPEED;
        // Apply Speed Boost multiplier for Phase as well (Merged logic)
        if (activePowerUp === PowerUpType.PHASE) baseSpeed *= SPEED_BOOST_MULTIPLIER;
        
        const currentJumpForce = p.buildMode ? JUMP_FORCE * 0.85 : JUMP_FORCE;
        // Apply varying gravity: heavier when falling
        let effectiveGravity = activePowerUp === PowerUpType.GRAVITY_BOOTS ? GRAVITY * GRAVITY_BOOTS_MULTIPLIER : GRAVITY;
        if (p.vy > 0) {
            effectiveGravity *= FALL_GRAVITY_MULTIPLIER; // Fall faster
        }

        // --- Movement ---
        // If dashing, ignore manual input
        if (p.dashEndTime && now < p.dashEndTime) {
             // Let vx stay as is (set in handleDash/handlePhase)
        } else {
            p.dashEndTime = 0; // Reset
            if (keys.has(InputKeys.A) || keys.has(InputKeys.ARROW_LEFT)) {
                p.vx = -baseSpeed;
                p.facingRight = false;
            } else if (keys.has(InputKeys.D) || keys.has(InputKeys.ARROW_RIGHT)) {
                p.vx = baseSpeed;
                p.facingRight = true;
            } else {
                p.vx = 0;
            }
        }

        // --- Jumping ---
        // Coyote Time Logic
        if (p.isGrounded) {
            p.lastGroundedTime = now;
        }

        if (keys.has(InputKeys.W) || keys.has(InputKeys.ARROW_UP)) {
            if (jumpAllowed.current) {
                // Check grounding OR Coyote Time window
                const withinCoyoteTime = (now - p.lastGroundedTime) < COYOTE_TIME_MS;
                const canJump = p.isGrounded || (withinCoyoteTime && p.vy >= 0); // vy >= 0 ensures we don't coyote jump at peak of another jump

                if (canJump) {
                    p.vy = currentJumpForce;
                    
                    // Add momentum from moving platform if currently standing on one
                    const ridingPlatform = levelData.current.entities.find(e => 
                        e.type === EntityType.MOVING_PLATFORM && 
                        Math.abs((p.y + p.height) - e.y) < 6 && // Increased Tolerance to catch overlapping
                        p.x + p.width > e.x && p.x < e.x + e.width
                    );
                    if (ridingPlatform && ridingPlatform.vy) {
                        p.vy += ridingPlatform.vy;
                    }

                    p.isGrounded = false;
                    p.lastGroundedTime = 0; // Consumption of jump entitlement
                    p.jumpCount = 1;
                    jumpAllowed.current = false;
                    audioManager.playJump();
                } else if (p.canDoubleJump && p.jumpCount < 2) {
                    p.vy = currentJumpForce;
                    p.jumpCount++;
                    jumpAllowed.current = false;
                    audioManager.playJump();
                }
            }
        } else {
            jumpAllowed.current = true;
        }

        // --- Ducking ---
        const wantsToDuck = keys.has(InputKeys.S) || keys.has(InputKeys.ARROW_DOWN);
        
        if (wantsToDuck && !p.isDucking) {
            p.y += (PLAYER_HEIGHT - DUCK_HEIGHT);
            p.height = DUCK_HEIGHT;
            p.isDucking = true;
        } 
        else if (!wantsToDuck && p.isDucking) {
            const targetY = p.y - (PLAYER_HEIGHT - DUCK_HEIGHT);
            let canStand = true;
            for (const e of levelData.current.entities) {
                 if (e.type === EntityType.PLATFORM || e.type === EntityType.BUILT_BLOCK || e.type === EntityType.LAMP || e.type === EntityType.MOVING_PLATFORM) {
                     if (isRectIntersect(p.x, targetY, p.width, PLAYER_HEIGHT, e.x, e.y, e.width, e.height)) {
                         canStand = false;
                         break;
                     }
                 }
            }

            if (canStand) {
                p.y = targetY;
                p.height = PLAYER_HEIGHT;
                p.isDucking = false;
            }
        }

        // --- Gravity ---
        p.vy += effectiveGravity;
        if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

        // --- Integration & Collision ---
        p.x += p.vx;

        // Level Boundaries (Clamp)
        if (p.x < 0) {
            p.x = 0;
            p.vx = 0;
        } else if (p.x + p.width > levelData.current.width) {
            p.x = levelData.current.width - p.width;
            p.vx = 0;
        }
        
        // Handle Moving Platform Horizontal Carry
        const ridingPlatform = levelData.current.entities.find(e => 
            e.type === EntityType.MOVING_PLATFORM && 
            Math.abs((p.y + p.height) - e.y) < 6 && // Increased Tolerance
            p.x + p.width > e.x && p.x < e.x + e.width 
        );
        
        if (ridingPlatform && ridingPlatform.vx) {
            p.x += ridingPlatform.vx;
        }

        // Collision Resolution X 
        // Ignore riding platform for X collision to allow walking on top of it without snagging
        resolveEnvironmentCollisions(p, 'x', ridingPlatform); 

        p.y += p.vy;
        
        // Handle Moving Platform Vertical Carry
        if (ridingPlatform && ridingPlatform.vy) {
             p.y += ridingPlatform.vy;
        }

        const wasGrounded = p.isGrounded;
        p.isGrounded = false; 
        
        resolveEnvironmentCollisions(p, 'y');

        if (!wasGrounded && p.isGrounded) {
            audioManager.playLand();
            p.jumpCount = 0; // Reset jumps
        }

        if (p.isGrounded && Math.abs(p.vx) > 0) {
             const stepInterval = p.buildMode ? 400 : 250;
             if (now - lastStepTime.current > stepInterval) {
                 audioManager.playStep();
                 lastStepTime.current = now;
             }
        }

        checkHazardsAndTriggers(p);

        if (p.isDucking) p.state = 'ducking';
        else if (!p.isGrounded) p.state = 'jumping';
        else if (Math.abs(p.vx) > 0) p.state = 'running';
        else p.state = 'idle';

        if (p.y > canvasSizeRef.current.height + 200) {
            handleLifeLost();
        }

        // --- Entity Logic ---
        const entities = levelData.current.entities;
        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            
            // Falling Spikes Logic
            if (e.type === EntityType.FALLING_SPIKE) {
                if (e.static) continue; // Static spikes don't fall

                if (!e.triggered) {
                    const delayMs = 300;
                    const fallSpeed = 10;
                    
                    const distY = (p.y + p.height) - e.y;
                    
                    if (distY > 0 && distY < TILE_SIZE * 15) {
                        const updatesToFall = distY / fallSpeed;
                        const updatesToDelay = delayMs / MS_PER_UPDATE;
                        const totalUpdates = updatesToFall + updatesToDelay;
                        
                        const effectiveVx = p.vx + (ridingPlatform && ridingPlatform.vx ? ridingPlatform.vx : 0);
                        const predictedX = p.x + (effectiveVx * totalUpdates);
                        
                        const spikeCenter = e.x + e.width / 2;
                        const playerHalfWidth = p.width / 2;
                        
                        if (predictedX + playerHalfWidth > e.x && predictedX < e.x + e.width) {
                             e.triggered = true;
                             e.triggerTime = now;
                             audioManager.playTrapTrigger(); 
                        } else {
                            const currentDistX = Math.abs((p.x + p.width/2) - spikeCenter);
                            if (currentDistX < TILE_SIZE / 2) {
                                e.triggered = true;
                                e.triggerTime = now;
                                audioManager.playTrapTrigger();
                            }
                        }
                    }
                } else if (e.triggerTime && now > e.triggerTime + 300) {
                    e.falling = true;
                }
                
                if (e.falling) {
                    e.y += 10;
                    if (e.y > canvasSizeRef.current.height) {
                        entities.splice(i, 1);
                        continue;
                    }
                     if (isRectIntersect(p.x, p.y, p.width, p.height, e.x + 8, e.y + 8, e.width - 16, e.height - 12)) {
                        triggerDeathAnimation();
                     }
                     for (const other of entities) {
                         if (other.type === EntityType.PLATFORM) {
                             if (isRectIntersect(e.x, e.y, e.width, e.height, other.x, other.y, other.width, other.height)) {
                                 entities.splice(i, 1);
                                 break;
                             }
                         }
                     }
                }
                continue;
            }

            // Moving Platforms & Attached Entities
            if (e.type === EntityType.MOVING_PLATFORM) {
                const prevX = e.x;
                const prevY = e.y;
                
                if (e.vx) {
                    e.x += e.vx;
                    if ((e.vx > 0 && e.x >= (e.patrolMax || 0)) || (e.vx < 0 && e.x <= (e.patrolMin || 0))) {
                        e.vx *= -1;
                    }
                }
                if (e.vy) {
                    e.y += e.vy;
                    if ((e.vy > 0 && e.y >= (e.patrolMax || 0)) || (e.vy < 0 && e.y <= (e.patrolMin || 0))) {
                        e.vy *= -1;
                    }
                }
                
                // Move Attached Entities
                const dx = e.x - prevX;
                const dy = e.y - prevY;
                if (dx !== 0 || dy !== 0) {
                     for (const attached of entities) {
                         if (attached.attachedTo === e.id) {
                             attached.x += dx;
                             attached.y += dy;
                         }
                     }
                }

                // CRUSH BLOCKS
                for (let j = entities.length - 1; j >= 0; j--) {
                    const other = entities[j];
                    if (other.type === EntityType.BUILT_BLOCK) {
                         if (isRectIntersect(e.x, e.y, e.width, e.height, other.x, other.y, other.width, other.height)) {
                             audioManager.playDeconstruct();
                             entities.splice(j, 1);
                             if (i > j) i--; 
                         }
                    }
                }
                continue;
            }
            
            // Fruit Fly AI
            if (e.type === EntityType.FRUIT_FLY) {
                 if (e.properties && e.vx) {
                     e.x += e.vx;
                     // Bounds check
                     if (e.x < e.properties.startX || e.x > e.properties.endX) {
                         e.vx *= -1; 
                         e.x += e.vx; 
                     }
                     
                     // Check collision with built blocks (bounce)
                     for (const block of entities) {
                         if (block.type === EntityType.BUILT_BLOCK) {
                             if (isRectIntersect(e.x, e.y, e.width, e.height, block.x, block.y, block.width, block.height)) {
                                 e.vx *= -1;
                                 e.x += e.vx; 
                                 break;
                             }
                         }
                     }

                     // Sine wave movement
                     const flyTime = now / 200;
                     const yOffset = Math.sin(flyTime) * 1.5;
                     e.y = (e.properties.originalY || e.y) + yOffset;
                 }
                 continue;
            }
            
            // Projectiles
            if (e.type === EntityType.PROJECTILE) {
                e.x += (e.vx || 0);
                for (let j = entities.length - 1; j >= 0; j--) {
                    const target = entities[j];
                    if (target.type === EntityType.ENEMY_SPIDER || target.type === EntityType.FRUIT_FLY) {
                         if (isRectIntersect(e.x, e.y, e.width, e.height, target.x, target.y, target.width, target.height)) {
                             entities.splice(j, 1);
                             if (i > j) i--; 
                             entities.splice(i, 1);
                             break;
                         }
                    }
                }
                if (e.x < 0 || e.x > levelData.current.width) {
                    entities.splice(i, 1);
                }
                continue;
            }

            // Falling Blocks Logic
            if (e.type === EntityType.BUILT_BLOCK) {
                if (e.expiresAt && now > e.expiresAt) {
                    entities.splice(i, 1);
                    continue;
                }
                if (e.falling) {
                    e.vy = (e.vy || 0) + GRAVITY;
                    e.y += e.vy;
                    let landed = false;
                    for (const other of entities) {
                        if (e === other) continue;
                        if (other.type === EntityType.PLATFORM || other.type === EntityType.BUILT_BLOCK || other.type === EntityType.MOVING_PLATFORM) {
                             if (isRectIntersect(e.x, e.y, e.width, e.height, other.x, other.y, other.width, other.height)) {
                                 e.y = other.y - e.height;
                                 e.vy = 0;
                                 landed = true;
                             }
                        }
                    }
                    if (e.y > canvasSizeRef.current.height + 100) entities.splice(i, 1); 
                }
            }

            // Spider AI
            if (e.type === EntityType.ENEMY_SPIDER) {
                 if (e.properties && e.vx) {
                     e.x += e.vx;
                     if (e.x < e.properties.startX || e.x > e.properties.endX) {
                         e.vx *= -1; 
                         e.x += e.vx; 
                     }
                     for (const block of entities) {
                         if (block.type === EntityType.BUILT_BLOCK) {
                             if (isRectIntersect(e.x, e.y, e.width, e.height, block.x, block.y, block.width, block.height)) {
                                 e.vx *= -1;
                                 e.x += e.vx; 
                                 break;
                             }
                         }
                     }
                 }
            }
        }
    };

    const resolveEnvironmentCollisions = (p: PlayerState, axis: 'x' | 'y', ignoreEntity?: Entity) => {
        const now = Date.now();
        const isPhasing = p.phaseActiveUntil > now;
        const isDashing = !!(p.dashEndTime && p.dashEndTime > now);
        const canPassThroughWalls = isPhasing || isDashing;
        
        const entities = levelData.current.entities;
        for (const e of entities) {
            if (e === ignoreEntity) continue; 
            // Also ignore entities attached to the ignored platform
            if (ignoreEntity && e.attachedTo === ignoreEntity.id) continue;

            if (e.type === EntityType.PLATFORM || e.type === EntityType.BUILT_BLOCK || e.type === EntityType.LAMP || e.type === EntityType.MOVING_PLATFORM) {
                if (isRectIntersect(p.x, p.y, p.width, p.height, e.x, e.y, e.width, e.height)) {
                    if (axis === 'x') {
                        if (canPassThroughWalls) continue; 
                        if (p.vx > 0) p.x = e.x - p.width;
                        else if (p.vx < 0) p.x = e.x + e.width;
                    } else {
                        if (p.vy > 0) { 
                            p.y = e.y - p.height;
                            p.isGrounded = true;
                            p.vy = 0;
                        } else if (p.vy < 0) { 
                            p.y = e.y + e.height;
                            p.vy = 0;
                        }
                    }
                }
            }
        }
    };

    const checkHazardsAndTriggers = (p: PlayerState) => {
        if (p.state === 'dead') return; 

        const entities = levelData.current.entities;
        for (const e of entities) {
            if (e.type === EntityType.CHECKPOINT) {
                if (isOverlapping(p, e)) {
                     const idx = e.properties.index;
                     if (idx > p.lastCheckpointIndex) {
                         p.lastCheckpointIndex = idx;
                         audioManager.playBuild(); 
                         e.visible = true;
                         if (idx === 6) handleLevelComplete();
                     }
                }
            }
            else if (e.type === EntityType.SPIKE || e.type === EntityType.FALLING_SPIKE || e.type === EntityType.ENEMY_SPIDER || e.type === EntityType.FRUIT_FLY) {
                // Adjust hitbox for hazards
                let hazardHitbox = { x: e.x + 8, y: e.y + 8, width: e.width - 16, height: e.height - 12 };
                // Fruit fly is smaller, customize hitbox
                if (e.type === EntityType.FRUIT_FLY) {
                    hazardHitbox = { x: e.x + 2, y: e.y + 2, width: e.width - 4, height: e.height - 4 };
                }

                if (isRectIntersect(p.x, p.y, p.width, p.height, hazardHitbox.x, hazardHitbox.y, hazardHitbox.width, hazardHitbox.height)) {
                    triggerDeathAnimation();
                    return; 
                }
            }
        }
    };
    
    // ... [Rest of helper functions remain unchanged]
    const isOverlapping = (a: Entity, b: Entity) => {
        return a.x < b.x + b.width && a.x + a.width > b.x &&
               a.y < b.y + b.height && a.y + a.height > b.y;
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

        // If admin mode, don't decrement lives
        if (!isAdminMode) {
            player.current.lives -= 1;
            setLives(player.current.lives);
        }

        // If admin mode, prevent Game Over from lives
        if (player.current.lives <= 0 && !isAdminMode) {
             onGameOver(player.current.currentLevel);
        } else {
             // If timer ran out but we are admin, reset timer to max to allow continuing
             let nextTimer = timerRef.current;
             if (isAdminMode && levelData.current.timeLimit && timerRef.current <= 0) {
                 nextTimer = levelData.current.timeLimit * 1000;
             }
             
             resetLevel(player.current.currentLevel, player.current.lastCheckpointIndex, false, nextTimer);
        }
    };

    const handleLevelComplete = () => {
        onWin();
    };

    const updateCamera = () => {
        const { width, height } = canvasSizeRef.current;
        const isPortrait = height > width;
        let offsetY;
        if (isTouchDeviceRef.current) {
            if (isPortrait) {
                offsetY = height / 1.6; 
            } else {
                offsetY = height / 2.2;
            }
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
                updatePhysics();
                
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
            {/* View Mode UI ... */}
            {viewMode && !isTouchDevice && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-900/90 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2 border border-indigo-500 z-20">
                    <Map size={18} />
                    VIEW MODE ACTIVE - [A/D] TO MOVE - [ESC/SPACE] TO EXIT
                </div>
            )}
            {/* ... Mobile Controls ... */}
            {viewMode && isTouchDevice && (
                <div className="absolute inset-0 pointer-events-none z-30">
                     {/* View Mode Touch Controls */}
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
            
            {/* Skip Intro UI */}
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
            
            {/* Main Mobile Controls Overlay */}
            {!viewMode && !isPaused && isTouchDevice && !isIntroActive && (
                <div className="absolute inset-0 pointer-events-none z-30">
                    <div className="absolute bottom-4 left-4 flex gap-1 pointer-events-auto landscape:bottom-4 landscape:left-4">
                        <button 
                            className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                            onTouchStart={() => handleTouchStart(InputKeys.A)}
                            onTouchEnd={() => handleTouchEnd(InputKeys.A)}
                        >
                            <ArrowLeft size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                        </button>
                        <div className="flex flex-col gap-1 sm:gap-2">
                             <div className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12"></div> {/* Spacer */}
                             <button 
                                className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                                onTouchStart={() => handleTouchStart(InputKeys.S)}
                                onTouchEnd={() => handleTouchEnd(InputKeys.S)}
                            >
                                <ArrowDown size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                            </button>
                        </div>
                        <button 
                            className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-white/20 backdrop-blur-sm rounded-full border-2 border-white/40 flex items-center justify-center active:bg-white/40 touch-none"
                            onTouchStart={() => handleTouchStart(InputKeys.D)}
                            onTouchEnd={() => handleTouchEnd(InputKeys.D)}
                        >
                            <ArrowRight size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                        </button>
                    </div>

                    <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto items-end landscape:bottom-4 landscape:right-4">
                         {/* Toggle Build Mode */}
                         <button 
                            className={`w-10 h-10 sm:w-14 sm:h-14 landscape:w-10 landscape:h-10 landscape:sm:w-12 landscape:sm:h-12 rounded-full border-2 flex items-center justify-center active:scale-95 transition-colors touch-none ${isBuildMode ? 'bg-orange-500 border-yellow-300' : 'bg-gray-700/50 border-white/30'}`}
                            onTouchStart={() => handleTouchStart(InputKeys.F)}
                            onTouchEnd={() => handleTouchEnd(InputKeys.F)}
                        >
                            <Hammer size={18} className="text-white sm:w-6 sm:h-6 landscape:w-5 landscape:h-5" />
                        </button>
                        
                        <div className="flex flex-col gap-2 sm:gap-4">
                            <button 
                                className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-12 landscape:h-12 landscape:sm:w-12 landscape:sm:h-12 bg-blue-500/30 backdrop-blur-sm rounded-full border-2 border-blue-300/50 flex items-center justify-center active:bg-blue-500/50 touch-none"
                                onTouchStart={() => handleTouchStart(InputKeys.W)}
                                onTouchEnd={() => handleTouchEnd(InputKeys.W)}
                            >
                                <ArrowUp size={20} className="text-white sm:w-8 sm:h-8 landscape:w-6 landscape:h-6" />
                            </button>
                            <button 
                                className={`w-16 h-16 sm:w-20 sm:h-20 landscape:w-14 landscape:h-14 landscape:sm:w-16 landscape:sm:h-16 rounded-full border-2 border-white/40 flex items-center justify-center active:scale-95 shadow-lg touch-none ${isBuildMode ? 'bg-yellow-500/40' : 'bg-red-500/40'}`}
                                onTouchStart={() => handleTouchStart(InputKeys.SPACE)}
                                onTouchEnd={() => handleTouchEnd(InputKeys.SPACE)}
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
            )}
            
            {/* HUD */}
            {!viewMode && !isIntroActive && (
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
                         
                         {timerRef.current > 0 && (
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
                            onClick={() => setIsPaused(!isPaused)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded flex items-center transition-colors h-10 shadow-lg"
                        >
                            {isPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Pause Menu */}
            {isPaused && !viewMode && (
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
                                        onClick={handleMuteToggle}
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
                                        onChange={handleVolumeChange}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 flex-1"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4 landscape:flex-row landscape:gap-2">
                                <button 
                                    onClick={() => setIsPaused(false)}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg landscape:py-2 landscape:text-sm"
                                >
                                    <Play size={20} /> RESUME
                                </button>
                                
                                <button 
                                    onClick={toggleViewMode}
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
            )}
            
            <div className="absolute bottom-4 left-4 text-gray-500 text-xs pointer-events-none font-bold hidden lg:block">
                Controls: WASD / ARROWS to Move
            </div>
        </div>
    );
};

export default GameCanvas;
