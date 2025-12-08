
import { BlockType, PowerUpType } from './types';
import { Square, BoxSelect, ArrowUpToLine, MoveHorizontal, Clock, RefreshCcw, ChevronsUp, Crosshair, Feather, Zap, Heart, Ghost } from 'lucide-react';

export const TILE_SIZE = 40;
export const GRAVITY = 0.6; // Slightly heavier for better feel
export const JUMP_FORCE = -13; // Stronger jump to clear furniture
export const MOVE_SPEED = 4; // Snappy movement
export const MAX_FALL_SPEED = 15;
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

// Fixed Time Step Logic (60 Updates Per Second)
export const MS_PER_UPDATE = 1000 / 60; 

export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 48;
export const DUCK_HEIGHT = 24;

export const MAX_LEVELS = 6;
export const CHECKPOINTS_PER_LEVEL = 6;

// Powerup Constants
export const LASER_SPEED = 12;
export const PHASE_DURATION = 150; // ms
export const SPEED_BOOST_MULTIPLIER = 1.5;
export const GRAVITY_BOOTS_MULTIPLIER = 0.5;

// Moving Platform Constants
export const MOVING_PLATFORM_SPEED = 2;

export enum InputKeys {
  W = 'w',
  A = 'a',
  S = 's',
  D = 'd',
  E = 'e', // Deprecated, mapped to Space
  SHIFT = 'shift', // Deprecated, mapped to Space
  F = 'f',
  SPACE = ' ',
  ESCAPE = 'escape',
  ARROW_UP = 'arrowup',
  ARROW_DOWN = 'arrowdown',
  ARROW_LEFT = 'arrowleft',
  ARROW_RIGHT = 'arrowright',
}

export const COLORS = {
  background: '#fdf6e3', // Lighter wall color
  platforms: {
    wood: '#8b4513',
    darkWood: '#5d4037',
    block: '#95a5a6',
    floor: '#d7ccc8',
    moving: '#7f8c8d' // Metallic for moving platforms
  },
  furniture: {
    sofaRed: '#c0392b',
    sofaBlue: '#2980b9',
    tvBlack: '#111111',
    tvStand: '#34495e',
    bookSpine: ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'],
    lampShade: '#f1c40f',
    lampDark: '#f39c12'
  },
  ui: {
    text: '#333',
    deconstruct: 'rgba(52, 152, 219, 0.8)'
  }
};

export const BLOCK_COLORS = {
    [BlockType.SQUARE]: '#95a5a6',
    [BlockType.FLOATING]: '#00bcd4', // Cyan
    [BlockType.HIGH]: '#9b59b6', // Purple
    [BlockType.WIDE]: '#2ecc71', // Green
    [BlockType.TEMPORARY]: '#e67e22', // Orange
    [BlockType.RANDOM]: '#34495e' // Dark Blue/Grey
};

export const DICE_BLOCK_OPTIONS = [
    { type: BlockType.SQUARE, icon: Square, label: 'Square' },
    { type: BlockType.FLOATING, icon: BoxSelect, label: 'Floating' },
    { type: BlockType.HIGH, icon: ArrowUpToLine, label: 'High' },
    { type: BlockType.WIDE, icon: MoveHorizontal, label: 'Wide' },
    { type: BlockType.TEMPORARY, icon: Clock, label: 'Temp (2s)' },
    { type: BlockType.RANDOM, icon: RefreshCcw, label: 'Random' },
];

export const DICE_POWERUP_OPTIONS = [
    { type: PowerUpType.DOUBLE_JUMP, icon: ChevronsUp, label: 'Dbl Jump' },
    { type: PowerUpType.LASER, icon: Crosshair, label: 'Laser' },
    { type: PowerUpType.GRAVITY_BOOTS, icon: Feather, label: 'Grav Boots' },
    { type: PowerUpType.EXTRA_LIFE, icon: Heart, label: 'Extra Life' },
    { type: PowerUpType.PHASE, icon: Ghost, label: 'Phase Shift' },
];
