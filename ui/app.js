import { loadJson } from '../engine/data-loader.js';
import { FightingEngine } from '../engine/engine.js';
import { renderBattle, renderHud } from './renderer.js';
import { SaveManager } from '../save/save-manager.js';

const selectScreen = document.querySelector('#select-screen');
const battleScreen = document.querySelector('#battle-screen');
const restScreen = document.querySelector('#rest-screen');
const status = document.querySelector('#status');
const saves = new SaveManager();
let catalog; let season; let roster; let outfits; let interfaceConfig;
let engine; let screen = 'home'; let missionIndex = 0;
let selectedFighter = 'zichiz'; let selectedWeapon = ''; let selectedOutfit = 'normal';
let unlockedOutfits = new Set(); let lastWon = false; let missionPicker = false;

const currentMission = () => season.missions[Math.min(missionIndex, season.missions.length - 1)];
const outfitKey = (fighter, outfit) => `${fighter}:${outfit}`;
const isUnlocked = (fighter, outfit) => outfits[fighter]?.[outfit]?.unlock === 'default' || unlockedOutfits.has(outfitKey(fighter, outfit));
const availableOutfits = (fighter) => Object.entries(outfits[fighter] ?? {}).filter(([id]) => isUnlocked(fighter, id));
const availableWeapons = (fighter) => (roster[fighter]?.fighter.available_weapons ?? []).filter((id) => catalog.weapons[id]);
const t = (key, fallback) => interfaceConfig.navigation[key] ?? fallback;

function renderHome() {
  screen = 'home';
  const save = saves.load();
  const continueButton = save ? `<button id="continue-story" class="primary">${t('continue', 'Continuar partida')} · misión ${Math.min((save.missionIndex ?? 0) + 1, season.missions.length)}</button>` : '';
  selectScreen.innerHTML = `<section class="home-layout"><div class="home-copy"><p class="eyebrow">${interfaceConfig.app.subtitle}</p><h1>${interfaceConfig.app.title}<br><span>EL SELLO FINAL</span></h1><p>Una campaña de nueve misiones. Elige combatiente, apariencia y arma antes de cada batalla.</p><div class="home-actions">${continueButton}<button id="new-story" class="primary">${t('new_game', 'Nueva partida')}</button><button id="mission-list" class="secondary">${t('mission_select', 'Seleccionar misión')}</button></div></div><aside class="home-panel"><span class="panel-kicker">TEMPORADA 01</span><strong>EL CAOS<br>Y EL SELLO FINAL</strong><small>9 misiones · Combate local contra CPU</small></aside></section>`;
  document.querySelector('#new-story').addEventListener('click', () => { missionIndex = 0; unlockedOutfits = new Set(); selectedFighter = 'zichiz'; selectedWeapon = ''; selectedOutfit = 'normal'; renderMission(); });
  document.querySelector('#mission-list').addEventListener('click', () => { missionPicker = true; renderMission(); });
  document.querySelector('#continue-story')?.addEventListener('click', continueSave);
}

function continueSave() {
  const save = saves.load();
  if (!save) return renderMission();
  missionIndex = Math.max(0, Math.min(save.missionIndex ?? 0, season.missions.length - 1));
  selectedFighter = save.selectedFighter ?? 'zichiz';
  selectedWeapon = save.selectedWeapon ?? '';
  selectedOutfit = save.selectedOutfit ?? 'normal';
  unlockedOutfits = new Set(save.unlockedOutfits ?? []);
  renderMission();
}

