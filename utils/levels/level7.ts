
import { Entity, Point } from '../../types';
import { COLORS } from '../../constants';
import { GROUND_Y, addEntity, addCheckpoint, addFloor, addPit } from '../levelHelpers';
import { createSofa, createTVStand } from '../furnitureFactories';
import { generateMovingPlatform, generateSpider, generateRect, generateFallingSpike, generateFruitFly, generateSpikedMovingPlatform } from '../entityFactories';

export const generateLevel7 = (entities: Entity[], checkpoints: Point[]) => {
    const levelWidth = 220;
    
    addFloor(entities, 0, 8);
    addCheckpoint(entities, checkpoints, 1, 5, GROUND_Y);
    
    addPit(entities, 8, 20);
    addEntity(entities, generateRect(12, GROUND_Y - 2, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateFruitFly(15, GROUND_Y - 4, 6));
    addEntity(entities, generateRect(18, GROUND_Y - 1, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateFruitFly(21, GROUND_Y - 3, 6));
    
    addFloor(entities, 28, 10);
    addCheckpoint(entities, checkpoints, 2, 32, GROUND_Y);
    
    addPit(entities, 38, 25);
    addEntity(entities, generateSpikedMovingPlatform(40, GROUND_Y - 2, 3, 10, 'x')); // Danger platform
    addEntity(entities, generateMovingPlatform(45, GROUND_Y - 5, 2, 6, 'x')); // Safe platform higher up
    addEntity(entities, generateFruitFly(50, GROUND_Y - 6, 8));
    
    addFloor(entities, 63, 10);
    addCheckpoint(entities, checkpoints, 3, 68, GROUND_Y);
    addEntity(entities, generateFallingSpike(72, GROUND_Y - 14)); // Trap above platform
    
    addPit(entities, 73, 20);
    addEntity(entities, generateRect(75, GROUND_Y - 5, 2, 1, COLORS.platforms.wood));
    addEntity(entities, generateMovingPlatform(80, GROUND_Y - 8, 3, 6, 'y'));
    addEntity(entities, generateFruitFly(80, GROUND_Y - 5, 5));
    
    addFloor(entities, 93, 15);
    addEntity(entities, createTVStand(96, GROUND_Y));
    addEntity(entities, generateFruitFly(96, GROUND_Y - 3, 6));
    addCheckpoint(entities, checkpoints, 4, 100, GROUND_Y - 5);
    
    addPit(entities, 108, 30);
    addEntity(entities, generateMovingPlatform(110, GROUND_Y - 3, 2, 4, 'y'));
    addEntity(entities, generateMovingPlatform(116, GROUND_Y - 4, 4, 5, 'y'));
    addEntity(entities, generateMovingPlatform(125, GROUND_Y - 3, 2, 4, 'y'));
    addEntity(entities, generateMovingPlatform(132, GROUND_Y - 4, 4, 5, 'y'));
    addEntity(entities, generateFruitFly(112, GROUND_Y - 6, 20));
    addEntity(entities, generateFruitFly(115, GROUND_Y - 2, 20));
    addEntity(entities, generateFruitFly(120, GROUND_Y - 5, 20));
    
    addFloor(entities, 138, 10);
    addCheckpoint(entities, checkpoints, 5, 142, GROUND_Y);
    
    addPit(entities, 148, 40);
    addEntity(entities, generateSpikedMovingPlatform(150, GROUND_Y - 2, 3, 15, 'x'));
    addEntity(entities, generateSpikedMovingPlatform(165, GROUND_Y - 5, 3, 15, 'x'));
    addEntity(entities, generateMovingPlatform(160, GROUND_Y - 8, 2, 20, 'x')); // The safe path high up
    addEntity(entities, generateRect(170, 0, 5, 1, COLORS.platforms.wood)); // Ceiling anchor
    addEntity(entities, generateFallingSpike(170, 1));
    addEntity(entities, generateFallingSpike(172, 1));
    addEntity(entities, generateFallingSpike(174, 1));
    
    addFloor(entities, 188, 32);
    addEntity(entities, createSofa(195, GROUND_Y, 4, COLORS.furniture.sofaRed));
    addEntity(entities, generateFruitFly(195, GROUND_Y - 3, 6));
    addEntity(entities, generateSpider(200, GROUND_Y - 1, 10));
    addCheckpoint(entities, checkpoints, 6, 210, GROUND_Y);

    return { levelWidth };
};
