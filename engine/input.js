export class InputManager {
  constructor(mappings) {
    this.mappings = mappings;
    this.down = new Set();
    this.previous = new Set();
    this.justPressed = new Set();
    window.addEventListener('keydown', (event) => {
      if (!this.down.has(event.code)) this.justPressed.add(event.code);
      this.down.add(event.code);
      if (event.code.startsWith('Arrow')) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => this.down.delete(event.code));
    window.addEventListener('blur', () => { this.down.clear(); this.justPressed.clear(); });
  }

  beginFrame() {
    this.previous = new Set(this.down);
  }

  read(player) {
    const map = this.mappings[player];
    const pressed = (action) => Boolean(map[action] && this.down.has(map[action]));
    const justPressed = (action) => Boolean(map[action] && this.justPressed.has(map[action]));
    const result = {
      left: pressed('left'), right: pressed('right'), jump: justPressed('jump'),
      light: justPressed('light'), heavy: justPressed('heavy'), ultimate: justPressed('ultimate'),
      block: pressed('block')
    };
    for (const action of ['jump', 'light', 'heavy', 'ultimate']) {
      if (map[action]) this.justPressed.delete(map[action]);
    }
    return result;
  }
}