function renderMission() {
  screen = 'mission';
  const mission = currentMission();
  const playable = mission.playable;
  if (!playable.includes(selectedFighter)) selectedFighter = playable[0];
  const requiredOutfit = mission.required_player_outfit;
  const outfitsForFighter = availableOutfits(selectedFighter);
  selectedOutfit = requiredOutfit ?? (outfitsForFighter.some(([id]) => id === selectedOutfit) ? selectedOutfit : outfitsForFighter[0]?.[0] ?? 'normal');
  const weaponsForFighter = availableWeapons(selectedFighter);
  if (!weaponsForFighter.includes(selectedWeapon)) selectedWeapon = roster[selectedFighter].fighter.default_weapon;
  const lockedRequired = requiredOutfit && !isUnlocked(selectedFighter, requiredOutfit);
  const missionCards = missionPicker ? `<div class="mission-list">${season.missions.map((item, index) => `<button class="mission-row ${index === missionIndex ? 'selected' : ''}" data-mission="${index}" ${index > missionIndex ? 'disabled' : ''}><span>${String(index + 1).padStart(2, '0')}</span><strong>${item.title}</strong><small>${index < missionIndex ? 'Completada' : index === missionIndex ? 'Disponible' : 'Bloqueada'}</small></button>`).join('')}</div>` : '';
  const outfitField = requiredOutfit
    ? `<p class="loadout-label">Apariencia de misión: <strong>${outfits[selectedFighter]?.[requiredOutfit]?.name ?? requiredOutfit}</strong>${lockedRequired ? ' · BLOQUEADA' : ''}</p>`
    : `<label class="loadout-label">Apariencia<select id="outfit-choice">${outfitsForFighter.map(([id, value]) => `<option value="${id}" ${id === selectedOutfit ? 'selected' : ''}>${value.name}</option>`).join('')}</select></label>`;
  selectScreen.innerHTML = `<nav class="screen-nav"><button id="home-button">${t('home', 'Menú principal')}</button><span>HISTORIA / TEMPORADA 1</span></nav>
    <div class="campaign-layout"><section class="selection-info"><p class="eyebrow">MISIÓN ${missionIndex + 1} / ${season.missions.length}</p><h1>${mission.title}</h1><p>${mission.objective}</p>${missionCards}
      <h2 class="section-title">Elige combatiente</h2><div class="roster">${playable.map((id) => `<button class="fighter-card ${id === selectedFighter ? 'selected' : ''}" data-fighter="${id}" aria-pressed="${id === selectedFighter}"><span class="portrait">${roster[id].fighter.name.charAt(0)}</span><strong>${roster[id].fighter.name}</strong><small>${roster[id].fighter.title}</small></button>`).join('')}</div>
      ${outfitField}<label class="loadout-label">Arma para la misión<select id="weapon-choice">${weaponsForFighter.map((id) => `<option value="${id}" ${id === selectedWeapon ? 'selected' : ''}>${catalog.weapon_names[id] ?? id}</option>`).join('')}</select></label>
      <button id="begin-mission" class="primary" ${lockedRequired ? 'disabled' : ''}>Comenzar misión</button></section>
      <aside class="selection-preview"><div class="versus-preview"><div><small>JUGADOR</small><strong style="color:${outfits[selectedFighter]?.[selectedOutfit]?.color ?? '#f4c84a'}">${roster[selectedFighter].fighter.name}</strong><span>${outfits[selectedFighter]?.[selectedOutfit]?.name ?? selectedOutfit}</span></div><b>VS</b><div><small>RIVAL CPU</small><strong>${mission.opponent_name}</strong><span>${mission.opponent_outfit ? outfits[mission.opponent]?.[mission.opponent_outfit]?.name ?? mission.opponent_outfit : 'Combate de historia'}</span></div></div><p>Arma fija durante el combate; podrás cambiarla en el descanso antes de la siguiente misión.</p><div class="progress-track">${season.missions.map((_, index) => `<i class="${index < missionIndex ? 'done' : index === missionIndex ? 'current' : ''}" aria-label="Misión ${index + 1}"></i>`).join('')}</div></aside></div>`;
  document.querySelector('#home-button').addEventListener('click', renderHome);
  selectScreen.querySelectorAll('[data-mission]').forEach((button) => button.addEventListener('click', () => { missionIndex = Number(button.dataset.mission); selectedFighter = season.missions[missionIndex].playable[0]; selectedWeapon = ''; selectedOutfit = 'normal'; renderMission(); }));
  selectScreen.querySelectorAll('[data-fighter]').forEach((button) => button.addEventListener('click', () => { selectedFighter = button.dataset.fighter; selectedWeapon = ''; selectedOutfit = 'normal'; renderMission(); }));
  selectScreen.querySelector('#outfit-choice')?.addEventListener('change', (event) => { selectedOutfit = event.target.value; renderMission(); });
  selectScreen.querySelector('#weapon-choice').addEventListener('change', (event) => { selectedWeapon = event.target.value; });
  selectScreen.querySelector('#begin-mission').addEventListener('click', startMission);
}

