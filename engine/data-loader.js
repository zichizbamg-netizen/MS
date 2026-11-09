const PROJECT_ROOT = new URL('../', import.meta.url);
const resolveProjectPath = (path) => new URL(path.replace(/^\.\//, ''), PROJECT_ROOT);

export async function loadJson(path) {
  const url = resolveProjectPath(path);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url.pathname} (${response.status})`);
  return response.json();
}

export async function loadCharacterBundle(directory) {
  const files = ['fighter', 'stats', 'ultimate', 'forms', 'passives', 'outfits', 'voice'];
  const entries = await Promise.all(files.map(async (name) => [name, await loadJson(`${directory}/${name}.json`)]));
  return Object.fromEntries(entries);
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
    return file.json();
  };
  const [moveset, framedata, animations, effects, sounds] = await Promise.all(
    ['moveset', 'framedata', 'animations', 'effects', 'sounds'].map(read)
  );
  if (!moveset.attacks || !framedata.moves) throw new Error(`Invalid combat data for weapon ${weapon.id}`);
  return { weapon, moveset, framedata, animations, effects, sounds };
}
