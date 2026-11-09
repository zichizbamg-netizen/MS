import { overlaps } from './boxes.js';

export class CombatWorld {
  constructor(fighters, config) { this.fighters = fighters; this.config = config; this.frame = 0; }

  step(inputs, dt) {
    this.frame++;
    this.fighters[0].update(inputs.p1, this.fighters[1], dt);
    this.fighters[1].update(inputs.p2, this.fighters[0], dt);
    const [a, b] = this.fighters;
    const boxA = a.collisionVolumes().pushbox; const boxB = b.collisionVolumes().pushbox;
    if (overlaps(boxA, boxB, ['pushbox'])) {
      const separation = (boxA.x + boxA.width - boxB.x) / 2;
      a.x -= separation; b.x += separation;
    }
  }
}
