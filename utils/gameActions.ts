
import { 
    TILE_SIZE, LASER_SPEED, PHASE_DURATION, BLOCK_COLORS, DICE_BLOCK_OPTIONS 
} from '../constants';
import { Entity, EntityType, PlayerState, LevelData, BlockType, PowerUpType } from '../types';
import { AudioManager } from './audioManager';
import { isRectIntersect } from './physicsEngine';

export const handleShoot = (player: PlayerState, levelData: LevelData, audioManager: AudioManager) => {
    audioManager.playLaser();
    
    const projectile: Entity = {
        id: `laser-${Date.now()}`,
        type: EntityType.PROJECTILE,
        x: player.facingRight ? player.x + player.width : player.x - 20,
        y: player.y + player.height / 2 - 2,
        width: 20,
        height: 4,
        vx: player.facingRight ? LASER_SPEED : -LASER_SPEED
    };
    levelData.entities.push(projectile);
};

export const handlePhase = (player: PlayerState, audioManager: AudioManager) => {
    player.phaseActiveUntil = Date.now() + PHASE_DURATION;
    const dashSpeed = 15;
    player.vx = player.facingRight ? dashSpeed : -dashSpeed;
    player.dashEndTime = Date.now() + 150; 
    audioManager.playDash();
};

export const handleBuild = (
    player: PlayerState, 
    levelData: LevelData, 
    activeBlockType: BlockType, 
    audioManager: AudioManager
) => {
    // Throttle build
    // (Note: Ref tracking for throttling is handled in main loop or here if we pass a ref)
    
    const GAP = 2;
    
    let typeToBuild = activeBlockType;
    if (typeToBuild === BlockType.RANDOM) {
         const options = DICE_BLOCK_OPTIONS.filter(o => o.type !== BlockType.RANDOM);
         typeToBuild = options[Math.floor(Math.random() * options.length)].type;
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

    let buildX: number;
    let buildY: number;

    if (player.facingRight) {
        buildX = player.x + player.width + GAP;
    } else {
        buildX = player.x - buildWidth - GAP;
    }

    if (player.isDucking) {
         buildY = player.y + player.height; 
    } else {
         buildY = player.y + player.height - buildHeight;
    }

    let intersectingEntityIndex = -1;
    
    for (let i = 0; i < levelData.entities.length; i++) {
        const e = levelData.entities[i];
        if (isRectIntersect(buildX, buildY, buildWidth, buildHeight, e.x, e.y, e.width, e.height)) {
            intersectingEntityIndex = i;
            
            if (e.type === EntityType.BUILT_BLOCK) {
                audioManager.playDeconstruct();
                levelData.entities.splice(i, 1); 
                return; 
            }
            
            if (e.type === EntityType.PLATFORM || e.type === EntityType.LAMP || e.type === EntityType.MOVING_PLATFORM) {
                return; 
            }
            
            if (e.type === EntityType.ENEMY_SPIDER || e.type === EntityType.FRUIT_FLY) {
                levelData.entities.splice(i, 1);
                intersectingEntityIndex = -1; 
                break; 
            }
        }
    }
    
    const playerOverlap = isRectIntersect(buildX, buildY, buildWidth, buildHeight, player.x, player.y, player.width, player.height);

    if (intersectingEntityIndex === -1 && !playerOverlap) {
        audioManager.playBuild();
        
        const isFalling = typeToBuild === BlockType.SQUARE || typeToBuild === BlockType.HIGH || typeToBuild === BlockType.WIDE;
        const isFloating = typeToBuild === BlockType.FLOATING;
        const color = BLOCK_COLORS[typeToBuild] || '#95a5a6';

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
        
        levelData.entities.push(newBlock);
    }
};
