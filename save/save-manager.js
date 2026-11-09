export class SaveManager {
  constructor(storage = globalThis.localStorage) { this.storage = storage; this.key = 'mystery-souls-season-1'; }
  load() {
    try { return JSON.parse(this.storage.getItem(this.key) ?? 'null'); }
    catch { return null; }
  }
  save(progress) {
    this.storage.setItem(this.key, JSON.stringify({ ...progress, savedAt: new Date().toISOString() }));
  }
  clear() { this.storage.removeItem(this.key); }
}
