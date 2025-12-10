
import { 
    GRAVITY, FALL_GRAVITY_MULTIPLIER, JUMP_FORCE, COYOTE_TIME_MS, MOVE_SPEED, 
    MAX_FALL_SPEED, MS_PER_UPDATE, TILE_SIZE, PLAYER_HEIGHT, DUCK_HEIGHT, InputKeys,
    SPEED_BOOST_MULTIPLIER, GRAVITY_BOOTS_MULTIPLIER
} from '../constants';
import { Entity, EntityType, PlayerState, LevelData, PowerUpType } from '../types';
import { AudioManager } from './audioManager';

// --- Helper Functions ---

export const isRectIntersect = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
};

export const isOverlapping = (a: Entity, b: Entity) => {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
};

// --- Physics Logic ---

export const resolveEnvironmentCollisions = (p: PlayerState, entities: Entity[], axis: 'x' | 'y', ignoreEntity?: Entity) => {
    const now = Date.now();
    const isPhasing = p.phaseActiveUntil > now;
    const isDashing = !!(p.dashEndTime && p.dashEndTime > now);
    const canPassThroughWalls = isPhasing || isDashing;
    
    for (const e of entities) {
        if (e === ignoreEntity) continue; 
        if (ignoreEntity && e.attachedTo === ignoreEntity.id) continue;

        if (e.type === EntityType.PLATFORM || e.type === EntityType.BUILT_BLOCK || e.type === EntityType.LAMP || e.type === EntityType.MOVING_PLATFORM) {
            if (isRectIntersect(p.x, p.y, p.width, p.height, e.x, e.y, e.width, e.height)) {
                if (axis === 'x') {
                    if (canPassThroughWalls) continue; 
                    if (p.vx && p.vx > 0) p.x = e.x - p.width;
                    else if (p.vx && p.vx < 0) p.x = e.x + e.width;
                } else {
                    if (p.vy && p.vy > 0) { 
                        p.y = e.y - p.height;
                        p.isGrounded = true;
                        p.vy = 0;
                    } else if (p.vy && p.vy < 0) { 
                        p.y = e.y + e.height;
                        p.vy = 0;
                    }
                }
            }
        }
    }
};

