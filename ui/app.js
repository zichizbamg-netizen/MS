import { loadJson } from '../engine/data-loader.js';
import { FightingEngine } from '../engine/engine.js';
import { renderBattle, renderHud } from './renderer.js';
import { SaveManager } from '../save/save-manager.js';

const selectScreen = document.querySelector('#select-screen');
const battleScreen = document.querySelector('#battle-screen');
const restScreen = document.querySelector('#rest-screen');
const status = document.querySelector('#status');
const saves = new SaveManager();
let engine; let season; let roster; let catalog; let outfitCatalog; let missionIndex = 0;
let selectedFighter = 'zichiz'; let selectedWeapon = ''; let selectedOutfit = 'normal'; let lastWon = false;
let unlockedOutfits = new Set();

const currentMission = () => season.missions[missionIndex];
const availableWeapons = (fighterId) => roster[fighterId].fighter.available_weapons.filter((id) => catalog.weapons[id]);
const outfitKey = (fighterId, outfitId) => `${fighterId}:${outfitId}`;
const isOutfitUnlocked = (fighterId, outfitId) => outfitCatalog[fighterId]?.[outfitId]?.unlock === 'default' || unlockedOutfits.has(outfitKey(fighterId, outfitId));
const getAvailableOutfits = (fighterId) => Object.entries(outfitCatalog[fighterId] ?? {}).filter(([id]) => isOutfitUnlocked(fighterId, id));

function showMain() {
  engine?.stop(); restScreen.hidden = true; battleScreen.hidden = true; selectScreen.hidden = false; renderSelection();
}

function renderSelection() {
  const mission = currentMission();
  const options = mission.playable;
  if (!options.includes(selectedFighter)) selectedFighter = options[0];
  const available = getAvailableOutfits(selectedFighter);
  const requiredOutfit = mission.required_player_outfit;
  if (requiredOutfit && !isOutfitUnlocked(selectedFighter, requiredOutfit)) {
    selectScreen.innerHTML = `<section class="selection-info"><p class="eyebrow">MISIÓN ${missionIndex + 1} / ${season.missions.length}</p><h1>${mission.title}</h1><p>Outfit requerido bloqueado. Completa la misión Alma dual para desbloquear Zichiz Maligno.</p></section>`;
    return;
  }
  if (requiredOutfit) selectedOutfit = requiredOutfit;
  else if (!available.some(([id]) => id === selectedOutfit)) selectedOutfit = available[0]?.[0] ?? 'normal';
  const weaponOptions = availableWeapons(selectedFighter);
  if (!weaponOptions.includes(selectedWeapon)) selectedWeapon = roster[selectedFighter].fighter.default_weapon;
  const saved = saves.load();
  const outfitsMarkup = requiredOutfit
    ? `<p class="loadout-label">Outfit de misión: <strong>${outfitCatalog[selectedFighter][requiredOutfit].name}</strong> · Desbloqueado</p>`
    : `<label class="loadout-label">Apariencia<select id="outfit-choice">${available.map(([id, outfit]) => `<option value="${id}" ${id === selectedOutfit ? 'selected' : ''}>${outfit.name}</option>`).join('')}</select></label>`;
  selectScreen.innerHTML = `
    <nav class="mode-tabs"><button class="active">Historia · Temporada 1</button></nav>
    <div class="selection-layout"><section class="selection-info"><p class="eyebrow">MISIÓN ${missionIndex + 1} / ${season.missions.length}</p><h1>${mission.title}</h1><p>${mission.objective}</p>
      <div class="roster">${options.map((id) => `<button class="fighter-card ${id === selectedFighter ? 'selected' : ''}" data-fighter="${id}"><span class="portrait">${roster[id].fighter.name.charAt(0)}</span><strong>${roster[id].fighter.name}</strong><small>${roster[id].fighter.title}</small></button>`).join('')}</div>
      ${outfitsMarkup}
      <label class="loadout-label">Arma para la misión<select id="weapon-choice">${weaponOptions.map((id) => `<option value="${id}" ${id === selectedWeapon ? 'selected' : ''}>${catalog.weapon_names[id] ?? id}</option>`).join('')}</select></label>
      ${saved ? `<button id="continue-save" class="secondary">Continuar partida guardada · misión ${Math.min(saved.missionIndex + 1, season.missions.length)}</button>` : ''}
    </section><section class="selection-preview"><div class="hero-placeholder" style="color:${outfitCatalog[selectedFighter]?.[selectedOutfit]?.color ?? '#f4c84a'}">${roster[selectedFighter].fighter.name}</div><h2>Rival: ${mission.opponent_name}</h2><p>El arma se fija al comenzar y no se puede cambiar durante el combate.</p><button id="start-battle" class="primary">Comenzar misión</button></section></div>`;
  selectScreen.querySelectorAll('[data-fighter]').forEach((button) => button.addEventListener('click', () => { selectedFighter = button.dataset.fighter; selectedWeapon = ''; selectedOutfit = 'normal'; renderSelection(); }));
  selectScreen.querySelector('#outfit-choice')?.addEventListener('change', (event) => { selectedOutfit = event.target.value; renderSelection(); });
  selectScreen.querySelector('#weapon-choice').addEventListener('change', (event) => { selectedWeapon = event.target.value; });
  selectScreen.querySelector('#start-battle').addEventListener('click', startMission);
  selectScreen.querySelector('#continue-save')?.addEventListener('click', () => {
    const progress = saves.load();
    missionIndex = Math.max(0, Math.min(progress.missionIndex, season.missions.length - 1));
    selectedFighter = season.missions[missionIndex].playable.includes(progress.selectedFighter) ? progress.selectedFighter : season.missions[missionIndex].playable[0];
    selectedWeapon = progress.selectedWeapon ?? ''; selectedOutfit = progress.selectedOutfit ?? 'normal';
    unlockedOutfits = new Set(progress.unlockedOutfits ?? []); renderSelection();
  });
}

