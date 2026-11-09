# Mystery Souls character and weapon database

Official structured data for Mystery Souls characters, transformations, weapons, and gameplay configuration. Character-owned data and weapon-owned combat data are kept separate.

## Ownership rules

- **Characters** own their story, base statistics, passives, transformations, and Ultimate.
- **Weapons** own their combat style, movesets (combos, attacks, and specials), and weapon statistics.
- **Transformations** can modify character stats or equipment access. They do not replace the character's Ultimate.
- `golden_sword` is a weapon available only to Zichiz in `golden_mode` and Yulis in `golden_mode`. Its combat style remains owned by the sword.
- **Combat rules** define how the engine resolves actions and combine character, transformation, and weapon data without moving ownership between them.
- **Interface configuration** describes how battle information and character selection are presented; it does not own combat values.
- The game engine owns runtime systems such as collisions, damage calculation, AI, and camera behavior.

## Layout

- `characters/` — character records and their transformation data.
- `weapons/` — weapon records.
- `systems/` — proposed, tunable combat rules for the game engine.
- `interface/` — battle HUD and character-selection interface specifications.
- `schemas/` — JSON Schemas for validating records and configurations.
- `templates/` — starter records.

Combat and interface values in `systems/` and `interface/` are initial design defaults, not character or weapon facts. Tune them through playtesting. Fields whose game content has not yet been specified remain empty or are explicitly marked as proposals.
