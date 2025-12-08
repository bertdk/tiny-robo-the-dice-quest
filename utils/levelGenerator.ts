
import { Entity, EntityType, LevelData, Point } from '../types';
import { TILE_SIZE, CANVAS_HEIGHT, COLORS } from '../constants';

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

const generateSpike = (x: number, y: number): Entity => ({
  id: Math.random().toString(36).substr(2, 9),
  type: EntityType.SPIKE,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.9, // Bigger spikes (90% of tile height)
});

const generateSpider = (x: number, y: number, patrolDistance: number): Entity => ({
  id: Math.random().toString(36).substr(2, 9),
  type: EntityType.ENEMY_SPIDER,
  x: x * TILE_SIZE,
  y: y * TILE_SIZE,
  width: TILE_SIZE,
  height: TILE_SIZE * 0.6,
  vx: 2,
  properties: { startX: x * TILE_SIZE, endX: (x + patrolDistance) * TILE_SIZE }
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
  id: Math.random().toString(36).substr(2, 9),
  type: EntityType.LAMP, // Use LAMP type for rendering, behaves like platform
  x: x * TILE_SIZE,
  y: 0,
  width: TILE_SIZE,
  height: length * TILE_SIZE,
});

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
    // Stand
    entities.push(generateRect(x, y - 2, 4, 2, COLORS.furniture.tvStand));
    // TV (Offset to allow standing on stand)
    entities.push(generateRect(x + 1, y - 2 - 3, 3, 3, COLORS.furniture.tvBlack));
    return entities;
};

// --- Handcrafted Levels ---

