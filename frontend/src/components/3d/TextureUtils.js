import * as THREE from 'three';

// Cache generated canvas textures for instant reuse and optimal memory
const textureCache = new Map();

/**
 * Creates a procedural Earth daytime surface texture with continents, oceans, and landmass variation
 */
export function getEarthTexture() {
  if (textureCache.has('earth')) return textureCache.get('earth');

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep ocean gradient base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0a2342');
  oceanGrad.addColorStop(0.5, '#07182e');
  oceanGrad.addColorStop(1, '#0a2342');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw procedural continental landmasses
  ctx.fillStyle = '#1c4a27'; // Lush land
  ctx.strokeStyle = '#14341b';

  // Helper to draw smooth continents
  function drawLandmass(points, color = '#1e522b') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i][0] + points[i - 1][0]) / 2;
      const yc = (points[i][1] + points[i - 1][1]) / 2;
      ctx.quadraticCurveTo(points[i - 1][0], points[i - 1][1], xc, yc);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Eurasia & India & Africa
  drawLandmass([
    [1050, 200], [1400, 220], [1600, 320], [1500, 480],
    [1350, 520], [1300, 620], [1250, 520], [1150, 480],
    [1080, 580], [1020, 460], [980, 320], [1050, 200]
  ], '#2a5a35');

  // India peninsula detail (ISRO ground territory)
  drawLandmass([
    [1260, 450], [1310, 470], [1290, 570], [1265, 590], [1245, 520], [1260, 450]
  ], '#386b40');

  // Africa
  drawLandmass([
    [980, 380], [1120, 400], [1160, 520], [1140, 700],
    [1060, 780], [980, 660], [940, 500], [980, 380]
  ], '#45612d');

  // North America
  drawLandmass([
    [320, 180], [580, 190], [640, 320], [540, 450],
    [450, 480], [380, 420], [280, 300], [320, 180]
  ], '#265431');

  // South America
  drawLandmass([
    [500, 490], [600, 540], [640, 680], [560, 840],
    [500, 880], [480, 740], [460, 580], [500, 490]
  ], '#2a6337');

  // Australia
  drawLandmass([
    [1550, 640], [1720, 650], [1740, 780], [1620, 820],
    [1520, 760], [1550, 640]
  ], '#544d2d');

  // Deserts & Mountain Ridges highlight
  ctx.fillStyle = '#6e5f3b';
  ctx.beginPath();
  ctx.ellipse(1080, 430, 90, 40, 0, 0, Math.PI * 2); // Sahara
  ctx.ellipse(1350, 380, 100, 45, 0.2, 0, Math.PI * 2); // Gobi / Central Asia
  ctx.ellipse(1270, 490, 30, 20, 0, 0, Math.PI * 2); // Thar
  ctx.fill();

  // Ice caps (Arctic & Antarctic)
  ctx.fillStyle = '#e2f1fc';
  ctx.fillRect(0, 0, canvas.width, 70);
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('earth', texture);
  return texture;
}

/**
 * Creates procedural Earth night-lights texture with glowing golden cities
 */
