import { loadJson, loadCharacterBundle, loadWeaponBundle } from './data-loader.js';
import { InputManager } from './input.js';
import { CombatWorld } from '../combat/world.js';
import { Fighter } from '../combat/fighter.js';
import { Camera2D } from '../camera/camera.js';

export class FightingEngine {
  constructor(canvas, render, onResult = () => {}) { this.canvas = canvas; this.render = render; this.onResult = onResult; this.running = false; this.accumulator = 0; this.lastTime = 0; this.resultSent = false; }

  async initialize(characterIds, weaponIds = []) {
    this.catalog = await loadJson('../data/catalog.json');
    this.config = await loadJson(this.catalog.engine_config);
    const roster = await loadJson(this.catalog.story_roster);
    const fighters = await Promise.all(characterIds.map(async (id, index) => {
      const record = roster[id];
      if (!record) throw new Error(`Unknown fighter: ${id}`);
      const weaponId = weaponIds[index] || record.fighter.default_weapon;
      if (!record.fighter.available_weapons.includes(weaponId)) throw new Error(`${weaponId} is not available to ${record.fighter.name}.`);
      const weaponPath = this.catalog.weapons[weaponId];
      if (!weaponPath) throw new Error(`Missing weapon data: ${weaponId}`);
      const weapon = await loadWeaponBundle(weaponPath);
      if (weapon.weapon.availability?.required_transformation && record.fighter.form !== weapon.weapon.availability.required_transformation) {
        throw new Error(`${weapon.weapon.name} requires ${weapon.weapon.availability.required_transformation}.`);
      }
      return { bundle: record, weapon };
    }));
    this.fighters = [
      new Fighter(fighters[0].bundle, fighters[0].weapon, 'p1', this.config.stage.width * 0.35, this.config),
      new Fighter(fighters[1].bundle, fighters[1].weapon, 'p2', this.config.stage.width * 0.65, this.config)
    ];
    this.input = new InputManager(this.config.controls);
    this.world = new CombatWorld(this.fighters, this.config);
    this.camera = new Camera2D(this.config.camera, this.config.stage);
  }

  start() { this.running = true; this.lastTime = performance.now(); requestAnimationFrame(this.tick); }
  stop() { this.running = false; }

  tick = (time) => {
    if (!this.running) return;
    const step = 1 / this.config.fixed_hz;
    this.accumulator += Math.min((time - this.lastTime) / 1000, this.config.max_frame_delta_seconds);
    this.lastTime = time;
    while (this.accumulator >= step) {
      this.input.beginFrame();
      this.world.step({ p1: this.input.read('p1'), p2: this.input.read('p2') }, step);
      this.accumulator -= step;
    }
    const winner = this.fighters.find((fighter) => fighter.health <= 0);
    if (winner && !this.resultSent) {
      this.resultSent = true; this.stop();
      this.onResult({ winner: this.fighters.find((fighter) => fighter.health > 0)?.player ?? null, fighters: this.fighters });
    }
    this.camera.update(this.fighters, step, this.canvas.clientWidth);
    this.render(this.canvas, this.fighters, this.camera, this.config);
    if (this.running) requestAnimationFrame(this.tick);
  };
}
