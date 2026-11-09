export class FightingAI {
  constructor(config) { this.config = config; }

  read(self, opponent, frame) {
    const command = { left: false, right: false, jump: false, light: false, heavy: false, ultimate: false, block: false };
    if (!this.config.enabled || frame % this.config.think_interval_frames !== 0 || self.health <= 0 || self.state === 'hitstun') return command;
    const distance = Math.abs(opponent.x - self.x);
    const toward = opponent.x < self.x ? 'left' : 'right';
    const away = toward === 'left' ? 'right' : 'left';
    if (opponent.attack && distance < this.config.attack_range && Math.random() < this.config.block_probability) {
      command.block = true;
      return command;
    }
    if (distance > this.config.attack_range) command[toward] = true;
    else if (distance < this.config.retreat_range && Math.random() > this.config.aggression) command[away] = true;
    if (distance <= this.config.attack_range) {
      if (self.ki / self.data.stats.ki >= this.config.ultimate_min_ki_fraction && Math.random() < 0.08) command.ultimate = true;
      else if (Math.random() < this.config.heavy_probability) command.heavy = true;
      else command.light = true;
    }
    return command;
  }
}
