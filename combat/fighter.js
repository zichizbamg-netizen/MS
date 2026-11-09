import { clamp } from '../engine/math.js';
import { hurtbox, pushbox, worldBox } from './boxes.js';

export class Fighter {
  constructor(bundle, weaponBundle, player, x, config, outfit = { id: 'normal', color: '#f1c84b' }) {
    this.data = bundle; this.weapon = weaponBundle; this.player = player; this.outfit = outfit;
    this.x = x; this.y = config.stage.floor_y; this.vx = 0; this.vy = 0;
    this.facing = player === 'p1' ? 1 : -1;
    this.health = bundle.stats.health; this.ki = bundle.stats.ki;
    this.grounded = true; this.state = 'neutral'; this.frame = 0;
    this.attack = null; this.hitTargets = new Set(); this.hitstun = 0; this.hitstop = 0;
    this.combo = 0; this.guard = 100; this.config = config;
    this.push = pushbox(-config.physics.pushbox.width / 2, -config.physics.pushbox.height, config.physics.pushbox.width, config.physics.pushbox.height);
  }

  get id() { return this.data.fighter.id; }
  get name() { return this.data.fighter.name; }

  startAttack(type) {
    if (this.state === 'hitstun' || this.state === 'ko') return;
    const moveId = this.weapon.moveset.attacks[type];
    const move = this.weapon.framedata.moves[moveId];
    if (!move || this.ki < (move.ki_cost ?? 0)) return;
    this.ki -= move.ki_cost ?? 0; this.attack = { id: moveId, data: move, frame: 0 };
    this.hitTargets.clear(); this.state = type === 'ultimate' ? 'ultimate' : 'attacking';
  }

  update(command, opponent, dt) {
    if (this.health <= 0) { this.state = 'ko'; return; }
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.hitstun > 0) { this.hitstun--; this.state = 'hitstun'; }
    else if (this.attack) {
      this.attack.frame++;
      if (this.attack.frame > this.attack.data.startup + this.attack.data.active + this.attack.data.recovery) { this.attack = null; this.state = 'neutral'; }
    } else {
      this.state = this.grounded ? (command.block ? 'guarding' : 'neutral') : 'airborne';
      if (command.light) this.startAttack('light'); else if (command.heavy) this.startAttack('heavy'); else if (command.ultimate) this.startAttack('ultimate');
      if (command.jump && this.grounded) { this.vy = -this.config.physics.jump_speed; this.grounded = false; }
      const direction = Number(command.right) - Number(command.left);
      if (direction) { this.facing = direction; this.vx = direction * this.config.physics.walk_speed; } else this.vx = 0;
    }
    this.x = clamp(this.x + this.vx * dt, 40, this.config.stage.width - 40);
    if (!this.grounded) { this.vy += this.config.physics.gravity * dt; this.y += this.vy * dt; if (this.y >= this.config.stage.floor_y) { this.y = this.config.stage.floor_y; this.vy = 0; this.grounded = true; } }
    if (this.attack) this.resolveHit(opponent);
    this.ki = Math.min(this.data.stats.ki, this.ki + 0.02);
  }

  resolveHit(opponent) {
    const attack = this.attack; const start = attack.data.startup;
    if (attack.frame <= start || attack.frame > start + attack.data.active || this.hitTargets.has(opponent.id)) return;
    const source = worldBox(this.x, this.y, this.facing, attack.data.hitbox, 'hitbox');
    const target = worldBox(opponent.x, opponent.y, 1, this.config.combat.hurtbox, 'hurtbox');
    if (source.x < target.x + target.width && source.x + source.width > target.x && source.y < target.y + target.height && source.y + source.height > target.y) {
      const blocked = opponent.state === 'guarding';
      const raw = attack.data.damage * (this.data.stats.power / 100) * this.config.combat.damage_scale;
      opponent.health = Math.max(0, opponent.health - (blocked ? raw * this.config.combat.guard_damage_scale : raw));
      opponent.hitstun = blocked ? attack.data.blockstun : attack.data.hitstun; opponent.state = blocked ? 'guarding' : 'hitstun';
      opponent.vx = this.facing * attack.data.knockback; opponent.hitstop = this.config.combat.hitstop_frames; this.hitstop = this.config.combat.hitstop_frames;
      this.hitTargets.add(opponent.id); this.combo++; if (!blocked) opponent.combo = 0;
    }
  }

  collisionVolumes() {
    return {
      pushbox: pushbox(this.x + this.push.x, this.y + this.push.y, this.push.width, this.push.height),
      hurtbox: hurtbox(this.x - 24, this.y - 138, 48, 138),
      attack: this.attack?.data.hitbox ? worldBox(this.x, this.y, this.facing, this.attack.data.hitbox, 'hitbox') : null
    };
  }
}
