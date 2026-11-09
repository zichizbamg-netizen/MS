const PROJECT_ROOT = new URL('../', import.meta.url);
const resolveProjectPath = (path) => new URL(path.replace(/^\.\//, ''), PROJECT_ROOT);

export async function loadJson(path) {
  const url = resolveProjectPath(path);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url.pathname} (${response.status})`);
  try { return await response.json(); }
  catch { throw new Error(`Invalid JSON: ${url.pathname}`); }
}

export async function loadCharacterBundle(directory) {
  const [character, stats, ultimate, transformations, outfits] = await Promise.all([
    loadJson(`${directory}/character.json`),
    loadJson(`${directory}/stats.json`),
    loadJson(`${directory}/ultimate.json`),
    loadJson(`${directory}/transformations.json`),
    loadJson(`${directory}/outfits.json`)
  ]);
  return {
    fighter: character,
    stats,
    ultimate,
    forms: transformations,
    transformations,
    outfits,
    passives: { passives: [] },
    voice: { cues: [] }
  };
}

export async function loadWeaponBundle(path) {
  const url = resolveProjectPath(path);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load weapon data: ${url.pathname} (${response.status})`);
  const weapon = await response.json();
  const folder = new URL('.', url);
  const read = async (name) => {
    const fileUrl = new URL(`${name}.json`, folder);
    const file = await fetch(fileUrl);
    if (!file.ok) throw new Error(`Could not load ${fileUrl.pathname} (${file.status}) for ${weapon.id}`);
    try { return await file.json(); }
    catch { throw new Error(`Invalid JSON: ${fileUrl.pathname}`); }
  };
  const [moveset, framedata, animations, effects, sounds] = await Promise.all(
    ['moveset', 'framedata', 'animations', 'effects', 'sounds'].map(read)
  );
  if (!moveset.attacks || !framedata.moves) throw new Error(`Invalid combat data for weapon ${weapon.id}`);
  return { weapon, moveset, framedata, animations, effects, sounds };
}
