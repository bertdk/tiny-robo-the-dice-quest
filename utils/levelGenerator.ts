
import { Entity, EntityType, LevelData, Point } from '../types';
import { TILE_SIZE, CANVAS_HEIGHT, COLORS, MOVING_PLATFORM_SPEED } from '../constants';

// --- Helper Functions ---

const generateRect = (x: number, y: number, w: number, h: number, color: string): Entity => ({
  id: Math.random().toString(36).substr(2, 9),
  type: EntityType.PLATFORM,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: w * TILE_SIZE,
  height: h * TILE_SIZE,
  color,
});

const generateMovingPlatform = (x: number, y: number, w: number, range: number, axis: 'x' | 'y' = 'x'): Entity => {
    return {
        id: Math.random().toString(36).substr(2, 9),
        type: EntityType.MOVING_PLATFORM,
        x: x * TILE_SIZE,
        y: y * TILE_SIZE,
        width: w * TILE_SIZE,
        height: TILE_SIZE,
        vx: axis === 'x' ? MOVING_PLATFORM_SPEED : 0,
        vy: axis === 'y' ? MOVING_PLATFORM_SPEED : 0,
        axis,
        patrolMin: (axis === 'x' ? x : y) * TILE_SIZE,
        patrolMax: (axis === 'x' ? x + range : y + range) * TILE_SIZE,
        color: COLORS.platforms.moving
    };
};

const generateSpike = (x: number, y: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.SPIKE,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.9, // Bigger spikes (90% of tile height)
});

const generateFallingSpike = (x: number, y: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.FALLING_SPIKE,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.9,
  originalY: y * TILE_SIZE,
  triggered: false
});

const generateSpikedMovingPlatform = (x: number, y: number, w: number, range: number, axis: 'x' | 'y', side: 'top' | 'bottom' = 'top'): Entity[] => {
    const platform = generateMovingPlatform(x, y, w, range, axis);
    const entities = [platform];
    
    for(let i = 0; i < w; i++) {
        let spike: Entity;
        if (side === 'bottom') {
             // Downward pointing spike that sticks to the platform
             spike = generateFallingSpike(0, 0); 
             spike.static = true;
             spike.y = platform.y + platform.height;
        } else {
             // Upward pointing spike
             spike = generateSpike(0, 0); 
             spike.y = platform.y - spike.height;
        }
        
        // We set initial relative position, but updatePhysics will keep it synced
        spike.x = platform.x + i * TILE_SIZE;
        spike.attachedTo = platform.id;
        entities.push(spike);
    }
    return entities;
};

const generateSpider = (x: number, y: number, patrolDistance: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.ENEMY_SPIDER,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.6,
  vx: 2,
  properties: { startX: x * TILE_SIZE, endX: (x + patrolDistance) * TILE_SIZE }
});

const generateFruitFly = (x: number, y: number, patrolDistance: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.FRUIT_FLY,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE * 0.8,
  height: TILE_SIZE * 0.5,
  vx: 1.5,
  properties: { startX: x * TILE_SIZE, endX: (x + patrolDistance) * TILE_SIZE, originalY: y * TILE_SIZE }
});

const generateCheckpoint = (index: number, x: number, y: number): Entity => ({
  id: `cp-${index}`,
  type: EntityType.CHECKPOINT,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE, // Placed exactly at the grid coordinate
  width: TILE_SIZE,
  height: TILE_SIZE,
  properties: { index },
  visible: false // Hidden initially for Intro
});

const generateHangingLamp = (x: number, length: number): Entity => ({
  id: Math.random().toString(36).slice(2, 9),
  type: EntityType.LAMP, // Use LAMP type for rendering, behaves like platform
  x: x * TILE_SIZE,
  y: 0,
  width: TILE_SIZE,
  height: length * TILE_SIZE,
});

const generateSpikedLamp = (x: number, length: number): Entity[] => {
    const lamp = generateHangingLamp(x, length);
    const spike = generateFallingSpike(x, 0); // Y set below
    spike.y = length * TILE_SIZE; // At the bottom of the lamp
    spike.originalY = spike.y;
    spike.static = true; // Does not fall
    return [lamp, spike];
};

