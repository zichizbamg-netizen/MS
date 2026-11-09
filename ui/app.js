import { loadJson } from './data-loader.js';
import { FightingEngine } from './engine.js';
import { renderBattle, renderHud } from '../ui/renderer.js';
import { SaveManager } from '../save/save-manager.js';

const selectScreen = document.querySelector('#select-screen');
const battleScreen = document.querySelector('#battle-screen');
const restScreen = document.querySelector('#rest-screen');
const status = document.querySelector('#status');
const saves = new SaveManager();
let engine; let season; let roster; let missionIndex = 0; let selectedFighter = 'zichiz'; let selectedWeapon = ''; let lastWon = false; let storyMode = true;

const currentMission = () => season.missions[missionIndex];
const availableWeapons = (fighterId) => roster[fighterId].fighter.available_weapons.filter((id) => catalog.weapons[id]);
let catalog;

function showMain() { engine?.stop(); restScreen.hidden = true; battleScreen.hidden = true; selectScreen.hidden = false; renderSelection(); }

function renderSelection() {
  const mission = currentMission();
  const options = mission.playable;
  if (!options.includes(selectedFighter)) selectedFighter = options[0];
  const weaponOptions = availableWeapons(selectedFighter);
  if (!weaponOptions.includes(selectedWeapon)) selectedWeapon = roster[selectedFighter].fighter.default_weapon;
  const saved = saves.load();
  selectScreen.innerHTML = `
    <nav class="mode-tabs"><button class="active">Historia · Temporada 1</button></nav>
    <div class="selection-layout"><section class="selection-info"><p class="eyebrow">MISIÓN ${missionIndex + 1} / ${season.missions.length}</p><h1>${mission.title}</h1><p>${mission.objective}</p>
      <div class="roster">${options.map((id) => `<button class="fighter-card ${id === selectedFighter ? 'selected' : ''}" data-fighter="${id}"><span class="portrait">${roster[id].fighter.name.charAt(0)}</span><strong>${roster[id].fighter.name}</strong><small>${roster[id].fighter.title}</small></button>`).join('')}</div>
      <label class="loadout-label">Arma para la misión<select id="weapon-choice">${weaponOptions.map((id) => `<option value="${id}" ${id === selectedWeapon ? 'selected' : ''}>${catalog.weapon_names[id] ?? id}</option>`).join('')}</select></label>
      ${saved ? `<button id="continue-save" class="secondary">Continuar partida guardada · misión ${Math.min(saved.missionIndex + 1, season.missions.length)}</button>` : ''}
    </section><section class="selection-preview"><div class="hero-placeholder">${roster[selectedFighter].fighter.name}</div><h2>Rival: ${mission.opponent_name}</h2><p>El arma se fija al comenzar y no se puede cambiar durante el combate.</p><button id="start-battle" class="primary">Comenzar misión</button></section></div>`;
  selectScreen.querySelectorAll('[data-fighter]').forEach((button) => button.addEventListener('click', () => { selectedFighter = button.dataset.fighter; selectedWeapon = ''; renderSelection(); }));
  selectScreen.querySelector('#weapon-choice').addEventListener('change', (event) => { selectedWeapon = event.target.value; });
  selectScreen.querySelector('#start-battle').addEventListener('click', () => startMission());
  selectScreen.querySelector('#continue-save')?.addEventListener('click', () => { const progress = saves.load(); missionIndex = Math.min(progress.missionIndex, season.missions.length - 1); selectedFighter = season.missions[missionIndex].playable.includes(progress.selectedFighter) ? progress.selectedFighter : season.missions[missionIndex].playable[0]; selectedWeapon = progress.selectedWeapon ?? ''; renderSelection(); });
}

