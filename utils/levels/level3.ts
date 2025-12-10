
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTable, createTVStand, createBookshelf } from '../furnitureFactories';
import { generateHangingLamp, generateRect, generateSpider } from '../entityFactories';

export const generateLevel3 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 185;
    
    addFloor(entities, 0, 8);
    addPit(entities, 8, 25);
    addEntity(entities, generateRect(12, GROUND_Y - 2, 2, 1, COLORS.platforms.wood)); 
    addEntity(entities, generateRect(18, GROUND_Y - 1, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateRect(24, GROUND_Y - 3, 2, 1, COLORS.platforms.wood));
    addCheckpoint(entities, checkpoints, 1, 25, GROUND_Y - 3 - 1);
    
    addFloor(entities, 33, 10);
    addEntity(entities, createBookshelf(37, GROUND_Y, 6)); 
    addCheckpoint(entities, checkpoints, 2, 37, GROUND_Y - 6 - 1);
    
    addFloor(entities, 43, 5);
    addPit(entities, 48, 10); 
    
    addFloor(entities, 58, 12);
    addEntity(entities, generateSpider(59, GROUND_Y - 1, 8)); 
    addCheckpoint(entities, checkpoints, 3, 64, GROUND_Y);
    
    addFloor(entities, 70, 5);
    addPit(entities, 75, 30); 
    addEntity(entities, createTable(80, GROUND_Y + 1, 4));
    addEntity(entities, createSofa(90, GROUND_Y + 1, 4, COLORS.furniture.sofaBlue)); 
    addEntity(entities, generateSpider(92, GROUND_Y + 1 - 3 - 0.7, 3));
    addCheckpoint(entities, checkpoints, 4, 92, GROUND_Y + 1 - 3 - 1); 
    
    addFloor(entities, 105, 12);
    addEntity(entities, createTVStand(110, GROUND_Y));
    addCheckpoint(entities, checkpoints, 5, 112, GROUND_Y - 5 - 1); 
    
    addPit(entities, 117, 8);
    addFloor(entities, 125, 10);
    addEntity(entities, createBookshelf(128, GROUND_Y, 6)); // Shortened bookshelf
    addEntity(entities, generateHangingLamp(128, 5)); 
    
    addPit(entities, 135, 10);
    addEntity(entities, generateRect(140, GROUND_Y, 2, 1, COLORS.platforms.wood)); 
    
    addFloor(entities, 145, 10);
    addEntity(entities, createTable(148, GROUND_Y, 5));
    addEntity(entities, generateSpider(148, GROUND_Y - 4 - 0.7, 5)); 
    
    addFloor(entities, 155, 30);
    addCheckpoint(entities, checkpoints, 6, 175, GROUND_Y);

    return { levelWidth };
};