export function getEarthNightTexture() {
  if (textureCache.has('earth-night')) return textureCache.get('earth-night');

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#020308';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // City light clusters (Gold / Amber / Cyan glows)
  function drawCityCluster(cx, cy, radius, density = 40, color = '#fbbf24') {
    ctx.fillStyle = color;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = Math.random() * 2.2 + 0.6;
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Major global hubs & Asian space operations region (India ISRO telemetry hubs)
  drawCityCluster(1280, 520, 65, 120, '#fef08a'); // India (Delhi, Mumbai, Bengaluru, Chennai)
  drawCityCluster(1050, 320, 70, 140, '#fde047'); // Europe
  drawCityCluster(480, 320, 80, 150, '#fef08a'); // US East Coast
  drawCityCluster(340, 350, 50, 90, '#fde047'); // US West Coast
  drawCityCluster(1500, 380, 60, 130, '#fef08a'); // East Asia (Tokyo, Shanghai)
  drawCityCluster(1100, 480, 40, 60, '#fef08a'); // Middle East
  drawCityCluster(580, 680, 40, 50, '#fde047'); // S. America (Sao Paulo)
  drawCityCluster(1650, 750, 35, 40, '#fde047'); // Australia SE

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('earth-night', texture);
  return texture;
}

/**
 * Creates procedural Earth cloud canopy texture with realistic swirl patterns
 */
export function getEarthCloudsTexture() {
  if (textureCache.has('earth-clouds')) return textureCache.get('earth-clouds');

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const rx = Math.random() * 80 + 20;
    const ry = Math.random() * 25 + 10;
    const rot = (Math.random() - 0.5) * 0.6;
    ctx.globalAlpha = Math.random() * 0.35 + 0.1;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tropical cyclone spiral swirl
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(620, 260, 45, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set('earth-clouds', texture);
  return texture;
}

/**
 * Creates procedural Sun texture with turbulent solar granules and flares
 */
export function getSunTexture() {
  if (textureCache.has('sun')) return textureCache.get('sun');

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base radiant orange-gold gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#ff4500');
  grad.addColorStop(0.3, '#ff8c00');
  grad.addColorStop(0.7, '#ffa500');
  grad.addColorStop(1, '#ff3b00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Solar granules
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 18 + 4;
    ctx.globalAlpha = Math.random() * 0.4 + 0.2;
    ctx.fillStyle = Math.random() > 0.4 ? '#fff275' : '#ff2200';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  textureCache.set('sun', texture);
  return texture;
}

/**
 * Creates procedural Saturn Rings texture with concentric Cassini division bands
 */
export function getSaturnRingsTexture() {
  if (textureCache.has('saturn-rings')) return textureCache.get('saturn-rings');

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
  grad.addColorStop(0.0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.1, 'rgba(212, 175, 122, 0.2)');
  grad.addColorStop(0.25, 'rgba(230, 204, 163, 0.85)');
  grad.addColorStop(0.48, 'rgba(180, 150, 110, 0.9)');
  grad.addColorStop(0.52, 'rgba(0, 0, 0, 0.05)'); // Cassini Division gap
  grad.addColorStop(0.56, 'rgba(215, 185, 145, 0.85)');
  grad.addColorStop(0.85, 'rgba(175, 145, 105, 0.7)');
  grad.addColorStop(0.95, 'rgba(120, 100, 80, 0.3)');
  grad.addColorStop(1.0, 'rgba(0,0,0,0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set('saturn-rings', texture);
  return texture;
}

/**
 * Creates procedural planet texture given palette characteristics
 */
export function getPlanetTexture(type) {
  const key = `planet-${type}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (type === 'mercury') {
    // Rocky gray with crater spots
    ctx.fillStyle = '#8c8c94';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#5a5a62' : '#b0b0b8';
      ctx.globalAlpha = Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 8 + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'venus') {
    // Thick sulfurous yellow atmosphere bands
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#d4a359');
    grad.addColorStop(0.5, '#eec580');
    grad.addColorStop(1, '#b8863b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = 'rgba(255, 235, 180, 0.25)';
      ctx.fillRect(0, Math.random() * canvas.height, canvas.width, Math.random() * 15 + 5);
    }
  } else if (type === 'mars') {
    // Red oxide planet with darker volcanic patches
    ctx.fillStyle = '#c1440e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = Math.random() > 0.4 ? '#8a2b05' : '#d96c34';
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 40 + 10, Math.random() * 20 + 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar caps
    ctx.fillStyle = 'rgba(240, 248, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, 15);
    ctx.fillRect(0, canvas.height - 15, canvas.width, 15);
  } else if (type === 'jupiter') {
    // Gas giant horizontal alternating cloud bands & Great Red Spot
    ctx.fillStyle = '#d8caaf';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bandColors = ['#a5734e', '#c89d7c', '#e3d2b8', '#8f5c38', '#b5825d', '#d4baa0', '#9e6741'];
    for (let y = 0; y < canvas.height; y += 12) {
      const color = bandColors[Math.floor((y / 12) % bandColors.length)];
      ctx.fillStyle = color;
      ctx.fillRect(0, y, canvas.width, 12);
    }
    // Great Red Spot
    ctx.fillStyle = '#a93226';
    ctx.beginPath();
    ctx.ellipse(320, 160, 32, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'saturn') {
    // Pale gold banded gas giant
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#dfc498');
    grad.addColorStop(0.3, '#edd8b0');
    grad.addColorStop(0.7, '#caa874');
    grad.addColorStop(1, '#dfc498');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === 'uranus') {
    // Cyan-aquamarine ice giant
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#5b9ebd');
    grad.addColorStop(0.5, '#7bc9d8');
    grad.addColorStop(1, '#4c8ba7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === 'neptune') {
    // Deep azure blue with bright white storm cirrus
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#274687');
    grad.addColorStop(0.5, '#3b6bc9');
    grad.addColorStop(1, '#1b3469');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Dark spot & high altitude methane clouds
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(100, 120, 80, 6);
    ctx.fillRect(250, 180, 110, 5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}
