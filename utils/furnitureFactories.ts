
import { Entity } from '../types';
import { COLORS } from '../constants';
import { generateRect } from './entityFactories';

// Sofa with L-shape profile for easier climbing (Side View)
export const createSofa = (x: number, y: number, width: number, color: string): Entity[] => {
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

export const createTable = (x: number, y: number, width: number): Entity[] => {
    const entities: Entity[] = [];
    const height = 4; 
    
    // Table Top
    entities.push(generateRect(x, y - height, width, 1, COLORS.platforms.wood));
    
    // Legs
    entities.push(generateRect(x + 0.2, y - height + 1, 0.5, height - 1, COLORS.platforms.wood));
    entities.push(generateRect(x + width - 0.7, y - height + 1, 0.5, height - 1, COLORS.platforms.wood));
    
    return entities;
};

export const createBookshelf = (x: number, y: number, height: number): Entity[] => {
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

export const createTVStand = (x: number, y: number): Entity[] => {
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
