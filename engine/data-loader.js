export async function loadJson(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

export async function loadCharacterBundle(directory) {
  const files = ['fighter', 'stats', 'ultimate', 'forms', 'passives', 'outfits', 'voice'];
  const entries = await Promise.all(files.map(async (name) => [name, await loadJson(`../${directory}/${name}.json`)]));
  return Object.fromEntries(entries);
}

export async function loadWeaponBundle(path) {
  const url = new URL(path, import.meta.url);
  const folder = new URL('.', url);
  const weapon = await (await fetch(url)).json();
  const read = async (name) => {
    const response = await fetch(new URL(`${name}.json`, folder));
    if (!response.ok) throw new Error(`Could not load ${name}.json for ${weapon.id}`);
    return response.json();
  };
  const [moveset, framedata, animations, effects, sounds] = await Promise.all(
    ['moveset', 'framedata', 'animations', 'effects', 'sounds'].map(read)
  );
  return { weapon, moveset, framedata, animations, effects, sounds };
}