// --- Furniture Generators ---

// Sofa with L-shape profile for easier climbing (Side View)
const createSofa = (x: number, y: number, width: number, color: string): Entity[] => {
    const entities: Entity[] = [];
    const seatHeight = 2;
    const legHeight = 1;
    const backHeight = 3;
    const totalHeight = legHeight + seatHeight + backHeight;
    
    // Legs
    entities.push(generateRect(x, y - legHeight, 1, legHeight, COLORS.platforms.darkWood));
    entities.push(generateRect(x + width - 1, y - legHeight, 1, legHeight, COLORS.platforms.darkWood));
    
    // Seat (Full width)
    entities.push(generateRect(x, y - legHeight - seatHeight, width, seatHeight, color));
    
    // Backrest (Only 1 tile wide on the left side to allow sitting/standing)
    // This creates an L shape: |____
    entities.push(generateRect(x, y - totalHeight, 1, backHeight, color));
    
    // Armrest (Small bump on the right)
    entities.push(generateRect(x + width - 0.5, y - legHeight - seatHeight - 0.5, 0.5, 0.5, COLORS.platforms.darkWood));

    return entities;
};

const createTable = (x: number, y: number, width: number): Entity[] => {
    const entities: Entity[] = [];
    const height = 4; 
    
    // Table Top
    entities.push(generateRect(x, y - height, width, 1, COLORS.platforms.wood));
    
    // Legs
    entities.push(generateRect(x + 0.2, y - height + 1, 0.5, height - 1, COLORS.platforms.wood));
    entities.push(generateRect(x + width - 0.7, y - height + 1, 0.5, height - 1, COLORS.platforms.wood));
    
    return entities;
};

const createBookshelf = (x: number, y: number, height: number): Entity[] => {
    const entities: Entity[] = [];
    // Frame
    entities.push(generateRect(x, y - height, 2, height, COLORS.platforms.darkWood));
    
    // Books (Colorful blocks acting as mini platforms or just texture)
    for (let i = 0; i < height - 1; i++) {
        const color = COLORS.furniture.bookSpine[Math.floor(Math.random() * COLORS.furniture.bookSpine.length)];
        entities.push(generateRect(x + 0.2, y - height + i + 0.2, 1.6, 0.6, color));
    }
    
    return entities;
};

const createTVStand = (x: number, y: number): Entity[] => {
    const entities: Entity[] = [];
    // Stand Body
    entities.push(generateRect(x, y - 2, 4, 2, COLORS.furniture.tvStand));
    // Cabinet Doors Detail
    entities.push(generateRect(x + 0.2, y - 1.8, 1.7, 1.6, '#2c3e50'));
    entities.push(generateRect(x + 2.1, y - 1.8, 1.7, 1.6, '#2c3e50'));
    // Door Handles
    entities.push(generateRect(x + 1.6, y - 1.2, 0.2, 0.4, '#7f8c8d'));
    entities.push(generateRect(x + 2.2, y - 1.2, 0.2, 0.4, '#7f8c8d'));
    
    // TV Body (Offset) - Raised slightly for "Flatscreen" look
    entities.push(generateRect(x + 1, y - 5, 3, 2.8, COLORS.furniture.tvBlack));
    // TV Neck/Foot
    entities.push(generateRect(x + 2.2, y - 2.3, 0.6, 0.3, COLORS.furniture.tvBlack));

    // Screen Detail
    entities.push(generateRect(x + 1.2, y - 4.8, 2.6, 2.4, '#2c3e50'));
    
    // LED and Knobs
    entities.push(generateRect(x + 3.6, y - 2.35, 0.1, 0.1, '#e74c3c')); // Red LED
    entities.push(generateRect(x + 1.4, y - 2.35, 0.2, 0.1, '#7f8c8d')); // Knob 1
    entities.push(generateRect(x + 1.8, y - 2.35, 0.2, 0.1, '#7f8c8d')); // Knob 2
    
    return entities;
};

