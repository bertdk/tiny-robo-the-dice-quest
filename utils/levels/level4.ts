
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTVStand, createBookshelf } from '../furnitureFactories';
import { generateHangingLamp, generateMovingPlatform, generateSpider } from '../entityFactories';

export const generateLevel4 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 160;
    
    addFloor(entities, 0, 15);
    addCheckpoint(entities, checkpoints, 1, 10, GROUND_Y);
    
    addPit(entities, 15, 10);
    addEntity(entities, generateMovingPlatform(16, GROUND_Y - 2, 3, 8, 'x'));
    
    addFloor(entities, 25, 5);
    addCheckpoint(entities, checkpoints, 2, 27, GROUND_Y);
    
    addPit(entities, 30, 20);
    addEntity(entities, generateMovingPlatform(30, GROUND_Y - 3, 3, 6, 'x'));
    addEntity(entities, generateMovingPlatform(38, GROUND_Y - 1, 3, 6, 'x'));
    
    addFloor(entities, 50, 8);
    addEntity(entities, createBookshelf(53, GROUND_Y, 6));
    addCheckpoint(entities, checkpoints, 3, 53, GROUND_Y - 6 - 1);
    
    addPit(entities, 58, 8);
    addEntity(entities, generateMovingPlatform(60, GROUND_Y - 6, 3, 6, 'y')); // Moves Up/Down strictly above ground
    
    addFloor(entities, 66, 10);
    addEntity(entities, generateSpider(67, GROUND_Y - 1, 8));
    addCheckpoint(entities, checkpoints, 4, 71, GROUND_Y);
    
    addFloor(entities, 76, 20);
    addEntity(entities, createSofa(80, GROUND_Y, 5, COLORS.furniture.sofaRed));
    addEntity(entities, generateMovingPlatform(88, GROUND_Y - 5, 4, 15, 'x')); // High flying
    
    addPit(entities, 96, 12);
    
    addFloor(entities, 108, 10);
    addEntity(entities, createTVStand(110, GROUND_Y));
    addCheckpoint(entities, checkpoints, 5, 112, GROUND_Y - 5); 
    
    addPit(entities, 118, 15);
    addEntity(entities, generateMovingPlatform(118, GROUND_Y - 2, 3, 10, 'x'));
    addEntity(entities, generateHangingLamp(125, 6)); 
    
    addFloor(entities, 133, 27);
    addCheckpoint(entities, checkpoints, 6, 150, GROUND_Y);

    return { levelWidth };
};