async function startMission() {
  const mission = currentMission();
  if (!mission.playable.includes(selectedFighter)) return setStatus('Combatiente no permitido para esta misión.');
  if (mission.required_player_outfit && !isUnlocked(selectedFighter, mission.required_player_outfit)) return setStatus('Completa Alma dual para desbloquear Zichiz Maligno.');
  try {
    setStatus(interfaceConfig.loading_text);
    selectScreen.hidden = true; battleScreen.hidden = false; restScreen.hidden = true;
    engine = new FightingEngine(document.querySelector('#battle-canvas'), (canvas, fighters, camera, config) => {
      renderBattle(canvas, fighters, camera, config);
      renderHud(document.querySelector('#p1-hud'), fighters[0]); renderHud(document.querySelector('#p2-hud'), fighters[1]);
    }, showRest, { cpuOpponent: true });
    await engine.initialize([selectedFighter, mission.opponent], [selectedWeapon, roster[mission.opponent].fighter.default_weapon], [selectedOutfit, mission.opponent_outfit ?? 'normal']);
    document.querySelector('#round-label').textContent = `MISIÓN ${missionIndex + 1} · ${mission.title}`;
    setStatus(''); engine.start();
  } catch (error) {
    engine?.stop(); battleScreen.hidden = true; selectScreen.hidden = false;
    setStatus(`No se pudo iniciar la misión: ${error.message}`);
  }
}

function showRest(result) {
  lastWon = result.winner === 'p1';
  const completed = currentMission();
  if (lastWon) {
    for (const entry of completed.unlock_on_victory ?? []) unlockedOutfits.add(entry);
    missionIndex = Math.min(missionIndex + 1, season.missions.length);
    try { saves.save(progress()); } catch { /* Saving is also available from the rest menu. */ }
  }
  const finished = missionIndex >= season.missions.length;
  const next = finished ? null : season.missions[missionIndex];
  battleScreen.hidden = true; restScreen.hidden = false;
  restScreen.innerHTML = `<section class="rest-card"><p class="eyebrow">${lastWon ? 'VICTORIA' : 'DERROTA'}</p><h1>${finished ? 'Temporada completada' : lastWon ? 'Zona de descanso' : 'Reintentar misión'}</h1><p>${finished ? 'Has completado las nueve misiones de la Temporada 1.' : lastWon ? `Siguiente: ${next.title}` : 'La misión sigue disponible. Ajusta tu equipo e inténtalo de nuevo.'}</p>
    ${lastWon && completed.unlock_on_victory?.length ? '<p class="unlock-notice">¡Outfit desbloqueado: Zichiz Maligno!</p>' : ''}
    <div class="rest-actions">${!finished ? `<button id="continue-story" class="primary">${lastWon ? 'Seguir la historia' : 'Reintentar'}</button>` : ''}<button id="save-game" class="secondary">Guardar partida</button><button id="main-menu" class="secondary">Salir al menú principal</button></div><p id="save-status" role="status"></p></section>`;
  document.querySelector('#continue-story')?.addEventListener('click', () => {
    if (lastWon && missionIndex < season.missions.length) {
      const nextMission = currentMission();
      if (!nextMission.playable.includes(selectedFighter)) selectedFighter = nextMission.playable[0];
      selectedWeapon = ''; selectedOutfit = nextMission.required_player_outfit ?? 'normal';
    }
    renderMission(); restScreen.hidden = true; selectScreen.hidden = false;
  });
  document.querySelector('#save-game').addEventListener('click', () => {
    try { saves.save(progress()); document.querySelector('#save-status').textContent = interfaceConfig.save_success_text; }
    catch { document.querySelector('#save-status').textContent = interfaceConfig.save_error_text; }
  });
  document.querySelector('#main-menu').addEventListener('click', () => { restScreen.hidden = true; selectScreen.hidden = false; renderHome(); });
}

function progress() {
  return { missionIndex: Math.min(missionIndex, season.missions.length - 1), selectedFighter, selectedWeapon, selectedOutfit, unlockedOutfits: [...unlockedOutfits] };
}

function setStatus(message) { status.textContent = message; }

async function boot() {
  catalog = await loadJson('data/catalog.json');
  [season, roster, outfits, interfaceConfig] = await Promise.all([
    loadJson(catalog.story_season_1), loadJson(catalog.story_roster),
    loadJson(catalog.story_outfits), loadJson(catalog.interface_config ?? 'data/interface.json')
  ]);
  const save = saves.load();
  if (save) unlockedOutfits = new Set(save.unlockedOutfits ?? []);
  renderHome();
}

document.querySelector('#return-select').addEventListener('click', () => { engine?.stop(); battleScreen.hidden = true; selectScreen.hidden = false; renderHome(); });
boot().catch((error) => { setStatus(`Error al iniciar: ${error.message}`); });
