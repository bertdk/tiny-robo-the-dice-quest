
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTable, createTVStand, createBookshelf } from '../furnitureFactories';
import { generateHangingLamp } from '../entityFactories';

export const generateLevel1 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 120;
    
    addFloor(entities, 0, 15);
    addEntity(entities, createSofa(8, GROUND_Y, 4, COLORS.furniture.sofaRed));
    addCheckpoint(entities, checkpoints, 1, 10, GROUND_Y - 3); 
    
    addFloor(entities, 15, 12);
    addEntity(entities, createTable(18, GROUND_Y, 5));
    addCheckpoint(entities, checkpoints, 2, 20, GROUND_Y - 4); 
    
    addFloor(entities, 27, 10);
    addPit(entities, 37, 3);
    
    addFloor(entities, 40, 12);
    addEntity(entities, createTVStand(42, GROUND_Y));
    addCheckpoint(entities, checkpoints, 3, 42, GROUND_Y - 2); 
    addEntity(entities, generateHangingLamp(48, 5));
    
    addFloor(entities, 52, 15);
    addEntity(entities, createBookshelf(60, GROUND_Y, 5)); 
    addCheckpoint(entities, checkpoints, 4, 60, GROUND_Y - 5);
    
    addFloor(entities, 67, 18); 
    addEntity(entities, createSofa(75, GROUND_Y, 5, COLORS.furniture.sofaBlue));
    addCheckpoint(entities, checkpoints, 5, 75, GROUND_Y - 6);
    
    addPit(entities, 85, 4); 
    
    addFloor(entities, 89, 10);
    addEntity(entities, createTable(92, GROUND_Y, 4));
    addEntity(entities, generateHangingLamp(94, 6)); 
    
    addFloor(entities, 99, 21);
    addEntity(entities, createSofa(105, GROUND_Y, 4, COLORS.furniture.sofaRed));
    addCheckpoint(entities, checkpoints, 6, 115, GROUND_Y); 

    return { levelWidth };
};
