import { loadJson, loadCharacterBundle } from '../engine/data-loader.js';
import { FightingEngine } from '../engine/engine.js';
import { renderBattle, renderHud } from './renderer.js';

const selectScreen = document.querySelector('#select-screen');
const battleScreen = document.querySelector('#battle-screen');
const status = document.querySelector('#status');
let engine;

async function boot() {
  const catalog = await loadJson('../data/catalog.json');
  const entries = await Promise.all(catalog.fighters.map(async (entry) => ({ entry, bundle: await loadCharacterBundle(entry.data.replace(/\/fighter\.json$/, '')) })));
  let mode = 'story'; let selected = [entries[0].entry.id, entries[1].entry.id];
  const renderSelection = () => {
    const cards = entries.map(({ entry, bundle }) => `<button class="fighter-card ${selected.includes(entry.id) ? 'selected' : ''}" data-fighter="${entry.id}"><span class="portrait">${bundle.fighter.name.slice(0, 1)}</span><strong>${bundle.fighter.name}</strong><small>${bundle.fighter.title}</small></button>`).join('');
    selectScreen.innerHTML = `<nav class="mode-tabs"><button data-mode="story" class="${mode === 'story' ? 'active' : ''}">Historia</button><button data-mode="pvp" class="${mode === 'pvp' ? 'active' : ''}">PvP</button><button data-mode="pvpc" class="${mode === 'pvpc' ? 'active' : ''}">PvPC</button></nav><div class="selection-layout ${mode !== 'story' ? 'versus' : ''}"><section class="selection-info"><h1>${mode === 'story' ? 'Selecciona un personaje' : 'Elige combatientes'}</h1><p>${mode === 'story' ? 'Historia · perfil · armas disponibles' : 'Los combatientes seleccionados aparecen arriba'}</p><div class="roster">${cards}</div></section><section class="selection-preview">${mode === 'story' ? `<div class="hero-placeholder">${selected[0]}</div><h2>${entries.find(x => x.entry.id === selected[0]).bundle.fighter.name}</h2>` : `<div class="versus-slots"><div>${selected[0]}</div><div>${mode === 'pvp' ? selected[1] : 'CPU'}</div></div><div class="roster bottom-roster">${cards}</div>`}<button id="start-battle" class="primary">Comenzar combate local</button></section></div>`;
    selectScreen.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => { mode = button.dataset.mode; renderSelection(); }));
    selectScreen.querySelectorAll('[data-fighter]').forEach((button) => button.addEventListener('click', () => {
      const id = button.dataset.fighter;
      if (mode === 'story') selected[0] = id;
      else if (selected[0] === id) selected[1] = id;
      else if (selected[1] === id) selected[0] = id;
      else selected = [id, selected[0]];
      renderSelection();
    }));
    selectScreen.querySelector('#start-battle').addEventListener('click', async () => {
      try {
        status.textContent = 'Cargando combate…';
        engine = new FightingEngine(document.querySelector('#battle-canvas'), (canvas, fighters, camera, config) => {
          renderBattle(canvas, fighters, camera, config);
          renderHud(document.querySelector('#p1-hud'), fighters[0]);
          renderHud(document.querySelector('#p2-hud'), fighters[1]);
        });
        await engine.initialize(selected); selectScreen.hidden = true; battleScreen.hidden = false; status.textContent = ''; engine.start();
      } catch (error) { status.textContent = error.message; }
    });
  };
  renderSelection();
}

document.querySelector('#return-select').addEventListener('click', () => { engine?.stop(); battleScreen.hidden = true; selectScreen.hidden = false; });
boot().catch((error) => { status.textContent = error.message; });