export const checkHazardsAndTriggers = (
    p: PlayerState, 
    levelData: LevelData, 
    audioManager: AudioManager,
    callbacks: {
        onLevelComplete: () => void,
        onDeath: () => void
    }
) => {
    if (p.state === 'dead') return; 

    const entities = levelData.entities;
    for (const e of entities) {
        if (e.type === EntityType.CHECKPOINT) {
            if (isOverlapping(p, e)) {
                 const idx = e.properties.index;
                 if (idx > p.lastCheckpointIndex) {
                     p.lastCheckpointIndex = idx;
                     audioManager.playBuild(); 
                     e.visible = true;
                     if (idx === 6) callbacks.onLevelComplete();
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
                callbacks.onDeath();
                return; 
            }
        }
    }
};

export const updatePlayerPhysics = (
    p: PlayerState, 
    levelData: LevelData, 
    keysPressed: Set<string>, 
    jumpAllowedRef: { current: boolean },
    activePowerUp: PowerUpType | null,
    audioManager: AudioManager
) => {
    const now = Date.now();
    
    let baseSpeed = p.buildMode ? MOVE_SPEED * 0.5 : MOVE_SPEED;
    if (activePowerUp === PowerUpType.PHASE) baseSpeed *= SPEED_BOOST_MULTIPLIER;
    
    const currentJumpForce = p.buildMode ? JUMP_FORCE * 0.85 : JUMP_FORCE;
    let effectiveGravity = activePowerUp === PowerUpType.GRAVITY_BOOTS ? GRAVITY * GRAVITY_BOOTS_MULTIPLIER : GRAVITY;
    if ((p.vy || 0) > 0) {
        effectiveGravity *= FALL_GRAVITY_MULTIPLIER; 
    }

    // --- Movement ---
    // If dashing, ignore manual input
    if (p.dashEndTime && now < p.dashEndTime) {
         // Keep existing velocity
    } else {
        p.dashEndTime = 0; 
        if (keysPressed.has(InputKeys.A) || keysPressed.has(InputKeys.ARROW_LEFT)) {
            p.vx = -baseSpeed;
            p.facingRight = false;
        } else if (keysPressed.has(InputKeys.D) || keysPressed.has(InputKeys.ARROW_RIGHT)) {
            p.vx = baseSpeed;
            p.facingRight = true;
        } else {
            p.vx = 0;
        }
    }

    // --- Jumping ---
    if (p.isGrounded) {
        p.lastGroundedTime = now;
    }

    if (keysPressed.has(InputKeys.W) || keysPressed.has(InputKeys.ARROW_UP)) {
        if (jumpAllowedRef.current) {
            const withinCoyoteTime = (now - p.lastGroundedTime) < COYOTE_TIME_MS;
            const canJump = p.isGrounded || (withinCoyoteTime && (p.vy || 0) >= 0);

            if (canJump) {
                p.vy = currentJumpForce;
                
                // Add momentum from moving platform
                const ridingPlatform = levelData.entities.find(e => 
                    e.type === EntityType.MOVING_PLATFORM && 
                    Math.abs((p.y + p.height) - e.y) < 6 && 
                    p.x + p.width > e.x && p.x < e.x + e.width
                );
                if (ridingPlatform && ridingPlatform.vy) {
                    p.vy = (p.vy || 0) + ridingPlatform.vy;
                }

                p.isGrounded = false;
                p.lastGroundedTime = 0;
                p.jumpCount = 1;
                jumpAllowedRef.current = false;
                audioManager.playJump();
            } else if (p.canDoubleJump && p.jumpCount < 2) {
                p.vy = currentJumpForce;
                p.jumpCount++;
                jumpAllowedRef.current = false;
                audioManager.playJump();
            }
        }
    } else {
        jumpAllowedRef.current = true;
    }

    // --- Ducking ---
    const wantsToDuck = keysPressed.has(InputKeys.S) || keysPressed.has(InputKeys.ARROW_DOWN);
    
    if (wantsToDuck && !p.isDucking) {
        p.y += (PLAYER_HEIGHT - DUCK_HEIGHT);
        p.height = DUCK_HEIGHT;
        p.isDucking = true;
    } 
    else if (!wantsToDuck && p.isDucking) {
        const targetY = p.y - (PLAYER_HEIGHT - DUCK_HEIGHT);
        let canStand = true;
        for (const e of levelData.entities) {
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
    p.vy = (p.vy || 0) + effectiveGravity;
    if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

    // --- Integration & Collision ---
    p.x += (p.vx || 0);

    // Level Boundaries (Clamp)
    if (p.x < 0) {
        p.x = 0;
        p.vx = 0;
    } else if (p.x + p.width > levelData.width) {
        p.x = levelData.width - p.width;
        p.vx = 0;
    }
    
    // Handle Moving Platform Horizontal Carry
    const ridingPlatform = levelData.entities.find(e => 
        e.type === EntityType.MOVING_PLATFORM && 
        Math.abs((p.y + p.height) - e.y) < 6 && 
        p.x + p.width > e.x && p.x < e.x + e.width 
    );
    
    if (ridingPlatform && ridingPlatform.vx) {
        p.x += ridingPlatform.vx;
    }

    resolveEnvironmentCollisions(p, levelData.entities, 'x', ridingPlatform); 

    p.y += (p.vy || 0);
    
    if (ridingPlatform && ridingPlatform.vy) {
         p.y += ridingPlatform.vy;
    }

    const wasGrounded = p.isGrounded;
    p.isGrounded = false; 
    
    resolveEnvironmentCollisions(p, levelData.entities, 'y');

    if (!wasGrounded && p.isGrounded) {
        audioManager.playLand();
        p.jumpCount = 0; 
    }
    
    if (p.isDucking) p.state = 'ducking';
    else if (!p.isGrounded) p.state = 'jumping';
    else if (Math.abs(p.vx || 0) > 0) p.state = 'running';
    else p.state = 'idle';

    return { wasGrounded, isMoving: Math.abs(p.vx || 0) > 0 };
};

export const updateEntities = (
    levelData: LevelData, 
    p: PlayerState, 
    canvasHeight: number, 
    audioManager: AudioManager,
    onDeath: () => void
) => {
    const now = Date.now();
    const entities = levelData.entities;

    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        
        // Falling Spikes Logic
        if (e.type === EntityType.FALLING_SPIKE) {
            if (e.static) continue; 

            if (!e.triggered) {
                const distY = (p.y + p.height) - e.y;
                const distX = Math.abs((p.x + p.width/2) - (e.x + e.width/2));
                
                // Prediction logic
                const fallSpeed = 10;
                if (distY > 0 && distY < TILE_SIZE * 15) {
                    const updatesToFall = distY / fallSpeed;
                    const predictedX = p.x + ((p.vx || 0) * updatesToFall);
                    
                    if ((predictedX + p.width > e.x && predictedX < e.x + e.width) || distX < TILE_SIZE / 2) {
                         e.triggered = true;
                         e.triggerTime = now;
                         audioManager.playTrapTrigger(); 
                    }
                }
            } else if (e.triggerTime && now > e.triggerTime + 300) {
                e.falling = true;
            }
            
            if (e.falling) {
                e.y += 10;
                if (e.y > canvasHeight) {
                    entities.splice(i, 1);
                    continue;
                }
                 if (isRectIntersect(p.x, p.y, p.width, p.height, e.x + 8, e.y + 8, e.width - 16, e.height - 12)) {
                    onDeath();
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

            // Crush Blocks
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
            if (e.x < 0 || e.x > levelData.width) {
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
                for (const other of entities) {
                    if (e === other) continue;
                    if (other.type === EntityType.PLATFORM || other.type === EntityType.BUILT_BLOCK || other.type === EntityType.MOVING_PLATFORM) {
                         if (isRectIntersect(e.x, e.y, e.width, e.height, other.x, other.y, other.width, other.height)) {
                             e.y = other.y - e.height;
                             e.vy = 0;
                         }
                    }
                }
                if (e.y > canvasHeight + 100) entities.splice(i, 1); 
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
