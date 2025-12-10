
import { Entity, EntityType, PlayerState, Camera, BuildState, FlyingFace, PowerUpType, BlockType } from '../types';
import { TILE_SIZE, PLAYER_WIDTH, PLAYER_HEIGHT, DUCK_HEIGHT, COLORS, BLOCK_COLORS } from '../constants';

export const drawRect = (ctx: CanvasRenderingContext2D, camera: Camera, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(x - camera.x, y - camera.y, w, h);
};

export const drawMovingPlatform = (ctx: CanvasRenderingContext2D, camera: Camera, platform: Entity) => {
    const x = platform.x - camera.x;
    const y = platform.y - camera.y;
    const w = platform.width;
    const h = platform.height;

    // Metallic Base
    ctx.fillStyle = COLORS.platforms.moving;
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = '#5f6a6a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    
    // Rivets
    ctx.fillStyle = '#34495e';
    const rivetSize = 3;
    ctx.beginPath();
    ctx.arc(x + 5, y + 5, rivetSize, 0, Math.PI*2);
    ctx.arc(x + w - 5, y + 5, rivetSize, 0, Math.PI*2);
    ctx.arc(x + 5, y + h - 5, rivetSize, 0, Math.PI*2);
    ctx.arc(x + w - 5, y + h - 5, rivetSize, 0, Math.PI*2);
    ctx.fill();

    // Directional Arrows
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    
    ctx.beginPath();
    if (platform.axis === 'y') {
        // Up/Down Arrows
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX - 5, centerY - 5);
        ctx.lineTo(centerX + 5, centerY - 5);
        
        ctx.moveTo(centerX, centerY + 10);
        ctx.lineTo(centerX - 5, centerY + 5);
        ctx.lineTo(centerX + 5, centerY + 5);
    } else {
        // Left/Right Arrows
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX - 5, centerY - 5);
        ctx.lineTo(centerX - 5, centerY + 5);
        
        ctx.moveTo(centerX + 10, centerY);
        ctx.lineTo(centerX + 5, centerY - 5);
        ctx.lineTo(centerX + 5, centerY + 5);
    }
    ctx.fill();
};

export const drawProjectile = (ctx: CanvasRenderingContext2D, camera: Camera, projectile: Entity) => {
    const x = projectile.x - camera.x;
    const y = projectile.y - camera.y;
    
    ctx.fillStyle = '#e74c3c'; // Red laser
    ctx.fillRect(x, y, projectile.width, projectile.height);
    
    // Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#e74c3c';
    ctx.fillRect(x, y, projectile.width, projectile.height);
    ctx.shadowBlur = 0;
};

export const drawSpike = (ctx: CanvasRenderingContext2D, camera: Camera, spike: Entity) => {
    let x = spike.x - camera.x;
    let y = spike.y - camera.y;
    const w = spike.width;
    const h = spike.height;
    
    // Jitter if falling spike triggered
    if (spike.triggered && !spike.falling) {
        x += Math.random() * 2 - 1;
        y += Math.random() * 2 - 1;
    }

    // Flash Red if triggered
    ctx.fillStyle = (spike.triggered && !spike.falling) ? '#e74c3c' : '#7f8c8d'; 
    ctx.beginPath();
    
    if (spike.type === EntityType.FALLING_SPIKE) {
        // Pointing Down
        ctx.moveTo(x, y);
        ctx.moveTo(x + w / 2, y + h); 
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y);
    } else {
        // Pointing Up
        ctx.moveTo(x, y + h);
        ctx.moveTo(x + w / 2, y); 
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
    }
    
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
};

export const drawSpider = (ctx: CanvasRenderingContext2D, camera: Camera, spider: Entity) => {
    const x = spider.x - camera.x;
    const y = spider.y - camera.y;
    const w = spider.width;
    const h = spider.height;

    ctx.fillStyle = '#2c3e50'; 
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h/2, w/2, h/3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(x + w/2 - 5, y + h/2, 2, 0, Math.PI*2);
    ctx.arc(x + w/2 + 5, y + h/2, 2, 0, Math.PI*2);
    ctx.fill();

    const time = Date.now() / 150;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + w/2 - 5, y + h/2);
        const ly = y + h/2 + Math.sin(time + i) * 5 + 10;
        ctx.lineTo(x - 5, ly);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + w/2 + 5, y + h/2);
        const ry = y + h/2 + Math.cos(time + i) * 5 + 10;
        ctx.lineTo(x + w + 5, ry);
        ctx.stroke();
    }
};

