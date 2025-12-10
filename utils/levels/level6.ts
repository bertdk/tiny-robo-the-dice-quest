
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTable, createTVStand, createBookshelf } from '../furnitureFactories';
import { generateHangingLamp, generateMovingPlatform, generateSpider, generateRect, generateFallingSpike } from '../entityFactories';

export const generateLevel6 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 200;
    const timeLimit = 180; 
    
    addFloor(entities, 0, 10);
    addCheckpoint(entities, checkpoints, 1, 5, GROUND_Y);
    
    addPit(entities, 10, 10);
    addEntity(entities, generateMovingPlatform(10, GROUND_Y - 2, 3, 8, 'x'));
    
    addFloor(entities, 20, 10);
    addEntity(entities, createTVStand(22, GROUND_Y));
    addCheckpoint(entities, checkpoints, 2, 24, GROUND_Y - 5);
    
    addPit(entities, 30, 20);
    addEntity(entities, generateMovingPlatform(32, GROUND_Y - 6, 3, 6, 'y')); 
    addEntity(entities, generateMovingPlatform(40, GROUND_Y - 10, 3, 8, 'y')); 
    
    addFloor(entities, 50, 15);
    addEntity(entities, createBookshelf(55, GROUND_Y, 8)); // High wall
    addCheckpoint(entities, checkpoints, 3, 55, GROUND_Y - 8 - 1);
    
    addFloor(entities, 65, 20);
    addEntity(entities, createTable(70, GROUND_Y, 10));
    addEntity(entities, generateSpider(70, GROUND_Y - 4 - 0.7, 10)); 
    addEntity(entities, generateSpider(65, GROUND_Y - 1, 20)); 
    addCheckpoint(entities, checkpoints, 4, 80, GROUND_Y - 4 - 1);
    
    addPit(entities, 85, 30);
    addEntity(entities, generateMovingPlatform(86, GROUND_Y - 2, 2, 5, 'x'));
    addEntity(entities, generateRect(95, GROUND_Y - 4, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateMovingPlatform(100, GROUND_Y - 6, 2, 6, 'y'));
    addEntity(entities, generateHangingLamp(105, 7));
    
    addFloor(entities, 115, 10);
    addCheckpoint(entities, checkpoints, 5, 120, GROUND_Y);
    
    addPit(entities, 125, 30);
    addEntity(entities, generateMovingPlatform(125, GROUND_Y - 2, 3, 20, 'x')); 
    addEntity(entities, generateHangingLamp(135, 6));
    addEntity(entities, generateRect(138, 0, 6, 2, COLORS.platforms.wood)); 
    addEntity(entities, generateFallingSpike(138, 2)); 
    addEntity(entities, generateFallingSpike(139, 2)); 
    addEntity(entities, generateFallingSpike(140, 2)); 
    addEntity(entities, generateFallingSpike(141, 2)); 
    addEntity(entities, generateFallingSpike(142, 2)); 
    addEntity(entities, generateFallingSpike(143, 2)); 
    addEntity(entities, generateHangingLamp(145, 6));
    
    addFloor(entities, 155, 45);
    addEntity(entities, createSofa(160, GROUND_Y, 5, COLORS.furniture.sofaRed));
    addEntity(entities, generateSpider(160, GROUND_Y - 3 - 0.6, 5)); 
    addEntity(entities, createTable(170, GROUND_Y, 5));
    addEntity(entities, generateSpider(170, GROUND_Y - 0.6, 5)); 
    addEntity(entities, generateSpider(170, GROUND_Y - 4 - 0.6, 5)); 
    addEntity(entities, createBookshelf(180, GROUND_Y, 6));
    addCheckpoint(entities, checkpoints, 6, 190, GROUND_Y);

    return { levelWidth, timeLimit };
};
