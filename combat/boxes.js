const makeBox = (kind, x, y, width, height) => ({ kind, x, y, width, height });
export const pushbox = (...args) => makeBox('pushbox', ...args);
export const hurtbox = (...args) => makeBox('hurtbox', ...args);
export const hitbox = (...args) => makeBox('hitbox', ...args);
export const grabbox = (...args) => makeBox('grabbox', ...args);
export const projectileBox = (...args) => makeBox('projectilebox', ...args);

export function overlaps(a, b, allowedKinds) {
  if (!allowedKinds.includes(a.kind) || !allowedKinds.includes(b.kind)) return false;
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function worldBox(originX, originY, facing, definition, kind) {
  const x = definition.x * facing;
  return makeBox(kind, originX + (x < 0 ? x - definition.width : x), originY + definition.y, definition.width, definition.height);
}
