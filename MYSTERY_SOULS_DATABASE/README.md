# Mystery Souls character and weapon database

Official structured data for Mystery Souls characters, transformations, and weapons. Character-owned data and weapon-owned combat data are kept separate.

## Ownership rules

- **Characters** own their story, base statistics, passives, transformations, and Ultimate.
- **Weapons** own their combat style, movesets (combos, attacks, and specials), and weapon statistics.
- **Transformations** can modify character stats or equipment access. They do not replace the character's Ultimate.
- `golden_sword` is a weapon available only to Zichiz in `golden_mode` and Yulis in `golden_mode`. Its combat style remains owned by the sword.
- The game engine owns runtime systems such as collisions, damage calculation, AI, and camera behavior.

## Layout

- `characters/` — character records and their transformation data.
- `weapons/` — weapon records.
- `schemas/` — JSON Schemas for validating records.
- `templates/` — starter records.

All values are JSON. Fields whose game content has not yet been specified are empty arrays or are omitted rather than invented.
