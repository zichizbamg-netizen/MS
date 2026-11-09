export class Camera2D {
  constructor(config, stage) { this.config = config; this.stage = stage; this.x = stage.width / 2; this.zoom = config.base_zoom; this.shake = 0; }
  update(fighters, dt, viewportWidth) {
    const [a, b] = fighters;
    const midpoint = (a.x + b.x) / 2;
    const distance = Math.abs(a.x - b.x);
    const targetZoom = Math.max(this.config.min_zoom, Math.min(this.config.max_zoom, (viewportWidth - this.config.padding) / Math.max(distance + 250, 1)));
    this.x += (midpoint - this.x) * Math.min(1, dt * 5);
    this.zoom += (targetZoom - this.zoom) * Math.min(1, dt * 3);
    this.shake = Math.max(0, this.shake - this.config.shake_decay * dt);
  }
}