async function startMission() {
  const mission = currentMission();
  if (!mission.playable.includes(selectedFighter)) { status.textContent = 'El personaje no está permitido en esta misión.'; return; }
  try {
    status.textContent = 'Cargando misión…'; selectScreen.hidden = true; battleScreen.hidden = false; restScreen.hidden = true;
    engine = new FightingEngine(document.querySelector('#battle-canvas'), (canvas, fighters, camera, config) => {
      renderBattle(canvas, fighters, camera, config); renderHud(document.querySelector('#p1-hud'), fighters[0]); renderHud(document.querySelector('#p2-hud'), fighters[1]);
    }, (result) => showRest(result));
    await engine.initialize([selectedFighter, mission.opponent], [selectedWeapon, roster[mission.opponent].fighter.default_weapon]);
    document.querySelector('#round-label').textContent = `MISIÓN ${missionIndex + 1}`;
    status.textContent = ''; engine.start();
  } catch (error) { battleScreen.hidden = true; selectScreen.hidden = false; status.textContent = error.message; }
}

function showRest(result) {
  lastWon = result.winner === 'p1';
  if (lastWon) missionIndex = Math.min(missionIndex + 1, season.missions.length);
  battleScreen.hidden = true; restScreen.hidden = false;
  const finished = missionIndex >= season.missions.length;
  const next = finished ? null : season.missions[missionIndex];
  restScreen.innerHTML = `<section class="rest-card"><p class="eyebrow">${lastWon ? 'VICTORIA' : 'DERROTA'}</p><h1>${finished ? 'Temporada completada' : lastWon ? 'Zona de descanso' : 'Reintentar misión'}</h1><p>${finished ? 'Has completado las nueve misiones de la Temporada 1.' : lastWon ? `Misión ${missionIndex + 1} desbloqueada: ${next.title}` : 'La historia espera. Ajusta tu arma y vuelve a intentarlo.'}</p>
    ${!finished ? `<label class="loadout-label">Arma para la próxima pelea<select id="rest-weapon">${availableWeapons(selectedFighter).map((id) => `<option value="${id}" ${id === selectedWeapon ? 'selected' : ''}>${catalog.weapon_names[id] ?? id}</option>`).join('')}</select></label>` : ''}
    <div class="rest-actions">${!finished ? `<button id="continue-story" class="primary">${lastWon ? 'Seguir la historia' : 'Reintentar'}</button>` : ''}<button id="save-game" class="secondary">Guardar partida</button><button id="main-menu" class="secondary">Salir al menú principal</button></div><p id="save-status" role="status"></p></section>`;
  document.querySelector('#rest-weapon')?.addEventListener('change', (event) => { selectedWeapon = event.target.value; });
  document.querySelector('#continue-story')?.addEventListener('click', () => {
    if (lastWon) { const nextMission = currentMission(); selectedFighter = nextMission.playable.includes(selectedFighter) ? selectedFighter : nextMission.playable[0]; selectedWeapon = ''; }
    restScreen.hidden = true; selectScreen.hidden = false; renderSelection();
  });
  document.querySelector('#save-game').addEventListener('click', () => {
    try { saves.save({ missionIndex: Math.min(missionIndex, season.missions.length - 1), selectedFighter, selectedWeapon }); document.querySelector('#save-status').textContent = 'Partida guardada en este dispositivo.'; }
    catch { document.querySelector('#save-status').textContent = 'No se pudo guardar. Revisa el almacenamiento del navegador.'; }
  });
  document.querySelector('#main-menu').addEventListener('click', showMain);
}

async function boot() {
  catalog = await loadJson('../data/catalog.json');
  season = await loadJson(catalog.story_season_1);
  roster = await loadJson(catalog.story_roster);
  const saved = saves.load();
  if (saved && Number.isInteger(saved.missionIndex)) missionIndex = Math.max(0, Math.min(saved.missionIndex, season.missions.length - 1));
  if (saved?.selectedFighter) selectedFighter = saved.selectedFighter;
  if (saved?.selectedWeapon) selectedWeapon = saved.selectedWeapon;
  renderSelection();
}

document.querySelector('#return-select').addEventListener('click', showMain);
boot().catch((error) => { status.textContent = error.message; });
