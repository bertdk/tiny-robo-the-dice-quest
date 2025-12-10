
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTable, createTVStand, createBookshelf } from '../furnitureFactories';
import { generateHangingLamp, generateRect, generateSpider } from '../entityFactories';

export const generateLevel2 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 145;
    
    addFloor(entities, 0, 22); 
    addEntity(entities, generateRect(10, GROUND_Y - 5, 2, 5, COLORS.platforms.wood)); 
    addCheckpoint(entities, checkpoints, 1, 15, GROUND_Y);
    
    addPit(entities, 22, 5);
    
    addFloor(entities, 27, 15);
    addEntity(entities, createTable(30, GROUND_Y, 6));
    addEntity(entities, generateSpider(30, GROUND_Y - 4 - 0.6, 6)); // Spider on Table
    addCheckpoint(entities, checkpoints, 2, 38, GROUND_Y); // CP on floor behind table
    
    addPit(entities, 42, 4);
    
    addFloor(entities, 46, 10);
    addEntity(entities, createBookshelf(50, GROUND_Y, 7)); 
    addCheckpoint(entities, checkpoints, 3, 50, GROUND_Y - 7);
    
    addFloor(entities, 56, 20);
    addEntity(entities, createSofa(62, GROUND_Y, 5, COLORS.furniture.sofaRed));
    addEntity(entities, generateSpider(63, GROUND_Y - 3 - 0.7, 3)); 
    addCheckpoint(entities, checkpoints, 4, 67, GROUND_Y);
    addEntity(entities, generateHangingLamp(72, 8)); 
    
    addPit(entities, 76, 6); 
    
    addFloor(entities, 82, 15);
    addEntity(entities, createTVStand(88, GROUND_Y));
    addCheckpoint(entities, checkpoints, 5, 88, GROUND_Y - 2);
    
    addPit(entities, 97, 5);
    
    addFloor(entities, 102, 10);
    addEntity(entities, createBookshelf(105, GROUND_Y, 5));
    addEntity(entities, generateHangingLamp(108, 7));
    
    addFloor(entities, 112, 15);
    addEntity(entities, createTable(115, GROUND_Y, 8));
    addEntity(entities, generateSpider(115, GROUND_Y - 4 - 0.7, 8)); 
    
    addFloor(entities, 127, 20);
    addCheckpoint(entities, checkpoints, 6, 140, GROUND_Y);

    return { levelWidth };
};
