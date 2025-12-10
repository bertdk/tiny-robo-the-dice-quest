
import { Entity, EntityType } from '../types';
import { TILE_SIZE, COLORS, MOVING_PLATFORM_SPEED } from '../constants';

export const generateRect = (x: number, y: number, w: number, h: number, color: string): Entity => ({
  id: Math.random().toString(36).substr(2, 9),
  type: EntityType.PLATFORM,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: w * TILE_SIZE,
  height: h * TILE_SIZE,
  color,
});

export const generateMovingPlatform = (x: number, y: number, w: number, range: number, axis: 'x' | 'y' = 'x'): Entity => {
    return {
        id: Math.random().toString(36).substr(2, 9),
        type: EntityType.MOVING_PLATFORM,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        width: w * TILE_SIZE,
        height: TILE_SIZE,
        vx: axis === 'x' ? MOVING_PLATFORM_SPEED : 0,
        vy: axis === 'y' ? MOVING_PLATFORM_SPEED : 0,
        axis,
        patrolMin: (axis === 'x' ? x : y) * TILE_SIZE,
        patrolMax: (axis === 'x' ? x + range : y + range) * TILE_SIZE,
        color: COLORS.platforms.moving
    };
};

export const generateSpike = (x: number, y: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.SPIKE,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.9, // Bigger spikes (90% of tile height)
});

export const generateFallingSpike = (x: number, y: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.FALLING_SPIKE,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.9,
  originalY: y * TILE_SIZE,
  triggered: false
});

export const generateSpikedMovingPlatform = (x: number, y: number, w: number, range: number, axis: 'x' | 'y', side: 'top' | 'bottom' = 'top'): Entity[] => {
    const platform = generateMovingPlatform(x, y, w, range, axis);
    const entities = [platform];
    
    for(let i = 0; i < w; i++) {
        let spike: Entity;
        if (side === 'bottom') {
             // Downward pointing spike that sticks to the platform
             spike = generateFallingSpike(0, 0); 
             spike.static = true;
             spike.y = platform.y + platform.height;
        } else {
             // Upward pointing spike
             spike = generateSpike(0, 0); 
             spike.y = platform.y - spike.height;
        }
        
        // We set initial relative position, but updatePhysics will keep it synced
        spike.x = platform.x + i * TILE_SIZE;
        spike.attachedTo = platform.id;
        entities.push(spike);
    }
    return entities;
};

export const generateSpider = (x: number, y: number, patrolDistance: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.ENEMY_SPIDER,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.6,
  vx: 2,
  properties: { startX: x * TILE_SIZE, endX: (x + patrolDistance) * TILE_SIZE }
});

export const generateFruitFly = (x: number, y: number, patrolDistance: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.FRUIT_FLY,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE * 0.8,
  height: TILE_SIZE * 0.5,
  vx: 1.5,
  properties: { startX: x * TILE_SIZE, endX: (x + patrolDistance) * TILE_SIZE, originalY: y * TILE_SIZE }
});

export const generateCheckpoint = (index: number, x: number, y: number): Entity => ({
  id: `cp-${index}`,
  type: EntityType.CHECKPOINT,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE, // Placed exactly at the grid coordinate
  width: TILE_SIZE,
  height: TILE_SIZE,
  properties: { index },
  visible: false // Hidden initially for Intro
});

export const generateHangingLamp = (x: number, length: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.LAMP, // Use LAMP type for rendering, behaves like platform
  x: x * TILE_SIZE,
  y: 0,
  width: TILE_SIZE,
  height: length * TILE_SIZE,
});

export const generateSpikedLamp = (x: number, length: number): Entity[] => {
    const lamp = generateHangingLamp(x, length);
    const spike = generateFallingSpike(x, 0); // Y set below
    spike.y = length * TILE_SIZE; // At the bottom of the lamp
    spike.originalY = spike.y;
    spike.static = true; // Does not fall
    return [lamp, spike];
};