export const drawFruitFly = (ctx: CanvasRenderingContext2D, camera: Camera, fly: Entity) => {
    const x = fly.x - camera.x;
    const y = fly.y - camera.y;
    const w = fly.width;
    const h = fly.height;
    
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    const time = Date.now() / 40; 
    const wingOffset = Math.sin(time) * 6;

    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Face direction based on velocity
    if ((fly.vx || 0) > 0) {
        ctx.scale(-1, 1); 
    }

    // -- Back Wing --
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(5, -5 + wingOffset/2, 10, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 1;
    ctx.stroke();

    // -- Legs --
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Front leg
    ctx.moveTo(-5, 5);
    ctx.lineTo(-7, 10 + Math.sin(time/2)*2);
    // Middle leg
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 12 + Math.cos(time/2)*2);
    // Back leg
    ctx.moveTo(5, 5);
    ctx.lineTo(7, 10 + Math.sin(time/2+1)*2);
    ctx.stroke();

    // -- Body (Thorax + Abdomen) --
    // Abdomen (Rear)
    ctx.fillStyle = COLORS.enemies.fruitFly; // Purple
    ctx.beginPath();
    ctx.ellipse(6, 2, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a252f';
    ctx.stroke();
    
    // Stripes on abdomen
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(2, -3, 2, 10);
    ctx.fillRect(7, -3, 2, 10);

    // Thorax (Front/Head area)
    ctx.fillStyle = '#2c3e50'; // Dark Grey/Blue
    ctx.beginPath();
    ctx.ellipse(-4, 0, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // -- Eye --
    ctx.fillStyle = '#e74c3c'; // Red
    ctx.beginPath();
    ctx.arc(-8, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-9, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Proboscis (Mouth)
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.quadraticCurveTo(-10, 8, -6, 10);
    ctx.stroke();

    // -- Front Wing --
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(3, -8 - wingOffset/2, 11, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    ctx.restore();
};

export const drawCheckpoint = (ctx: CanvasRenderingContext2D, camera: Camera, cp: Entity, isPassed: boolean) => {
    // Hide checkpoint if not revealed yet
    if (cp.visible === false) return; 

    const x = cp.x - camera.x;
    const y = cp.y - camera.y;
    const size = cp.width;
    const eyes = cp.properties.index || 1;

    ctx.fillStyle = isPassed ? '#2ecc71' : '#ecf0f1'; 
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, size, size);

    ctx.fillStyle = isPassed ? '#fff' : '#000';
    const dotSize = 4;
    const cx = x + size/2;
    const cy = y + size/2;
    const offset = size/4;

    const drawDot = (dx: number, dy: number) => {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, dotSize, 0, Math.PI*2);
        ctx.fill();
    };

    if (eyes % 2 === 1) drawDot(0, 0); 
    if (eyes >= 2) { drawDot(-offset, -offset); drawDot(offset, offset); } 
    if (eyes >= 4) { drawDot(offset, -offset); drawDot(-offset, offset); } 
    if (eyes === 6) { drawDot(-offset, 0); drawDot(offset, 0); } 
};

export const drawLamp = (ctx: CanvasRenderingContext2D, camera: Camera, lamp: Entity) => {
    const x = lamp.x - camera.x;
    const y = lamp.y - camera.y;
    const w = lamp.width;
    const h = lamp.height;
    
    // Cord
    ctx.beginPath();
    ctx.moveTo(x + w/2, y);
    ctx.lineTo(x + w/2, y + h * 0.7);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Shade
    ctx.fillStyle = COLORS.furniture.lampShade;
    ctx.beginPath();
    ctx.moveTo(x + w/2, y + h * 0.7); // Top center of shade
    ctx.lineTo(x + w, y + h); // Bottom right
    ctx.lineTo(x, y + h); // Bottom left
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.furniture.lampDark;
    ctx.stroke();
    
    // Light bulb glow
    ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
    ctx.beginPath();
    ctx.arc(x + w/2, y + h + 5, 10, 0, Math.PI, false);
    ctx.fill();
};

export const drawBuiltBlock = (ctx: CanvasRenderingContext2D, camera: Camera, block: Entity) => {
    const x = block.x - camera.x;
    const y = block.y - camera.y;
    const w = block.width;
    const h = block.height;
    
    // Default or Fallback
    let color = COLORS.platforms.block;
    
    if (block.color) color = block.color;

    ctx.save();

    if (block.expiresAt) {
        // Fading effect for temporary blocks
        const timeLeft = block.expiresAt - Date.now();
        const lifeRatio = Math.max(0.2, Math.min(1, timeLeft / 1000));
        ctx.globalAlpha = lifeRatio;
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    
    // Inner Detail based on shape/logic
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    
    if (block.expiresAt) {
        ctx.setLineDash([5, 5]); // Dotted stroke for temp
        ctx.strokeRect(x, y, w, h);
    } else {
        ctx.setLineDash([]);
        ctx.strokeRect(x, y, w, h);
    }

    // Visual indicators
    if (block.falling) {
        // Downward arrows pattern for gravity blocks
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(x + w/2, y + h - 5);
        ctx.lineTo(x + w/2 - 5, y + h - 10);
        ctx.lineTo(x + w/2 + 5, y + h - 10);
        ctx.fill();
    }
    
    if (block.expiresAt) {
        // Clock pattern
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, Math.min(w, h)/5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    if (w > TILE_SIZE && h < TILE_SIZE) {
        // Wide block stripes
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x, y + h/2 - 2, w, 4);
    }
    
    if (h > TILE_SIZE && w < TILE_SIZE) {
        // High block stripes
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(x + w/2 - 2, y, 4, h);
    }
    
    ctx.restore();
};

export const drawIntroDice = (ctx: CanvasRenderingContext2D, camera: Camera, x: number, y: number, rotation: number) => {
    const size = TILE_SIZE * 2;
    const cx = x - camera.x + size / 2;
    const cy = y - camera.y + size / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeRect(-size/2, -size/2, size, size);
    
    // Draw generic dots to make it look like a dice spinning
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-15, -15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, 15, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

export const drawFlyingFace = (ctx: CanvasRenderingContext2D, camera: Camera, face: FlyingFace) => {
    const x = face.x - camera.x;
    const y = face.y - camera.y;
    const size = TILE_SIZE;

    ctx.save();
    ctx.translate(x + size/2, y + size/2);
    // Spin effect
    ctx.rotate(Date.now() / 100);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(-size/2, -size/2, size, size);

    // Draw Face Value
    const dotSize = 4;
    const offset = size/4;
    ctx.fillStyle = '#000';
    
    const drawDot = (dx: number, dy: number) => {
        ctx.beginPath();
        ctx.arc(dx, dy, dotSize, 0, Math.PI*2);
        ctx.fill();
    };

    if (face.value % 2 === 1) drawDot(0, 0); 
    if (face.value >= 2) { drawDot(-offset, -offset); drawDot(offset, offset); } 
    if (face.value >= 4) { drawDot(offset, -offset); drawDot(-offset, offset); } 
    if (face.value === 6) { drawDot(-offset, 0); drawDot(offset, 0); } 

    ctx.restore();
};

export const drawRobot = (ctx: CanvasRenderingContext2D, camera: Camera, player: PlayerState, activePowerUp: PowerUpType | null, buildState: BuildState = 'valid', ghostBlockConfig?: {width: number, height: number, color: string}) => {
  const x = player.x - camera.x;
  const y = player.y - camera.y;
  const h = player.isDucking ? DUCK_HEIGHT : PLAYER_HEIGHT;
  const w = PLAYER_WIDTH;
  
  const facingMultiplier = player.facingRight ? 1 : -1;
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Death rotation
  if (player.state === 'dead') {
      const time = Date.now() / 100;
      ctx.rotate(time * 5); // Spin
  }
  
  ctx.scale(facingMultiplier, 1); 

  // --- DASH TRAILS (Afterimage) ---
  // If moving very fast (velocity > 10, considering base move speed is 4-6)
  if (player.state !== 'dead' && Math.abs(player.vx || 0) > 7) {
       // Phase has both trails
       const trailColor = activePowerUp === PowerUpType.PHASE ? '#e67e22' : '#3498db';
       // Draw two ghost images behind
       for(let i = 1; i <= 2; i++) {
          ctx.save();
          // We are currently scaled by facingMultiplier. 
          // If we move -X, we move backwards relative to face.
          ctx.translate(- (i * 12), 0); 
          ctx.globalAlpha = 0.3 / i;
          
          ctx.fillStyle = trailColor;
          ctx.fillRect(-w/2, -h/2, w, h);
          ctx.restore();
       }
  }

  // --- Robot Body ---
  ctx.fillStyle = '#95a5a6'; 
  ctx.fillRect(-w/2, -h/2, w, h);
  
  // Outline
  ctx.strokeStyle = '#2c3e50'; 
  ctx.lineWidth = 2;
  ctx.strokeRect(-w/2, -h/2, w, h);

  // --- Head/Face ---
  const headSize = h * 0.4;
  ctx.fillStyle = '#bdc3c7'; 
  ctx.fillRect(-w/2 + 2, -h/2 + 2, w - 4, headSize);
  
  // --- Eyes (Visor) ---
  ctx.fillStyle = player.state === 'dead' ? '#e74c3c' : '#3498db'; // Red eyes when dead
  ctx.fillRect(-w/2 + 6, -h/2 + 6, w - 12, 6);

  // --- Antenna ---
  ctx.beginPath();
  ctx.moveTo(0, -h/2);
  ctx.lineTo(0, -h/2 - 6);
  ctx.strokeStyle = '#2c3e50'; 
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -h/2 - 6, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c'; 
  ctx.fill();

  // --- Boots/Legs ---
  // If Gravity Boots active, show visual
  const bootColor = activePowerUp === PowerUpType.GRAVITY_BOOTS ? '#9b59b6' : (activePowerUp === PowerUpType.PHASE ? '#e67e22' : '#2c3e50');
  ctx.fillStyle = bootColor;
  
  if (player.state === 'running') {
      const time = Date.now() / 100;
      // Animate legs
      const legOffset = Math.sin(time * 2) * 4;
      ctx.fillRect(-w/2 + 4, h/2 - 4 + legOffset, 6, 4);
      ctx.fillRect(w/2 - 10, h/2 - 4 - legOffset, 6, 4);
  } else {
      ctx.fillRect(-w/2 + 4, h/2 - 4, 6, 4);
      ctx.fillRect(w/2 - 10, h/2 - 4, 6, 4);
  }

  // --- Arms (holding block if build mode) ---
  ctx.fillStyle = '#7f8c8d'; 
  if (player.buildMode && player.state !== 'dead') {
      // Arm raised holding block
      ctx.fillRect(4, -4, 12, 4);
      // Tiny block in hand
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(16, -8, 8, 8);
  } else {
      // Arm down
      ctx.fillRect(-4, 4, 4, 12);
  }

  // --- Weapon / Phase visual ---
  if (activePowerUp === PowerUpType.LASER && !player.buildMode && player.state !== 'dead') {
       // Draw Gun
       ctx.fillStyle = '#2c3e50';
       ctx.fillRect(w/2 - 2, 0, 10, 4);
       ctx.fillRect(w/2 - 2, 0, 2, 6);
       ctx.fillStyle = '#e74c3c';
       ctx.fillRect(w/2 + 6, 1, 2, 2);
  }

  ctx.restore();

  // --- GHOST BLOCK PREVIEW ---
  // Draw this in world space, not player local space
  if (player.buildMode && player.state !== 'dead' && ghostBlockConfig) {
      const { width, height, color } = ghostBlockConfig;
      
      const GAP = 2;
      let buildX;
      if (player.facingRight) {
          buildX = x + w + GAP;
      } else {
          buildX = x - width - GAP;
      }
      
      let buildY;
      if (player.isDucking) {
           buildY = y + h;
      } else {
           buildY = y + h - height;
      }
      
      ctx.save();
      
      // Deconstruct State
      if (buildState === 'deconstruct') {
          ctx.fillStyle = COLORS.ui.deconstruct;
          ctx.fillRect(buildX, buildY, width, height);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(buildX, buildY, width, height);
          
          // X mark
          ctx.beginPath();
          ctx.moveTo(buildX, buildY);
          ctx.lineTo(buildX + width, buildY + height);
          ctx.moveTo(buildX + width, buildY);
          ctx.lineTo(buildX, buildY + height);
          ctx.strokeStyle = '#c0392b';
          ctx.lineWidth = 3;
          ctx.stroke();
      } else {
          // Valid/Invalid State
          ctx.fillStyle = color;
          ctx.fillRect(buildX, buildY, width, height);
          ctx.strokeStyle = buildState === 'valid' ? '#f1c40f' : '#e74c3c';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(buildX, buildY, width, height);
      }
      
      ctx.restore();
  }
};
