import { loadJson, loadCharacterBundle, loadWeaponBundle } from './data-loader.js';
import { InputManager } from './input.js';
import { CombatWorld } from '../combat/world.js';
import { Fighter } from '../combat/fighter.js';
import { Camera2D } from '../camera/camera.js';
import { FightingAI } from './fighting-ai.js';

export class FightingEngine {
  constructor(canvas, render, onResult = () => {}, options = {}) {
    this.canvas = canvas;
    this.render = render;
    this.onResult = onResult;
    this.options = options;
    this.running = false;
    this.accumulator = 0;
    this.lastTime = 0;
    this.resultSent = false;
  }

  async initialize(characterIds, weaponIds = [], outfitIds = []) {
    this.catalog = await loadJson('data/catalog.json');
    [this.config, this.roster, this.outfits, this.aiConfig] = await Promise.all([
      loadJson(this.catalog.engine_config),
      loadJson(this.catalog.story_roster),
      loadJson(this.catalog.story_outfits),
      loadJson(this.catalog.ai_config ?? 'data/ai.json')
    ]);
    const fighters = await Promise.all(characterIds.map((id, index) => this.loadFighter(id, weaponIds[index], outfitIds[index])));
    this.fighters = [
      new Fighter(fighters[0].bundle, fighters[0].weapon, 'p1', this.config.stage.width * 0.35, this.config, fighters[0].outfit),
      new Fighter(fighters[1].bundle, fighters[1].weapon, 'p2', this.config.stage.width * 0.65, this.config, fighters[1].outfit)
    ];
    this.input = new InputManager(this.config.controls);
    this.ai = this.options.cpuOpponent ? new FightingAI(this.aiConfig) : null;
    this.world = new CombatWorld(this.fighters, this.config);
    this.camera = new Camera2D(this.config.camera, this.config.stage);
  }

  async loadFighter(id, requestedWeapon, requestedOutfit) {
    let bundle = this.roster[id];
    if (!bundle) {
      const entry = this.catalog.characters.find((character) => character.id === id);
      if (!entry) throw new Error(`Personaje no encontrado en el catálogo: ${id}`);
      bundle = await loadCharacterBundle(entry.data);
    }
    const fighterData = bundle.fighter;
    const weaponId = requestedWeapon || fighterData.default_weapon;
    if (fighterData.available_weapons && !fighterData.available_weapons.includes(weaponId)) {
      throw new Error(`${weaponId} no está disponible para ${fighterData.name}.`);
    }
    const weaponPath = this.catalog.weapons[weaponId];
    if (!weaponPath) throw new Error(`No hay datos para el arma: ${weaponId}`);
    const weapon = await loadWeaponBundle(weaponPath);
    const requiredForm = weapon.weapon.availability?.required_transformation;
    if (requiredForm && fighterData.form !== requiredForm && !(requiredForm === 'golden_mode' && fighterData.form === 'gold_armor')) {
      throw new Error(`${weapon.weapon.name} requiere la transformación ${requiredForm}.`);
    }
    const outfitId = requestedOutfit || 'normal';
    const outfit = this.outfits[id]?.[outfitId];
    if (requestedOutfit && !outfit) throw new Error(`Outfit no configurado: ${id}/${outfitId}`);
    return { bundle, weapon, outfit: outfit ?? { id: outfitId, name: outfitId, color: '#f1c84b' } };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick);
  }

  stop() { this.running = false; }

  tick = (time) => {
    if (!this.running) return;
    const step = 1 / this.config.fixed_hz;
    this.accumulator += Math.min((time - this.lastTime) / 1000, this.config.max_frame_delta_seconds);
    this.lastTime = time;
    while (this.accumulator >= step) {
      this.input.beginFrame();
      const inputs = { p1: this.input.read('p1'), p2: this.input.read('p2') };
      if (this.ai) inputs.p2 = this.ai.read(this.fighters[1], this.fighters[0], this.world.frame);
      this.world.step(inputs, step);
      this.accumulator -= step;
    }
    const defeated = this.fighters.find((fighter) => fighter.health <= 0);
    if (defeated && !this.resultSent) {
      this.resultSent = true;
      this.stop();
      this.onResult({ winner: this.fighters.find((fighter) => fighter.health > 0)?.player ?? null, fighters: this.fighters });
    }
    this.camera.update(this.fighters, step, this.canvas.clientWidth);
    this.render(this.canvas, this.fighters, this.camera, this.config);
    if (this.running) requestAnimationFrame(this.tick);
  };
}