// --- Handcrafted Levels ---

export const createLevel = (levelIndex: number): LevelData => {
  const groundY = 14; 
  // Increase bottom padding to cover potential tall screens (Portrait Mode)
  // 50 tiles * 40px = 2000px depth, enough for any phone aspect ratio
  const bottomTileY = 50; 
  
  const entities: Entity[] = [];
  const checkpoints: Point[] = [];
  let levelWidth = 0;
  let spawnPoint = { x: 2 * TILE_SIZE, y: (groundY - 2) * TILE_SIZE };
  let timeLimit: number | undefined;

  // --- Helper to add entities ---
  const add = (e: Entity | Entity[]) => {
      if (Array.isArray(e)) entities.push(...e);
      else entities.push(e);
  };

  const addCheckpoint = (idx: number, gx: number, gy: number) => {
      // Checkpoint sits ON the block at gy. So its y pos is gy - 1.
      add(generateCheckpoint(idx, gx, gy - 1));
      checkpoints.push({ x: gx * TILE_SIZE, y: (gy - 1) * TILE_SIZE });
  };

  const addFloor = (startX: number, length: number) => {
      // Decorative Top Layer (Wood Grain / Carpet) - Thicker for visibility
      add(generateRect(startX, groundY, length, 0.4, '#8d6e63')); 
      // Main Floor Mass
      add(generateRect(startX, groundY + 0.4, length, bottomTileY - groundY, COLORS.platforms.floor));
  };

  const addPit = (startX: number, length: number) => {
      // Pit background (fill to bottom)
      add(generateRect(startX, groundY + 1, length, bottomTileY - (groundY + 1), '#2c3e50'));
      // Spikes aligned with floor
      for (let i = 0; i < length; i++) {
          add(generateSpike(startX + i, groundY + 0.1));
      }
  };

  if (levelIndex === 1) {
     // --- LEVEL 1: EASY (Movement Basics) ---
     levelWidth = 120;
     addFloor(0, 15);
     add(createSofa(8, groundY, 4, COLORS.furniture.sofaRed));
     addCheckpoint(1, 10, groundY - 3); 
     addFloor(15, 12);
     add(createTable(18, groundY, 5));
     addCheckpoint(2, 20, groundY - 4); 
     addFloor(27, 10);
     addPit(37, 3);
     addFloor(40, 12);
     add(createTVStand(42, groundY));
     addCheckpoint(3, 42, groundY - 2); 
     add(generateHangingLamp(48, 5));
     addFloor(52, 15);
     add(createBookshelf(60, groundY, 5)); 
     addCheckpoint(4, 60, groundY - 5);
     addFloor(67, 18); 
     add(createSofa(75, groundY, 5, COLORS.furniture.sofaBlue));
     addCheckpoint(5, 75, groundY - 6);
     addPit(85, 4); 
     addFloor(89, 10);
     add(createTable(92, groundY, 4));
     add(generateHangingLamp(94, 6)); 
     addFloor(99, 21);
     add(createSofa(105, groundY, 4, COLORS.furniture.sofaRed));
     addCheckpoint(6, 115, groundY); 
  } else if (levelIndex === 2) {
      // --- LEVEL 2: MEDIUM (Building & Hazards) ---
      levelWidth = 145;
      addFloor(0, 22); 
      add(generateRect(10, groundY - 5, 2, 5, COLORS.platforms.wood)); 
      addCheckpoint(1, 15, groundY);
      addPit(22, 5);
      addFloor(27, 15);
      add(createTable(30, groundY, 6));
      add(generateSpider(30, groundY - 4 - 0.6, 6)); // Spider on Table
      addCheckpoint(2, 38, groundY); // CP on floor behind table
      addPit(42, 4);
      addFloor(46, 10);
      add(createBookshelf(50, groundY, 7)); 
      addCheckpoint(3, 50, groundY - 7);
      addFloor(56, 20);
      add(createSofa(62, groundY, 5, COLORS.furniture.sofaRed));
      add(generateSpider(63, groundY - 3 - 0.7, 3)); 
      addCheckpoint(4, 67, groundY);
      add(generateHangingLamp(72, 8)); 
      addPit(76, 6); 
      addFloor(82, 15);
      add(createTVStand(88, groundY));
      addCheckpoint(5, 88, groundY - 2);
      addPit(97, 5);
      addFloor(102, 10);
      add(createBookshelf(105, groundY, 5));
      add(generateHangingLamp(108, 7));
      addFloor(112, 15);
      add(createTable(115, groundY, 8));
      add(generateSpider(115, groundY - 4 - 0.7, 8)); 
      addFloor(127, 20);
      addCheckpoint(6, 140, groundY);
  } else if (levelIndex === 3) {
      // --- LEVEL 3: HARD (Precision) ---
      levelWidth = 185;
      addFloor(0, 8);
      addPit(8, 25);
      add(generateRect(12, groundY - 2, 2, 1, COLORS.platforms.wood)); 
      add(generateRect(18, groundY - 1, 2, 1, COLORS.platforms.wood));
      add(generateRect(24, groundY - 3, 2, 1, COLORS.platforms.wood));
      addCheckpoint(1, 25, groundY - 3 - 1);
      addFloor(33, 10);
      add(createBookshelf(37, groundY, 6)); 
      addCheckpoint(2, 37, groundY - 6 - 1);
      addFloor(43, 5);
      addPit(48, 10); 
      addFloor(58, 12);
      add(generateSpider(59, groundY - 1, 8)); 
      addCheckpoint(3, 64, groundY);
      addFloor(70, 5);
      addPit(75, 30); 
      add(createTable(80, groundY, 4)); // Raised from pit 
      add(createSofa(90, groundY + 1, 4, COLORS.furniture.sofaBlue)); 
      add(generateSpider(92, groundY + 1 - 3 - 0.7, 3));
      addCheckpoint(4, 92, groundY + 1 - 3 - 1); 
      addFloor(105, 12);
      add(createTVStand(110, groundY));
      addCheckpoint(5, 112, groundY - 5 - 1); 
      addPit(117, 8);
      addFloor(125, 10);
      add(createBookshelf(128, groundY, 6)); // Shortened bookshelf
      add(generateHangingLamp(128, 5)); 
      addPit(135, 10);
      add(generateRect(140, groundY, 2, 1, COLORS.platforms.wood)); 
      addFloor(145, 10);
      add(createTable(148, groundY, 5));
      add(generateSpider(148, groundY - 4 - 0.7, 5)); 
      addFloor(155, 30);
      addCheckpoint(6, 175, groundY);
  } else if (levelIndex === 4) {
      // --- LEVEL 4: CLOCKWORK (Moving Platforms) ---
      levelWidth = 160;
      addFloor(0, 15);
      addCheckpoint(1, 10, groundY);
      addPit(15, 10);
      add(generateMovingPlatform(16, groundY - 2, 3, 8, 'x'));
      addFloor(25, 5);
      addCheckpoint(2, 27, groundY);
      addPit(30, 20);
      add(generateMovingPlatform(30, groundY - 3, 3, 6, 'x'));
      add(generateMovingPlatform(38, groundY - 1, 3, 6, 'x'));
      addFloor(50, 8);
      add(createBookshelf(53, groundY, 6));
      addCheckpoint(3, 53, groundY - 6 - 1);
      addPit(58, 8);
      add(generateMovingPlatform(60, groundY - 6, 3, 6, 'y')); // Moves Up/Down strictly above ground
      addFloor(66, 10);
      add(generateSpider(67, groundY - 1, 8));
      addCheckpoint(4, 71, groundY);
      addFloor(76, 20);
      add(createSofa(80, groundY, 5, COLORS.furniture.sofaRed));
      add(generateMovingPlatform(88, groundY - 5, 4, 15, 'x')); // High flying
      addPit(96, 12);
      addFloor(108, 10);
      add(createTVStand(110, groundY));
      addCheckpoint(5, 112, groundY - 5); 
      addPit(118, 15);
      add(generateMovingPlatform(118, groundY - 2, 3, 10, 'x'));
      add(generateHangingLamp(125, 6)); 
      addFloor(133, 27);
      addCheckpoint(6, 150, groundY);
  } else if (levelIndex === 5) {
      // --- LEVEL 5: TIME ATTACK (60s Limit) ---
      levelWidth = 150; 
      timeLimit = 60; 
      addFloor(0, 10);
      addCheckpoint(1, 8, groundY);
      addPit(10, 30);
      add(generateRect(12, groundY - 1, 2, 1, COLORS.platforms.wood));
      add(generateRect(16, groundY - 3, 2, 1, COLORS.platforms.wood));
      add(generateRect(20, groundY - 1, 2, 1, COLORS.platforms.wood));
      add(generateRect(24, groundY - 4, 2, 1, COLORS.platforms.wood));
      addCheckpoint(2, 24, groundY - 4 - 1);
      add(generateMovingPlatform(30, groundY - 7, 3, 6, 'y'));
      add(generateRect(36, groundY - 6, 4, 1, COLORS.platforms.wood)); 
      addCheckpoint(3, 38, groundY - 6 - 1);
      addFloor(40, 10); 
      add(createTable(42, groundY, 6));
      add(generateSpider(42, groundY - 4 - 0.7, 6));
      addPit(50, 20);
      add(generateMovingPlatform(50, groundY - 2, 2, 8, 'x'));
      add(generateMovingPlatform(60, groundY - 2, 2, 8, 'x'));
      addFloor(70, 8);
      addCheckpoint(4, 74, groundY);
      addPit(78, 15);
      add(generateRect(85, groundY - 3, 2, 1, COLORS.platforms.wood));
      add(generateHangingLamp(82, 5));
      add(generateHangingLamp(88, 5));
      addFloor(93, 10);
      add(createBookshelf(96, groundY, 5));
      addCheckpoint(5, 96, groundY - 5 - 1);
      addPit(103, 15);
      add(generateMovingPlatform(103, groundY - 1, 3, 12, 'x'));
      add(generateHangingLamp(110, 6));
      addFloor(118, 30);
      add(createSofa(125, groundY, 4, COLORS.furniture.sofaBlue));
      add(generateSpider(125, groundY - 1, 10)); // Spider guarding finish
      addCheckpoint(6, 140, groundY);
  } else if (levelIndex === 6) {
      // --- LEVEL 6: THE GAUNTLET (120s Limit) ---
      levelWidth = 200;
      timeLimit = 180; 
      addFloor(0, 10);
      addCheckpoint(1, 5, groundY);
      addPit(10, 10);
      add(generateMovingPlatform(10, groundY - 2, 3, 8, 'x'));
      addFloor(20, 10);
      add(createTVStand(22, groundY));
      addCheckpoint(2, 24, groundY - 5);
      addPit(30, 20);
      add(generateMovingPlatform(32, groundY - 6, 3, 6, 'y')); 
      add(generateMovingPlatform(40, groundY - 10, 3, 8, 'y')); 
      addFloor(50, 15);
      add(createBookshelf(55, groundY, 8)); // High wall
      addCheckpoint(3, 55, groundY - 8 - 1);
      addFloor(65, 20);
      add(createTable(70, groundY, 10));
      add(generateSpider(70, groundY - 4 - 0.7, 10)); 
      add(generateSpider(65, groundY - 1, 20)); 
      addCheckpoint(4, 80, groundY - 4 - 1);
      addPit(85, 30);
      add(generateMovingPlatform(86, groundY - 2, 2, 5, 'x'));
      add(generateRect(95, groundY - 4, 2, 1, COLORS.platforms.wood));
      add(generateMovingPlatform(100, groundY - 6, 2, 6, 'y'));
      add(generateHangingLamp(105, 7));
      addFloor(115, 10);
      addCheckpoint(5, 120, groundY);
      addPit(125, 30);
      add(generateMovingPlatform(125, groundY - 2, 3, 20, 'x')); 
      add(generateHangingLamp(135, 6));
      add(generateRect(138, 0, 6, 2, COLORS.platforms.wood)); 
      add(generateFallingSpike(138, 2)); 
      add(generateFallingSpike(139, 2)); 
      add(generateFallingSpike(140, 2)); 
      add(generateFallingSpike(141, 2)); 
      add(generateFallingSpike(142, 2)); 
      add(generateFallingSpike(143, 2)); 
      add(generateHangingLamp(145, 6));
      addFloor(155, 45);
      add(createSofa(160, groundY, 5, COLORS.furniture.sofaRed));
      add(generateSpider(160, groundY - 3 - 0.6, 5)); 
      add(createTable(170, groundY, 5));
      add(generateSpider(170, groundY - 0.6, 5)); 
      add(generateSpider(170, groundY - 4 - 0.6, 5)); 
      add(createBookshelf(180, groundY, 6));
      addCheckpoint(6, 190, groundY);
  } else if (levelIndex === 7) {
      // --- LEVEL 7: THE HORNET'S NEST (Extreme Difficulty) ---
      levelWidth = 220;
      addFloor(0, 8);
      addCheckpoint(1, 5, groundY);
      addPit(8, 20);
      add(generateRect(12, groundY - 2, 2, 1, COLORS.platforms.wood));
      add(generateFruitFly(15, groundY - 4, 6));
      add(generateRect(18, groundY - 1, 2, 1, COLORS.platforms.wood));
      add(generateFruitFly(21, groundY - 3, 6));
      addFloor(28, 10);
      addCheckpoint(2, 32, groundY);
      addPit(38, 25);
      add(generateSpikedMovingPlatform(40, groundY - 2, 3, 10, 'x')); // Danger platform
      add(generateMovingPlatform(45, groundY - 5, 2, 6, 'x')); // Safe platform higher up
      add(generateFruitFly(50, groundY - 6, 8));
      addFloor(63, 10);
      addCheckpoint(3, 68, groundY);
      add(generateFallingSpike(72, groundY - 14)); // Trap above platform
      addPit(73, 20);
      add(generateRect(75, groundY - 5, 2, 1, COLORS.platforms.wood));
      add(generateMovingPlatform(80, groundY - 8, 3, 6, 'y'));
      add(generateFruitFly(80, groundY - 5, 5));
      addFloor(93, 15);
      add(createTVStand(96, groundY));
      add(generateFruitFly(96, groundY - 3, 6));
      addCheckpoint(4, 100, groundY - 5);
      addPit(108, 30);
      add(generateMovingPlatform(110, groundY - 3, 2, 4, 'y'));
      add(generateMovingPlatform(116, groundY - 4, 4, 5, 'y'));
      add(generateMovingPlatform(125, groundY - 3, 2, 4, 'y'));
      add(generateMovingPlatform(132, groundY - 4, 4, 5, 'y'));
      add(generateFruitFly(112, groundY - 6, 20));
      add(generateFruitFly(115, groundY - 2, 20));
      add(generateFruitFly(120, groundY - 5, 20));
      addFloor(138, 10);
      addCheckpoint(5, 142, groundY);
      addPit(148, 40);
      add(generateSpikedMovingPlatform(150, groundY - 2, 3, 15, 'x'));
      add(generateSpikedMovingPlatform(165, groundY - 5, 3, 15, 'x'));
      add(generateMovingPlatform(160, groundY - 8, 2, 20, 'x')); // The safe path high up
      add(generateRect(170, 0, 5, 1, COLORS.platforms.wood)); // Ceiling anchor
      add(generateFallingSpike(170, 1));
      add(generateFallingSpike(172, 1));
      add(generateFallingSpike(174, 1));
      addFloor(188, 32);
      add(createSofa(195, groundY, 4, COLORS.furniture.sofaRed));
      add(generateFruitFly(195, groundY - 3, 6));
      add(generateSpider(200, groundY - 1, 10));
      addCheckpoint(6, 210, groundY);
  } else if (levelIndex === 8) {
      // --- LEVEL 8: THE ELECTRIC HIVE (Spiked Lamps & Precision) ---
      levelWidth = 240;
      
      addFloor(0, 10);
      addCheckpoint(1, 5, groundY);
      
      // Intro: Spiked Lamps
      addPit(10, 20);
      add(generateMovingPlatform(12, groundY - 2, 2, 8, 'x'));
      add(generateSpikedLamp(14, 8)); // Static spike hanging
      add(generateMovingPlatform(22, groundY - 4, 2, 6, 'x'));
      add(generateSpikedLamp(25, 6));
      
      addFloor(30, 12);
      add(createTable(32, groundY, 6));
      add(generateFruitFly(35, groundY - 5, 5));
      addCheckpoint(2, 40, groundY);
      
      // The Vertical Climb
      addPit(45, 15);
      add(generateRect(48, groundY - 3, 2, 1, COLORS.platforms.wood));
      add(generateMovingPlatform(55, groundY - 6, 2, 8, 'y'));
      add(generateSpikedLamp(55, 6)); // Hazard next to moving platform
      add(createBookshelf(65, groundY, 8));
      add(generateFruitFly(62, groundY - 8, 8));
      addCheckpoint(3, 65, groundY - 8 - 1);
      
      // Spiked Platforms & Spiders
      addFloor(70, 30);
      add(createSofa(75, groundY, 5, COLORS.furniture.sofaBlue));
      add(generateSpider(76, groundY - 3.7, 3));
      add(generateSpikedMovingPlatform(85, groundY - 6, 3, 10, 'x', 'bottom')); // Spikes on bottom here
      add(generateSpider(90, groundY - 1, 8));
      
      addPit(100, 25);
      add(generateRect(102, groundY - 2, 2, 1, COLORS.platforms.wood));
      add(generateSpikedLamp(108, 9));
      add(generateSpikedLamp(112, 9));
      add(generateMovingPlatform(115, groundY - 4, 2, 8, 'x'));
      addCheckpoint(4, 126, groundY);
      addFloor(125, 10);

      // The Grinder
      addPit(135, 40);
      add(generateSpikedMovingPlatform(140, groundY - 2, 3, 6, 'y'));
      add(generateSpikedMovingPlatform(150, groundY - 8, 3, 6, 'y'));
      add(generateSpikedMovingPlatform(160, groundY - 2, 3, 6, 'y'));
      
      add(generateRect(145, groundY - 10, 2, 1, COLORS.platforms.wood)); // Rest spots
      add(generateRect(155, groundY - 10, 2, 1, COLORS.platforms.wood));
      
      addFloor(175, 15);
      add(createTVStand(180, groundY));
      add(generateFruitFly(180, groundY - 3, 5));
      addCheckpoint(5, 185, groundY);
      
      // Final Precision
      addPit(190, 30);
      add(generateFallingSpike(189, 0));
      add(generateMovingPlatform(195, groundY - 2, 2, 6, 'x')); // Static floating
      add(generateSpikedLamp(200, 10));
      add(generateMovingPlatform(205, groundY - 5, 2, 8, 'x'));
      add(generateFruitFly(205, groundY - 6, 10));
      
      addFloor(220, 20);
      addCheckpoint(6, 230, groundY);
  }

  // --- Boundaries ---
  add(generateRect(-1, 0, 1, 50, '#000')); // Left Wall
  add(generateRect(levelWidth, 0, 1, 50, '#000')); // Right Wall
  add(generateRect(0, 50, levelWidth, 2, '#000')); // Kill floor
  
  // Ceiling
  add(generateRect(0, -1, levelWidth, 1, '#2c3e50')); // Ceiling prevents jumping out

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
