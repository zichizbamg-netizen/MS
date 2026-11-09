export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const approach = (value, target, amount) => value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
