
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTable, createBookshelf } from '../furnitureFactories';
import { generateHangingLamp, generateMovingPlatform, generateSpider, generateRect } from '../entityFactories';

export const generateLevel5 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 150; 
    const timeLimit = 60; 
    
    addFloor(entities, 0, 10);
    addCheckpoint(entities, checkpoints, 1, 8, GROUND_Y);
    
    addPit(entities, 10, 30);
    addEntity(entities, generateRect(12, GROUND_Y - 1, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateRect(16, GROUND_Y - 3, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateRect(20, GROUND_Y - 1, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateRect(24, GROUND_Y - 4, 2, 1, COLORS.platforms.wood));
    addCheckpoint(entities, checkpoints, 2, 24, GROUND_Y - 4 - 1);
    
    addEntity(entities, generateMovingPlatform(30, GROUND_Y - 7, 3, 6, 'y'));
    addEntity(entities, generateRect(36, GROUND_Y - 6, 4, 1, COLORS.platforms.wood)); 
    addCheckpoint(entities, checkpoints, 3, 38, GROUND_Y - 6 - 1);
    
    addFloor(entities, 40, 10); 
    addEntity(entities, createTable(42, GROUND_Y, 6));
    addEntity(entities, generateSpider(42, GROUND_Y - 4 - 0.7, 6));
    
    addPit(entities, 50, 20);
    addEntity(entities, generateMovingPlatform(50, GROUND_Y - 2, 2, 8, 'x'));
    addEntity(entities, generateMovingPlatform(60, GROUND_Y - 2, 2, 8, 'x'));
    
    addFloor(entities, 70, 8);
    addCheckpoint(entities, checkpoints, 4, 74, GROUND_Y);
    
    addPit(entities, 78, 15);
    addEntity(entities, generateRect(85, GROUND_Y - 3, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateHangingLamp(82, 5));
    addEntity(entities, generateHangingLamp(88, 5));
    
    addFloor(entities, 93, 10);
    addEntity(entities, createBookshelf(96, GROUND_Y, 5));
    addCheckpoint(entities, checkpoints, 5, 96, GROUND_Y - 5 - 1);
    
    addPit(entities, 103, 15);
    addEntity(entities, generateMovingPlatform(103, GROUND_Y - 1, 3, 12, 'x'));
    addEntity(entities, generateHangingLamp(110, 6));
    
    addFloor(entities, 118, 30);
    addEntity(entities, createSofa(125, GROUND_Y, 4, COLORS.furniture.sofaBlue));
    addEntity(entities, generateSpider(125, GROUND_Y - 1, 10)); // Spider guarding finish
    addCheckpoint(entities, checkpoints, 6, 140, GROUND_Y);

    return { levelWidth, timeLimit };
};
