# Mystery Souls — Data-Driven 2D Fighting Engine

A browser-native, modular fighting-engine foundation using HTML Canvas, ES modules, JSON data, Web Audio, Gamepad API, and LocalStorage. No framework or game engine dependencies.

## Run

Serve the repository root over HTTP (ES modules and `fetch()` do not work reliably from `file://`), then open `index.html`. For example: `python -m http.server 8000` and visit `http://localhost:8000`.

## Layout

- `engine/` runtime orchestration and JSON loading.
- `combat/` fighter composition, typed collision volumes, and deterministic fixed-step combat simulation.
- `physics/`, `camera/`, `ui/`, `audio/`, `save/` focused runtime systems.
- `fighters/` character-owned data, split into the requested files.
- `weapons/` weapon-owned movesets, frame data, animation/effect/sound metadata.
- `data/` catalog and engine tuning JSON.
- `assets/` runtime asset location; image references are data-driven and may be added when assets are available.

The runtime is a reusable starting engine, not a finished production game. Rollback networking, full animation playback, projectile/assist gameplay, AI behaviors, and comprehensive combat mechanics still require implementation and tests. The simulation exposes frame-based inputs and fixed updates to support those additions.

## Ownership invariant

Fighters own identity, stats, forms, passives, outfits, and Ultimate. Weapons own style, moves, frame data, hitboxes, animation/effect/sound references. The engine composes these records at runtime and never transfers weapon style or Ultimate ownership.
