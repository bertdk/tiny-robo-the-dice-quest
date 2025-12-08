
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum EntityType {
  PLAYER,
  PLATFORM,
  SPIKE,
  ENEMY_SPIDER,
  CHECKPOINT,
  BUILT_BLOCK,
  LAMP,
  PROJECTILE,
  MOVING_PLATFORM,
  FALLING_SPIKE
}

export enum BlockType {
  SQUARE = 'Square',
  FLOATING = 'Floating',
  HIGH = 'High',
  WIDE = 'Wide',
  TEMPORARY = 'Temporary',
  RANDOM = 'Random'
}

export enum PowerUpType {
  DOUBLE_JUMP = 'Double Jump',
  LASER = 'Laser Gun',
  GRAVITY_BOOTS = 'Gravity Boots',
  EXTRA_LIFE = 'Extra Life',
  PHASE = 'Phase Wall'
}

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx?: number; // Velocity X
  vy?: number; // Velocity Y
  color?: string;
  properties?: any; // For flexible data (e.g. checkpoint index)
  visible?: boolean; // For intro reveal logic
  
  // Moving Platform Physics
  patrolMin?: number;
  patrolMax?: number;
  axis?: 'x' | 'y';
  
  // New Block Physics
  falling?: boolean;
  expiresAt?: number;

  // Falling Spike Logic
  triggered?: boolean;
  triggerTime?: number;
  originalY?: number;
}

export interface PlayerState extends Entity {
  isGrounded: boolean;
  isDucking: boolean;
  facingRight: boolean;
  buildMode: boolean;
  animFrame: number;
  state: 'idle' | 'running' | 'jumping' | 'ducking' | 'dead';
  lives: number;
  currentLevel: number;
  lastCheckpointIndex: number; // 0 for start, 1-6 for checkpoints
  
  // Powerups
  jumpCount: number;
  canDoubleJump: boolean;
  hasPhased: boolean;
  phaseActiveUntil: number;
  dashEndTime?: number; // For speed boost dash duration
}

export interface LevelData {
  id: number;
  name: string;
  width: number;
  height: number;
  entities: Entity[];
  spawnPoint: Point;
  checkpoints: Point[]; // Locations of the 6 checkpoints (last is finish)
  timeLimit?: number; // Optional time limit in seconds
}

export interface Camera {
  x: number;
  y: number;
}

export type BuildState = 'valid' | 'invalid' | 'deconstruct';

export interface FlyingFace {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  value: number; // 1-6
  reached: boolean;
}
