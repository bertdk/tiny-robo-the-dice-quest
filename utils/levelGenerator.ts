
import { Entity, LevelData, Point } from '../types';
import { TILE_SIZE } from '../constants';
import { generateRect } from './entityFactories';
import { GROUND_Y, addEntity } from './levelHelpers';

import { generateLevel1 } from './levels/level1';
import { generateLevel2 } from './levels/level2';
import { generateLevel3 } from './levels/level3';
import { generateLevel4 } from './levels/level4';
import { generateLevel5 } from './levels/level5';
import { generateLevel6 } from './levels/level6';
import { generateLevel7 } from './levels/level7';
import { generateLevel8 } from './levels/level8';
import { generateLevel9 } from './levels/level9';

export const createLevel = (levelIndex: number): LevelData => {
  const entities: Entity[] = [];
  const checkpoints: Point[] = [];
  
  // Default values
  let levelWidth = 0;
  let timeLimit: number | undefined;
  
  // Standard spawn point
  const spawnPoint = { x: 2 * TILE_SIZE, y: (GROUND_Y - 2) * TILE_SIZE };
  
  // Generate specific level content
  let levelConfig;
  
  switch(levelIndex) {
      case 1: levelConfig = generateLevel1(entities, checkpoints); break;
      case 2: levelConfig = generateLevel2(entities, checkpoints); break;
      case 3: levelConfig = generateLevel3(entities, checkpoints); break;
      case 4: levelConfig = generateLevel4(entities, checkpoints); break;
      case 5: levelConfig = generateLevel5(entities, checkpoints); break;
      case 6: levelConfig = generateLevel6(entities, checkpoints); break;
      case 7: levelConfig = generateLevel7(entities, checkpoints); break;
      case 8: levelConfig = generateLevel8(entities, checkpoints); break;
      case 9: levelConfig = generateLevel9(entities, checkpoints); break;
      default: levelConfig = generateLevel1(entities, checkpoints); break;
  }
  
  levelWidth = levelConfig.levelWidth;
  timeLimit = (levelConfig as any).timeLimit;

  // --- Boundaries ---
  addEntity(entities, generateRect(-1, 0, 1, 50, '#000')); // Left Wall
  addEntity(entities, generateRect(levelWidth, 0, 1, 50, '#000')); // Right Wall
  addEntity(entities, generateRect(0, 50, levelWidth, 2, '#000')); // Kill floor
  
  // Ceiling
  addEntity(entities, generateRect(0, -1, levelWidth, 1, '#2c3e50')); // Ceiling prevents jumping out

  return {
    id: levelIndex,
    name: `Level ${levelIndex}`,
    width: levelWidth * TILE_SIZE,
    height: 2000, // Ensure world is deep enough for vertical scrolling
    entities,
    spawnPoint,
    checkpoints,
    timeLimit
  };
};
