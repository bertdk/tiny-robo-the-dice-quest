
import { Entity, Point } from '../types';
import { TILE_SIZE, COLORS } from '../constants';
import { generateRect, generateSpike, generateCheckpoint } from './entityFactories';

export const GROUND_Y = 14;
export const BOTTOM_TILE_Y = 50;

export const addEntity = (entities: Entity[], e: Entity | Entity[]) => {
    if (Array.isArray(e)) entities.push(...e);
    else entities.push(e);
};

export const addCheckpoint = (entities: Entity[], checkpoints: Point[], idx: number, gx: number, gy: number) => {
    // Checkpoint sits ON the block at gy. So its y pos is gy - 1.
    addEntity(entities, generateCheckpoint(idx, gx, gy - 1));
    checkpoints.push({ x: gx * TILE_SIZE, y: (gy - 1) * TILE_SIZE });
};

export const addFloor = (entities: Entity[], startX: number, length: number) => {
    // Decorative Top Layer (Wood Grain / Carpet) - Thicker for visibility
    addEntity(entities, generateRect(startX, GROUND_Y, length, 0.4, '#8d6e63')); 
    // Main Floor Mass
    addEntity(entities, generateRect(startX, GROUND_Y + 0.4, length, BOTTOM_TILE_Y - GROUND_Y, COLORS.platforms.floor));
};

export const addPit = (entities: Entity[], startX: number, length: number) => {
    // Pit background (fill to bottom)
    addEntity(entities, generateRect(startX, GROUND_Y + 1, length, BOTTOM_TILE_Y - (GROUND_Y + 1), '#2c3e50'));
    // Spikes aligned with floor
    for (let i = 0; i < length; i++) {
        addEntity(entities, generateSpike(startX + i, GROUND_Y + 0.1));
    }
};