export const createLevel = (levelIndex: number): LevelData => {
  const groundY = 14; 
  const bottomTileY = Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 5; // Ensure extra padding below canvas
  
  const entities: Entity[] = [];
  const checkpoints: Point[] = [];
  let levelWidth = 0;
  let spawnPoint = { x: 2 * TILE_SIZE, y: (groundY - 2) * TILE_SIZE };

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
     levelWidth = 120; // Extended length
     
     addFloor(0, 15);
     // Sofa: Leg(1) + Seat(2) + Back(3) = 6 high. Top of back is y - 6.
     // But L-shape means seat is exposed at y - 3.
     add(createSofa(8, groundY, 4, COLORS.furniture.sofaRed));
     // Checkpoint 1 on the seat (accessible). Seat top is y-3.
     addCheckpoint(1, 10, groundY - 3); 

     addFloor(15, 12);
     add(createTable(18, groundY, 5));
     // Table surface is y - 4.
     addCheckpoint(2, 20, groundY - 4); 

     addFloor(27, 10);
     addPit(37, 3); // Pit
     
     addFloor(40, 12);
     add(createTVStand(42, groundY));
     // TV Stand: Stand top is y-2. TV top is y-5.
     // Place Checkpoint 3 on the Stand ledge (y-2).
     addCheckpoint(3, 42, groundY - 2); 
     
     // Ceiling Lamp Obstacle
     add(generateHangingLamp(48, 5));

     addFloor(52, 15);
     add(createBookshelf(60, groundY, 5)); 
     // Bookshelf surface is y - 5.
     addCheckpoint(4, 60, groundY - 5);

     // Adjusted floor range to avoid overlap with pit at 85
     addFloor(67, 18); // 67 + 18 = 85
     add(createSofa(75, groundY, 5, COLORS.furniture.sofaBlue));
     // Checkpoint 5 on the top of the backrest (y-6).
     addCheckpoint(5, 75, groundY - 6);
     
     // Extended Section
     addPit(85, 4); // Pit from 85 to 89
     
     addFloor(89, 10);
     add(createTable(92, groundY, 4));
     add(generateHangingLamp(94, 6)); // Lamp blocking jump

     addFloor(99, 21);
     add(createSofa(105, groundY, 4, COLORS.furniture.sofaRed));
     addCheckpoint(6, 115, groundY); // Finish on floor

  } else if (levelIndex === 2) {
      // --- LEVEL 2: MEDIUM (Building & Hazards) ---
      levelWidth = 145;

      // Ensure floor is continuous under walls/objects
      addFloor(0, 22); 
      add(generateRect(10, groundY - 5, 2, 5, COLORS.platforms.wood)); // Wall requiring build
      
      addCheckpoint(1, 15, groundY);

      addPit(22, 5); // 5-tile gap
      
      addFloor(27, 15);
      add(createTable(30, groundY, 6));
      
      // MOVED: Spider on top of table
      // Table surface is y - 4. Spider height 0.6. Y = groundY - 4.6.
      add(generateSpider(30, groundY - 4 - 0.6, 6)); 
      
      // MOVED: Checkpoint 2 behind table (on floor)
      addCheckpoint(2, 38, groundY);

      addPit(42, 4);
      
      addFloor(46, 10);
      add(createBookshelf(50, groundY, 7)); // Taller wall
      // Bookshelf surface y - 7
      addCheckpoint(3, 50, groundY - 7);

      addFloor(56, 20);
      add(createSofa(62, groundY, 5, COLORS.furniture.sofaRed));
      
      // MOVED: Spider on sofa seat, RESTRICTED movement to seat only
      // Sofa at 62. Backrest at 62 (width 1). Seat from 63 to 67.
      // Spider patrol from 63 to 66.
      add(generateSpider(63, groundY - 3 - 0.7, 3)); 
      
      addCheckpoint(4, 67, groundY);
      
      add(generateHangingLamp(72, 8)); // Low hanging lamp

      addPit(76, 6); // Wide gap
      
      addFloor(82, 15);
      add(createTVStand(88, groundY));
      // TV Stand ledge (y-2)
      addCheckpoint(5, 88, groundY - 2);

      // Extended Section
      addPit(97, 5);
      addFloor(102, 10);
      add(createBookshelf(105, groundY, 5));
      add(generateHangingLamp(108, 7));
      
      addFloor(112, 15);
      add(createTable(115, groundY, 8));
      add(generateSpider(115, groundY - 4 - 0.7, 8)); // Spider on table
      
      addFloor(127, 20);
      addCheckpoint(6, 140, groundY);

  } else {
      // --- LEVEL 3: EXTREME (Precision & Complexity) ---
      levelWidth = 185;

      addFloor(0, 8);
      
      // Platforming over spikes
      addPit(8, 25);
      add(generateRect(12, groundY - 2, 2, 1, COLORS.platforms.wood)); 
      add(generateRect(18, groundY - 1, 2, 1, COLORS.platforms.wood));
      add(generateRect(24, groundY - 3, 2, 1, COLORS.platforms.wood));
      addCheckpoint(1, 25, groundY - 3 - 1); // Checkpoint on floating block

      addFloor(33, 10);
      // CHANGED: Shrunk bookshelf height from 9 to 6
      add(createBookshelf(37, groundY, 6)); 
      addCheckpoint(2, 37, groundY - 6 - 1);

      addFloor(43, 5);
      addPit(48, 10); // Huge gap (Build bridge)
      
      addFloor(58, 12);
      add(generateSpider(59, groundY - 1, 8)); // Ground spider
      addCheckpoint(3, 64, groundY);

      addFloor(70, 5);
      // Sunken islands in pit
      addPit(75, 30); 
      
      // CHANGED: Raised Table in pit to ground level (groundY) instead of groundY+2
      add(createTable(80, groundY + 1, 4)); 
      
      add(createSofa(90, groundY + 1, 4, COLORS.furniture.sofaBlue)); 
      // Sofa seat at Y+1 - 3 = Y-2. Spider on top.
      add(generateSpider(92, groundY + 1 - 3 - 0.7, 3));

      addCheckpoint(4, 92, groundY + 1 - 3 - 1); // On sofa seat

      addFloor(105, 12);
      add(createTVStand(110, groundY));
      // CP on TV Top (y-5)
      addCheckpoint(5, 112, groundY - 5 - 1); 
      
      // Extended Section
      addPit(117, 8);
      addFloor(125, 10);
      add(createBookshelf(128, groundY, 7)); // Very tall
      add(generateHangingLamp(128, 5)); // Lamp obstructing jump over wall
      
      addPit(135, 10);
      add(generateRect(140, groundY, 2, 1, COLORS.platforms.wood)); // Tiny island
      
      addFloor(145, 10);
      add(createTable(148, groundY, 5));
      add(generateSpider(148, groundY - 4 - 0.7, 5)); // Spider on table

      addFloor(155, 30);
      addCheckpoint(6, 175, groundY);
  }

  // --- Boundaries ---
  add(generateRect(-1, 0, 1, 50, '#000')); // Left Wall
  add(generateRect(levelWidth, 0, 1, 50, '#000')); // Right Wall
  add(generateRect(0, 25, levelWidth, 2, '#000')); // Kill floor
  
  // Ceiling
  add(generateRect(0, -1, levelWidth, 1, '#2c3e50')); // Ceiling prevents jumping out

  return {
    id: levelIndex,
    name: levelIndex === 1 ? 'Living Room (Easy)' : levelIndex === 2 ? 'The Floor is Lava (Medium)' : 'Extreme Furniture (Hard)',
    width: levelWidth * TILE_SIZE,
    height: CANVAS_HEIGHT, 
    entities,
    spawnPoint,
    checkpoints
  };
};
