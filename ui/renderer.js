import { clamp } from '../engine/math.js';

export function renderBattle(canvas, fighters, camera, config) {
  const context = canvas.getContext('2d');
  const scale = window.devicePixelRatio || 1;
  const width = canvas.clientWidth; const height = canvas.clientHeight;
  if (canvas.width !== width * scale || canvas.height !== height * scale) { canvas.width = width * scale; canvas.height = height * scale; }
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.fillStyle = config.stage.background_color; context.fillRect(0, 0, width, height);
  const zoom = camera.zoom;
  context.save(); context.translate(width / 2, height * 0.9); context.scale(zoom, zoom); context.translate(-camera.x, -config.stage.floor_y);
  context.fillStyle = '#30364a'; context.fillRect(0, config.stage.floor_y, config.stage.width, 500);
  fighters.forEach((fighter, index) => {
    const x = fighter.x; const y = fighter.y;
    context.fillStyle = index ? '#4ac7ed' : '#f1c84b';
    context.fillRect(x - 24, y - 138, 48, 138);
    context.fillStyle = '#fff'; context.font = 'bold 18px system-ui'; context.textAlign = 'center'; context.fillText(fighter.name, x, y - 155);
    if (fighter.attack) {
      const box = fighter.collisionVolumes().attack;
      if (box) { context.globalAlpha = 0.35; context.fillStyle = '#ff4259'; context.fillRect(box.x, box.y, box.width, box.height); context.globalAlpha = 1; }
    }
  });
  context.restore();
}

export function renderHud(target, fighter) {
  const health = clamp(fighter.health / fighter.data.stats.health, 0, 1) * 100;
  const ki = clamp(fighter.ki / fighter.data.stats.ki, 0, 1) * 100;
  target.innerHTML = `<strong>${fighter.name}</strong><div class="meter"><i style="width:${health}%"></i></div><div class="ki-meter"><i style="width:${ki}%"></i></div><small>${fighter.weapon.weapon.name} · ${fighter.weapon.weapon.combat_style}</small>`;
}
