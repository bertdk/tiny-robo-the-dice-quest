
import React, { useEffect, useRef, useState } from 'react';
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, 
    InputKeys, PLAYER_WIDTH, PLAYER_HEIGHT, DUCK_HEIGHT, MAX_FALL_SPEED, COLORS,
    MS_PER_UPDATE, LASER_SPEED, PHASE_DURATION, SPEED_BOOST_MULTIPLIER, GRAVITY_BOOTS_MULTIPLIER,
    DICE_BLOCK_OPTIONS, BLOCK_COLORS, DICE_POWERUP_OPTIONS
} from '../constants';
import { 
    Entity, EntityType, PlayerState, LevelData, Camera, BuildState, FlyingFace,
    BlockType, PowerUpType
} from '../types';
import { createLevel } from '../utils/levelGenerator';
import { drawRect, drawRobot, drawSpike, drawSpider, drawCheckpoint, drawLamp, drawIntroDice, drawFlyingFace, drawProjectile, drawBuiltBlock } from '../utils/renderer';
import { audioManager } from '../utils/audioManager';
import { Heart, Pause, Play, Eye, Map, Volume2, Home } from 'lucide-react';

interface GameCanvasProps {
    startLevel: number;
    activeBlockType: BlockType;
    activePowerUp: PowerUpType | null;
    onGameOver: (level: number) => void;
    onWin: () => void;
    onHome: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ startLevel, activeBlockType, activePowerUp, onGameOver, onWin, onHome }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const previousTimeRef = useRef<number>(0);
    const lagRef = useRef<number>(0);
    const deathTimeoutRef = useRef<number | null>(null);
    
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
        isDucking: false,
        facingRight: true,
        buildMode: false,
        animFrame: 0,
        state: 'idle',
        lives: activePowerUp === PowerUpType.EXTRA_LIFE ? 4 : 3,
        currentLevel: startLevel,
        lastCheckpointIndex: 0,
        
        jumpCount: 0,
        canDoubleJump: activePowerUp === PowerUpType.DOUBLE_JUMP,
        hasPhased: false,
        phaseActiveUntil: 0,
        dashEndTime: 0
    });
    
    const camera = useRef<Camera>({ x: 0, y: 0 });
    const viewCamera = useRef<Camera>({ x: 0, y: 0 }); // Camera for View Mode
    
    // Intro State
    const introState = useRef({ active: true, x: 0, rotation: 0, nextCheckpointIndex: 1 });
    const flyingFaces = useRef<FlyingFace[]>([]);

    const lastBuildTime = useRef<number>(0);
    const lastStepTime = useRef<number>(0);
    const hasInitializedAudio = useRef<boolean>(false);

    const [currentLevel, setCurrentLevel] = useState(startLevel);
    const [lives, setLives] = useState(player.current.lives);
    const [isPaused, setIsPaused] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [volume, setVolume] = useState(audioManager.getVolume());
    const [isBuildMode, setIsBuildMode] = useState(false); // UI State
    const [isIntroActive, setIsIntroActive] = useState(true); // State to trigger re-renders for UI

    // Refs for state access in event listeners
    const isPausedRef = useRef(isPaused);
    const viewModeRef = useRef(viewMode);

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
        // Initialize level on mount ONLY
        resetLevel(startLevel, 0, true);
        
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
            keysPressed.current.add(k === ' ' ? InputKeys.SPACE : k);
            
            if (viewModeRef.current) {
                if (k === InputKeys.ESCAPE || k === InputKeys.SPACE) {
                    setViewMode(false); 
                    setIsPaused(true); 
                }
                return;
            }
            
            if (introState.current.active) {
                if (k === InputKeys.SPACE) {
                    skipIntro();
                }
                return;
            }

            if (k === InputKeys.ESCAPE) {
                setIsPaused(prev => !prev);
            }

            if (isPausedRef.current || player.current.state === 'dead') return; 

            if (k === InputKeys.F) {
                player.current.buildMode = !player.current.buildMode;
                setIsBuildMode(player.current.buildMode); 
            }
            
            // Consolidated Space Action
            if (e.key === InputKeys.SPACE) {
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
            keysPressed.current.delete(k === ' ' ? InputKeys.SPACE : k);
            
            if (e.key === InputKeys.SPACE) canActionRef.current = true;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('click', handleInteraction);

        requestRef.current = requestAnimationFrame(gameLoop);

        return () => {
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

        const targetX = player.current.x - CANVAS_WIDTH / 2;
        camera.current.x = Math.max(0, Math.min(targetX, levelData.current.width - CANVAS_WIDTH));
    };

    const resetLevel = (lvlIndex: number, checkpointIndex: number, showIntro: boolean) => {
        levelData.current = createLevel(lvlIndex);
        
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
        player.current.height = PLAYER_HEIGHT;
        player.current.currentLevel = lvlIndex;
        player.current.lastCheckpointIndex = checkpointIndex;
        player.current.state = 'idle';
        player.current.buildMode = false;
        player.current.jumpCount = 0;
        player.current.phaseActiveUntil = 0;
        player.current.dashEndTime = 0;
        
        // Reset lives to full + bonus if applicable
        if (checkpointIndex === 0) {
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
            camera.current.x = Math.max(0, Math.min(spawn.x - CANVAS_WIDTH / 2, levelData.current.width - CANVAS_WIDTH));
        }
        
        setIsBuildMode(false);
        setCurrentLevel(lvlIndex);
    };

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
                
                if (e.type === EntityType.PLATFORM || e.type === EntityType.LAMP) {
                    return; 
                }
                
                if (e.type === EntityType.ENEMY_SPIDER) {
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
        if (keys.has(InputKeys.A) || keys.has(InputKeys.ARROW_LEFT)) viewCamera.current.x -= speed;
        if (keys.has(InputKeys.D) || keys.has(InputKeys.ARROW_RIGHT)) viewCamera.current.x += speed;

        viewCamera.current.x = Math.max(0, Math.min(viewCamera.current.x, levelData.current.width - CANVAS_WIDTH));
    };

    const updateIntroLogic = () => {
        const speed = 15;
        const groundY = 14 * TILE_SIZE; 
        const diceSize = TILE_SIZE * 2;
        
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

        camera.current.x = introState.current.x - CANVAS_WIDTH / 2;
        camera.current.x = Math.max(0, Math.min(camera.current.x, levelData.current.width - CANVAS_WIDTH));

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
        const effectiveGravity = activePowerUp === PowerUpType.GRAVITY_BOOTS ? GRAVITY * GRAVITY_BOOTS_MULTIPLIER : GRAVITY;

        // --- Movement ---
        // If dashing, ignore manual input
        if (p.dashEndTime && now < p.dashEndTime) {
             // Let vx stay as is (set in handleDash/handlePhase)
        } else {
            p.dashEndTime = 0; // Reset
            if (keys.has(InputKeys.A)) {
                p.vx = -baseSpeed;
                p.facingRight = false;
            } else if (keys.has(InputKeys.D)) {
                p.vx = baseSpeed;
                p.facingRight = true;
            } else {
                p.vx = 0;
            }
        }

        // --- Jumping ---
        if (keys.has(InputKeys.W)) {
            if (jumpAllowed.current) {
                if (p.isGrounded) {
                    p.vy = currentJumpForce;
                    p.isGrounded = false;
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
        const wantsToDuck = keys.has(InputKeys.S);
        
        if (wantsToDuck && !p.isDucking) {
            p.y += (PLAYER_HEIGHT - DUCK_HEIGHT);
            p.height = DUCK_HEIGHT;
            p.isDucking = true;
        } 
        else if (!wantsToDuck && p.isDucking) {
            const targetY = p.y - (PLAYER_HEIGHT - DUCK_HEIGHT);
            let canStand = true;
            for (const e of levelData.current.entities) {
                 if (e.type === EntityType.PLATFORM || e.type === EntityType.BUILT_BLOCK || e.type === EntityType.LAMP) {
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
        resolveEnvironmentCollisions(p, 'x');

        p.y += p.vy;
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

        if (p.y > CANVAS_HEIGHT + 200) {
            handleLifeLost();
        }

        // --- Entity Logic (Blocks & Spiders & Projectiles) ---
        const entities = levelData.current.entities;
        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            
            // Projectiles
            if (e.type === EntityType.PROJECTILE) {
                e.x += (e.vx || 0);
                // Check enemy collision
                for (let j = entities.length - 1; j >= 0; j--) {
                    const target = entities[j];
                    if (target.type === EntityType.ENEMY_SPIDER) {
                         if (isRectIntersect(e.x, e.y, e.width, e.height, target.x, target.y, target.width, target.height)) {
                             // Kill both
                             entities.splice(j, 1);
                             if (i > j) i--; // Adjust current index
                             entities.splice(i, 1);
                             // Play hit sound?
                             break;
                         }
                    }
                }
                // Cleanup out of bounds
                if (e.x < 0 || e.x > levelData.current.width) {
                    entities.splice(i, 1);
                }
                continue;
            }

            // Falling Blocks
            if (e.type === EntityType.BUILT_BLOCK) {
                // Expiration
                if (e.expiresAt && now > e.expiresAt) {
                    entities.splice(i, 1);
                    continue;
                }
                
                // Physics
                if (e.falling) {
                    e.vy = (e.vy || 0) + GRAVITY;
                    e.y += e.vy;
                    
                    // Simple collision with platforms/floor
                    let landed = false;
                    for (const other of entities) {
                        if (e === other) continue;
                        if (other.type === EntityType.PLATFORM || other.type === EntityType.BUILT_BLOCK) {
                             if (isRectIntersect(e.x, e.y, e.width, e.height, other.x, other.y, other.width, other.height)) {
                                 // Landed
                                 e.y = other.y - e.height;
                                 e.vy = 0;
                                 landed = true;
                             }
                        }
                    }
                    if (e.y > CANVAS_HEIGHT + 100) entities.splice(i, 1); // remove if fell out
                }
            }

            // Enemy AI
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

    const resolveEnvironmentCollisions = (p: PlayerState, axis: 'x' | 'y') => {
        const now = Date.now();
        const isPhasing = p.phaseActiveUntil > now;
        const isDashing = !!(p.dashEndTime && p.dashEndTime > now);
        const canPassThroughWalls = isPhasing || isDashing;
        
        const entities = levelData.current.entities;
        for (const e of entities) {
            if (e.type === EntityType.PLATFORM || e.type === EntityType.BUILT_BLOCK || e.type === EntityType.LAMP) {
                if (isRectIntersect(p.x, p.y, p.width, p.height, e.x, e.y, e.width, e.height)) {
                    if (axis === 'x') {
                        // Allow passing through if phasing/dashing
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
            else if (e.type === EntityType.SPIKE || e.type === EntityType.ENEMY_SPIDER) {
                const hazardHitbox = { 
                    x: e.x + 8, y: e.y + 8, width: e.width - 16, height: e.height - 12 
                };
                if (isRectIntersect(p.x, p.y, p.width, p.height, hazardHitbox.x, hazardHitbox.y, hazardHitbox.width, hazardHitbox.height)) {
                    triggerDeathAnimation();
                    return; 
                }
            }
        }
    };

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
        deathTimeoutRef.current = setTimeout(() => handleLifeLost(), 500) as unknown as number; 
    };

    const handleLifeLost = () => {
        player.current.lives -= 1;
        setLives(player.current.lives);
        if (player.current.lives <= 0) {
             onGameOver(player.current.currentLevel);
        } else {
             resetLevel(player.current.currentLevel, player.current.lastCheckpointIndex, false);
        }
    };

    const handleLevelComplete = () => {
        onWin();
    };

    const updateCamera = () => {
        let targetX = player.current.x - CANVAS_WIDTH / 2;
        targetX = Math.max(0, Math.min(targetX, levelData.current.width - CANVAS_WIDTH));
        let targetY = player.current.y - CANVAS_HEIGHT / 1.5;
        targetY = Math.max(0, Math.min(targetY, levelData.current.height - CANVAS_HEIGHT)); 
        camera.current.x += (targetX - camera.current.x) * 0.1;
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
            }
            lagRef.current -= MS_PER_UPDATE;
        }

        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const activeCam = introState.current.active 
                ? camera.current 
                : viewModeRef.current ? viewCamera.current : camera.current;
                    
            if (!viewModeRef.current && !introState.current.active) updateCamera();

            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            const entities = levelData.current.entities;
            const visibleEntities = entities.filter(e => 
                e.x + e.width > activeCam.x && e.x < activeCam.x + CANVAS_WIDTH
            );

            visibleEntities.forEach(e => {
                if (e.type === EntityType.PLATFORM) {
                     drawRect(ctx, activeCam, e.x, e.y, e.width, e.height, e.color || '#000');
                } else if (e.type === EntityType.BUILT_BLOCK) {
                     drawBuiltBlock(ctx, activeCam, e); // Distinct visuals
                } else if (e.type === EntityType.SPIKE) {
                    drawSpike(ctx, activeCam, e);
                } else if (e.type === EntityType.ENEMY_SPIDER) {
                    drawSpider(ctx, activeCam, e);
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
                
                // Determine dimensions for preview based on active type
                let typeToBuild = activeBlockType;
                if (typeToBuild === BlockType.RANDOM) {
                    // Just pick Random for preview visual, doesn't matter much as logic is randomized on build
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

                // Recalculate positions based on dimension
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
                else if (intersectingType === EntityType.ENEMY_SPIDER) buildState = 'valid';
                else if (intersectingType === EntityType.PLATFORM || intersectingType === EntityType.LAMP || playerOverlap) buildState = 'invalid';
                else buildState = 'valid';
                
                // Draw Preview using Renderer
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
        <div className="relative border-4 border-gray-800 rounded-lg shadow-2xl overflow-hidden bg-gray-900">
            <canvas 
                ref={canvasRef}
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT}
                className="block bg-gray-100"
            />
            
            {viewMode && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-900/90 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-pulse flex items-center gap-2 border border-indigo-500">
                    <Map size={18} />
                    VIEW MODE ACTIVE - [A/D] TO MOVE - [ESC/SPACE] TO EXIT
                </div>
            )}
            
            {isIntroActive && (
                <div className="absolute bottom-8 right-8 text-white font-bold text-lg animate-pulse select-none pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    PRESS [SPACE] TO SKIP
                </div>
            )}
            
            {!viewMode && !isIntroActive && (
                <div className="absolute top-4 left-0 right-0 px-4 grid grid-cols-3 items-start pointer-events-none">
                    {/* Left: Level & Lives */}
                    <div className="flex gap-4 items-center justify-start">
                        <div className="bg-black/50 px-3 py-1 rounded flex items-center gap-2 text-white font-bold text-lg">
                            <span>Level: {currentLevel}</span>
                        </div>
                        <div className="bg-black/50 px-3 py-1 rounded flex items-center gap-1 text-red-500">
                            {[...Array(5)].map((_, i) => (
                                i < lives && (
                                <Heart 
                                    key={i} 
                                    size={20} 
                                    fill="currentColor" 
                                    strokeWidth={2.5}
                                />
                                )
                            ))}
                        </div>
                    </div>
                    
                    {/* Center: Active Loadout Icons */}
                    <div className="flex items-center justify-center pointer-events-auto">
                         <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded border border-gray-700 shadow-lg">
                            {BlockIcon && <BlockIcon size={20} className="text-yellow-400" />}
                            <div className="w-px h-4 bg-gray-600"></div>
                            {PowerUpIcon && <PowerUpIcon size={20} className="text-blue-400" />}
                         </div>
                    </div>

                    {/* Right: Build Mode & Pause */}
                    <div className="flex gap-4 justify-end pointer-events-auto items-start">
                        <div className="flex flex-col items-end relative">
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

            {isPaused && !viewMode && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                    <div className="bg-gray-800 p-8 rounded-xl border-2 border-gray-600 text-center shadow-2xl max-w-md w-full">
                        <h2 className="text-3xl font-bold text-white mb-6">
                            PAUSED
                        </h2>
                        
                        {/* Current Loadout Display */}
                        <div className="bg-gray-900 p-4 rounded-lg mb-4 border border-gray-700">
                            <h3 className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-wider">Current Loadout</h3>
                            <div className="flex justify-center gap-8">
                                <div className="flex flex-col items-center">
                                     <div className="w-12 h-12 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center mb-2 shadow-inner">
                                         {BlockIcon && <BlockIcon size={24} className="text-yellow-400" />}
                                     </div>
                                     <span className="text-[10px] text-gray-300 font-bold tracking-tight">{blockOption?.label}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                     <div className="w-12 h-12 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center mb-2 shadow-inner">
                                         {PowerUpIcon && <PowerUpIcon size={24} className="text-blue-400" />}
                                     </div>
                                     <span className="text-[10px] text-gray-300 font-bold tracking-tight">{powerUpOption?.label}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <label className="text-gray-300 flex items-center gap-2 mb-2 text-sm font-bold">
                                    <Volume2 size={16} /> SOUND VOLUME
                                </label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.1" 
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            <button 
                                onClick={() => setIsPaused(false)}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg"
                            >
                                <Play size={20} /> RESUME GAME
                            </button>
                            
                            <button 
                                onClick={toggleViewMode}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg"
                            >
                                <Eye size={20} /> VIEW LEVEL
                            </button>

                             <button 
                                onClick={onHome}
                                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow-lg"
                            >
                                <Home size={20} /> MAIN MENU
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-4 left-4 text-gray-500 text-xs pointer-events-none font-bold">
                WASD: Move/Jump/Duck | F: Build Mode | Space: Build (Mode On) / Action (Mode Off)
            </div>
        </div>
    );
};

export default GameCanvas;
