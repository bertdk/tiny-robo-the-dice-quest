
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTable, createTVStand, createBookshelf } from '../furnitureFactories';
import { generateMovingPlatform, generateSpider, generateRect, generateFallingSpike, generateFruitFly, generateSpikedMovingPlatform, generateSpikedLamp } from '../entityFactories';

export const generateLevel8 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 240;
    const timeLimit = 210; // 3m 30s
    
    addFloor(entities, 0, 10);
    addCheckpoint(entities, checkpoints, 1, 5, GROUND_Y);
    
    // Intro: Spiked Lamps
    addPit(entities, 10, 20);
    addEntity(entities, generateMovingPlatform(12, GROUND_Y - 2, 2, 8, 'x'));
    addEntity(entities, generateSpikedLamp(14, 8)); // Static spike hanging
    addEntity(entities, generateMovingPlatform(22, GROUND_Y - 4, 2, 6, 'x'));
    addEntity(entities, generateSpikedLamp(25, 6));
    
    addFloor(entities, 30, 12);
    addEntity(entities, createTable(32, GROUND_Y, 6));
    addEntity(entities, generateFruitFly(35, GROUND_Y - 5, 5));
    addCheckpoint(entities, checkpoints, 2, 40, GROUND_Y);
    
    // The Vertical Climb
    addPit(entities, 45, 15);
    addEntity(entities, generateRect(48, GROUND_Y - 3, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateMovingPlatform(55, GROUND_Y - 6, 2, 8, 'y'));
    addEntity(entities, generateSpikedLamp(55, 6)); // Hazard next to moving platform
    addEntity(entities, createBookshelf(65, GROUND_Y, 8));
    addEntity(entities, generateFruitFly(62, GROUND_Y - 8, 8));
    addCheckpoint(entities, checkpoints, 3, 65, GROUND_Y - 8 - 1);
    
    // Spiked Platforms & Spiders
    addFloor(entities, 70, 30);
    addEntity(entities, createSofa(75, GROUND_Y, 5, COLORS.furniture.sofaBlue));
    addEntity(entities, generateSpider(76, GROUND_Y - 3.7, 3));
    addEntity(entities, generateSpikedMovingPlatform(85, GROUND_Y - 6, 3, 10, 'x', 'bottom')); // Spikes on bottom here
    addEntity(entities, generateSpider(90, GROUND_Y - 1, 8));
    
    addPit(entities, 100, 25);
    addEntity(entities, generateRect(102, GROUND_Y - 2, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateSpikedLamp(108, 9));
    addEntity(entities, generateSpikedLamp(112, 9));
    addEntity(entities, generateMovingPlatform(115, GROUND_Y - 4, 2, 8, 'x'));
    addCheckpoint(entities, checkpoints, 4, 126, GROUND_Y);
    addFloor(entities, 125, 10);

    // The Grinder
    addPit(entities, 135, 40);
    addEntity(entities, generateSpikedMovingPlatform(140, GROUND_Y - 2, 3, 6, 'y'));
    addEntity(entities, generateSpikedMovingPlatform(150, GROUND_Y - 8, 3, 6, 'y'));
    addEntity(entities, generateSpikedMovingPlatform(160, GROUND_Y - 2, 3, 6, 'y'));
    
    addEntity(entities, generateRect(145, GROUND_Y - 10, 2, 1, COLORS.platforms.wood)); // Rest spots
    addEntity(entities, generateRect(155, GROUND_Y - 10, 2, 1, COLORS.platforms.wood));
    
    addFloor(entities, 175, 15);
    addEntity(entities, createTVStand(180, GROUND_Y));
    addEntity(entities, generateFruitFly(180, GROUND_Y - 3, 5));
    addCheckpoint(entities, checkpoints, 5, 185, GROUND_Y);
    
    // Final Precision
    addPit(entities, 190, 30);
    addEntity(entities, generateFallingSpike(189, 0));
    addEntity(entities, generateMovingPlatform(195, GROUND_Y - 2, 2, 6, 'x')); // Static floating
    addEntity(entities, generateSpikedLamp(200, 10));
    addEntity(entities, generateMovingPlatform(205, GROUND_Y - 5, 2, 8, 'x'));
    addEntity(entities, generateFruitFly(205, GROUND_Y - 6, 10));
    
    addFloor(entities, 220, 20);
    addCheckpoint(entities, checkpoints, 6, 230, GROUND_Y);

    return { levelWidth, timeLimit };
};
