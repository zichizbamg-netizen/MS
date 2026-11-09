export class InputManager {
  constructor(mappings) {
    this.mappings = mappings;
    this.down = new Set();
    this.previous = new Set();
    window.addEventListener('keydown', (event) => { this.down.add(event.code); if (event.code.startsWith('Arrow')) event.preventDefault(); });
    window.addEventListener('keyup', (event) => this.down.delete(event.code));
  }

  beginFrame() { this.previous = new Set(this.down); }

  read(player) {
    const map = this.mappings[player];
    const pressed = (action) => this.down.has(map[action]);
    const justPressed = (action) => pressed(action) && !this.previous.has(map[action]);
    return {
      left: pressed('left'), right: pressed('right'), jump: justPressed('jump'),
      light: justPressed('light'), heavy: justPressed('heavy'), ultimate: justPressed('ultimate'),
      block: pressed('block')
    };
  }
}
