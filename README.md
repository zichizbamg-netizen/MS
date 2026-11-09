# Mystery Souls — Data-Driven 2D Fighting Engine

## Estructura canónica del proyecto

```text
MS/
├── index.html
├── ui/                 # Menú, selección, HUD, descanso y renderizado
├── engine/             # Carga de datos, input, simulación y coordinación
├── assets/             # Sprites, retratos, audio y fondos
├── data/               # Catálogos y configuración de interfaz/IA
├── characters/         # Datos y recursos propios de cada personaje
├── weapons/            # Arma, moveset, frame data, animaciones, efectos y audio
├── stages/             # Escenarios y configuración de combate
├── story/              # Campañas y misiones
├── save/               # Guardado local
├── combat/             # Sistemas de combate
└── camera/             # Cámara 2D
```

Los personajes principales viven en `characters/<id>/` y se cargan desde `data/catalog.json` (`characters`). El runtime busca los datos de personajes en esa carpeta; la simulación y las reglas de combate permanecen separadas en `engine/` y `combat/`. Los registros de personajes secundarios de la historia siguen temporalmente en `data/story_roster.json` hasta su migración al mismo formato.

## Ejecutar

Desde la raíz del repositorio, ejecuta `python -m http.server 8000` y abre `http://localhost:8000`. No abras `index.html` con `file://`: el navegador debe servir los módulos y JSON por HTTP.

Los cambios de arma solo se realizan en la selección/descanso entre combates. La campaña está definida en `story/season_1.json`; escenario y controles de combate, en `stages/`.

## Estado

Esta estructura organiza los datos y las rutas. No implica que todos los personajes, sprites, movimientos, escenarios, IA avanzada o funciones online estén ya completos o probados. Los archivos de imagen referenciados son recursos previstos; agrega los assets reales para sustituir los placeholders de Canvas.