async function startMission() {
  const mission = currentMission();
  if (!mission.playable.includes(selectedFighter)) { status.textContent = 'El personaje no está permitido en esta misión.'; return; }
  if (mission.required_player_outfit && selectedOutfit !== mission.required_player_outfit) { status.textContent = 'Esta misión requiere el outfit desbloqueado Zichiz Maligno.'; return; }
  if (!isOutfitUnlocked(selectedFighter, selectedOutfit)) { status.textContent = 'Ese outfit todavía está bloqueado.'; return; }
  try {
    status.textContent = 'Cargando misión…'; selectScreen.hidden = true; battleScreen.hidden = false; restScreen.hidden = true;
    engine = new FightingEngine(document.querySelector('#battle-canvas'), (canvas, fighters, camera, config) => {
      renderBattle(canvas, fighters, camera, config); renderHud(document.querySelector('#p1-hud'), fighters[0]); renderHud(document.querySelector('#p2-hud'), fighters[1]);
    }, showRest);
    await engine.initialize([selectedFighter, mission.opponent], [selectedWeapon, roster[mission.opponent].fighter.default_weapon], [selectedOutfit, mission.opponent_outfit ?? 'normal']);
    document.querySelector('#round-label').textContent = `MISIÓN ${missionIndex + 1}`;
    status.textContent = ''; engine.start();
  } catch (error) { battleScreen.hidden = true; selectScreen.hidden = false; status.textContent = error.message; }
}

function showRest(result) {
  lastWon = result.winner === 'p1';
  const completedMission = currentMission();
  if (lastWon) {
    for (const key of completedMission.unlock_on_victory ?? []) unlockedOutfits.add(key);
    missionIndex = Math.min(missionIndex + 1, season.missions.length);
    try { saves.save({ missionIndex, selectedFighter, selectedWeapon, selectedOutfit, unlockedOutfits: [...unlockedOutfits] }); } catch { /* User can retry saving from rest menu. */ }
  }
  battleScreen.hidden = true; restScreen.hidden = false;
  const finished = missionIndex >= season.missions.length;
  const next = finished ? null : season.missions[missionIndex];
  restScreen.innerHTML = `<section class="rest-card"><p class="eyebrow">${lastWon ? 'VICTORIA' : 'DERROTA'}</p><h1>${finished ? 'Temporada completada' : lastWon ? 'Zona de descanso' : 'Reintentar misión'}</h1><p>${finished ? 'Has completado las nueve misiones de la Temporada 1.' : lastWon ? `Misión ${missionIndex + 1} desbloqueada: ${next.title}` : 'La historia espera. Ajusta tu arma y vuelve a intentarlo.'}</p>
    ${lastWon && completedMission.unlock_on_victory?.length ? '<p class="unlock-notice">¡Nuevo outfit desbloqueado: Zichiz Maligno!</p>' : ''}
    ${!finished ? `<label class="loadout-label">Arma para la próxima pelea<select id="rest-weapon">${availableWeapons(selectedFighter).map((id) => `<option value="${id}" ${id === selectedWeapon ? 'selected' : ''}>${catalog.weapon_names[id] ?? id}</option>`).join('')}</select></label>` : ''}
    <div class="rest-actions">${!finished ? `<button id="continue-story" class="primary">${lastWon ? 'Seguir la historia' : 'Reintentar'}</button>` : ''}<button id="save-game" class="secondary">Guardar partida</button><button id="main-menu" class="secondary">Salir al menú principal</button></div><p id="save-status" role="status"></p></section>`;
  document.querySelector('#rest-weapon')?.addEventListener('change', (event) => { selectedWeapon = event.target.value; });
  document.querySelector('#continue-story')?.addEventListener('click', () => {
    if (lastWon) { const nextMission = currentMission(); selectedFighter = nextMission.playable.includes(selectedFighter) ? selectedFighter : nextMission.playable[0]; selectedWeapon = ''; selectedOutfit = nextMission.required_player_outfit ?? 'normal'; }
    restScreen.hidden = true; selectScreen.hidden = false; renderSelection();
  });
  document.querySelector('#save-game').addEventListener('click', () => {
    try { saves.save({ missionIndex, selectedFighter, selectedWeapon, selectedOutfit, unlockedOutfits: [...unlockedOutfits] }); document.querySelector('#save-status').textContent = 'Partida guardada en este dispositivo.'; }
    catch { document.querySelector('#save-status').textContent = 'No se pudo guardar. Revisa el almacenamiento del navegador.'; }
  });
  document.querySelector('#main-menu').addEventListener('click', showMain);
}

async function boot() {
  catalog = await loadJson('data/catalog.json');
  [season, roster, outfitCatalog] = await Promise.all([loadJson(catalog.story_season_1), loadJson(catalog.story_roster), loadJson(catalog.story_outfits)]);
  const saved = saves.load();
  if (saved) {
    if (Number.isInteger(saved.missionIndex)) missionIndex = Math.max(0, Math.min(saved.missionIndex, season.missions.length - 1));
    if (saved.selectedFighter) selectedFighter = saved.selectedFighter;
    if (saved.selectedWeapon) selectedWeapon = saved.selectedWeapon;
    if (saved.selectedOutfit) selectedOutfit = saved.selectedOutfit;
    unlockedOutfits = new Set(saved.unlockedOutfits ?? []);
  }
  renderSelection();
}

document.querySelector('#return-select').addEventListener('click', showMain);
boot().catch((error) => { status.textContent = error.message; });
