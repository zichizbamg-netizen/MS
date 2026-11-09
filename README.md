# Mystery Souls — Data-Driven 2D Fighting Engine

## Estructura canónica del proyecto

```text
MS/
├── index.html
├── ui/                 # Menú, selección, HUD, descanso y renderizado
├── engine/             # Carga de datos, input, simulación y coordinación
├── assets/             # Sprites, retratos, audio y fondos
├── data/               # Catálogos y configuración de interfaz/IA
├── characters/         # Datos de personajes separados por responsabilidad
├── weapons/            # Arma, moveset, frame data, animaciones, efectos y audio
├── stages/             # Escenarios y configuración de combate
├── story/              # Campañas y misiones
├── save/               # Guardado local
├── combat/             # Sistemas de combate
└── camera/             # Cámara 2D
```

Personajes principales: `characters/<id>/character.json`, `stats.json`, `ultimate.json`, `transformations.json` y `outfits.json`. El motor los carga desde el catálogo; los datos de armas siguen separados de los personajes. Los personajes de historia que todavía no tienen directorio usan temporalmente `data/story_roster.json` hasta migrarse con el mismo formato.

## Ejecutar

Desde la raíz del repositorio, ejecuta `python -m http.server 8000` y abre `http://localhost:8000`. No abras `index.html` con `file://`: el navegador debe servir los módulos y JSON por HTTP.

Los cambios de arma solo se realizan en la selección/descanso entre combates. La campaña está definida en `story/season_1.json`; escenario y controles de combate, en `stages/`.

## Estado

Esta estructura organiza los datos y las rutas. No implica que todos los personajes, sprites, movimientos, escenarios, IA avanzada o funciones online estén ya completos o probados. Los archivos de imagen referenciados son recursos previstos; agrega los assets reales para sustituir los placeholders de Canvas.
