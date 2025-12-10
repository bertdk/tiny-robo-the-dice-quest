
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTable, createTVStand, createBookshelf } from '../furnitureFactories';
import { generateMovingPlatform, generateSpider, generateRect, generateFallingSpike, generateFruitFly, generateSpikedMovingPlatform } from '../entityFactories';

export const generateLevel9 = (entities: Entity[], checkpoints: Point[]) => {
    // --- LEVEL 9: THE OMNI-GAUNTLET (The Ultimate Challenge) ---
    // Combines everything: moving spikes, vertical climbs, falling spikes, and enemy swarms.
    const levelWidth = 280;
    const timeLimit = 300; // 5 minutes

    const bottomTileY = 50; // Need reference for deep pit

    addFloor(entities, 0, 15);
    addEntity(entities, createTVStand(5, GROUND_Y));
    addCheckpoint(entities, checkpoints, 1, 12, GROUND_Y);

    // SECTION 1: The Swarm Bridge
    addPit(entities, 15, 35);
    addEntity(entities, generateMovingPlatform(16, GROUND_Y - 2, 3, 10, 'x'));
    addEntity(entities, generateMovingPlatform(28, GROUND_Y - 4, 3, 10, 'x'));
    addEntity(entities, generateMovingPlatform(40, GROUND_Y - 2, 3, 8, 'x'));
    
    addEntity(entities, generateFruitFly(20, GROUND_Y - 6, 6));
    addEntity(entities, generateFruitFly(25, GROUND_Y - 3, 6));
    addEntity(entities, generateFruitFly(35, GROUND_Y - 6, 6));
    addEntity(entities, generateFruitFly(45, GROUND_Y - 3, 6));
    
    addFloor(entities, 50, 10);
    addCheckpoint(entities, checkpoints, 2, 55, GROUND_Y);

    // SECTION 2: The Vertical Spike Tower
    // A tall section using multiple vertical platforms and bookshelves
    addEntity(entities, generateRect(60, GROUND_Y, 40, bottomTileY - GROUND_Y, '#2c3e50')); // Foundation for pit
    addPit(entities, 60, 40); // Actually a pit
    
    addEntity(entities, generateRect(62, GROUND_Y - 2, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateMovingPlatform(68, GROUND_Y - 5, 2, 10, 'y'));
    addEntity(entities, createBookshelf(75, GROUND_Y - 5, 10)); // Tall wall
    addEntity(entities, generateSpikedMovingPlatform(80, GROUND_Y - 12, 3, 6, 'y')); // Hazard
    addEntity(entities, generateMovingPlatform(86, GROUND_Y - 16, 2, 8, 'y'));
    addEntity(entities, generateSpider(75, GROUND_Y - 5 - 0.7, 2)); // Spider on bookshelf top
    
    addEntity(entities, generateRect(90, GROUND_Y - 14, 2, 1, COLORS.platforms.wood)); // Rest
    addEntity(entities, generateFruitFly(90, GROUND_Y - 17, 8));
    
    addFloor(entities, 100, 15);
    addCheckpoint(entities, checkpoints, 3, 105, GROUND_Y);

    // SECTION 3: The Crusher
    addPit(entities, 115, 30);
    // Tight jumps with spikes above and below
    addEntity(entities, generateRect(118, GROUND_Y - 2, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateSpikedMovingPlatform(124, GROUND_Y - 4, 3, 8, 'y', 'bottom')); // Spikes bottom
    addEntity(entities, generateSpikedMovingPlatform(134, GROUND_Y - 4, 3, 8, 'y', 'top')); // Spikes top
    addEntity(entities, generateMovingPlatform(140, GROUND_Y - 2, 2, 5, 'x'));
    
    addFloor(entities, 145, 15);
    addEntity(entities, createTable(150, GROUND_Y, 8));
    addEntity(entities, generateSpider(150, GROUND_Y - 4 - 0.7, 8));
    addEntity(entities, generateSpider(155, GROUND_Y - 1, 8));
    addCheckpoint(entities, checkpoints, 4, 158, GROUND_Y);

    // SECTION 4: Falling Spike Rain
    addPit(entities, 160, 40);
    // Platforms
    addEntity(entities, generateMovingPlatform(162, GROUND_Y - 3, 3, 10, 'x'));
    addEntity(entities, generateMovingPlatform(175, GROUND_Y - 5, 3, 10, 'x'));
    addEntity(entities, generateMovingPlatform(188, GROUND_Y - 3, 3, 10, 'x'));
    
    // Ceiling of spikes
    for(let i = 165; i < 195; i+=2) {
        addEntity(entities, generateFallingSpike(i, GROUND_Y - 15));
    }
    addEntity(entities, generateFruitFly(170, GROUND_Y - 8, 20));
    
    addFloor(entities, 200, 15);
    addEntity(entities, createSofa(205, GROUND_Y, 5, COLORS.furniture.sofaRed));
    addCheckpoint(entities, checkpoints, 5, 210, GROUND_Y);

    // SECTION 5: The Final Dash
    addPit(entities, 215, 60);
    addEntity(entities, generateSpikedMovingPlatform(220, GROUND_Y - 3, 3, 20, 'x', 'bottom'));
    addEntity(entities, generateSpikedMovingPlatform(240, GROUND_Y - 7, 3, 20, 'x', 'bottom'));
    
    addEntity(entities, generateRect(230, GROUND_Y - 5, 2, 1, COLORS.platforms.wood)); // Tiny safe spot
    addEntity(entities, generateSpider(230, GROUND_Y - 5 - 0.6, 2)); // Trap!
    
    addEntity(entities, generateMovingPlatform(255, GROUND_Y - 4, 2, 6, 'y'));
    addEntity(entities, generateMovingPlatform(265, GROUND_Y - 8, 3, 8, 'y'));
    
    addEntity(entities, generateFruitFly(260, GROUND_Y - 10, 10));

    addFloor(entities, 275, 25); // Victory land
    addCheckpoint(entities, checkpoints, 6, 290, GROUND_Y);

    return { levelWidth, timeLimit };
};
