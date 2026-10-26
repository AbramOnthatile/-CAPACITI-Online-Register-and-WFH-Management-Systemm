const storagePrefix = 'capaciti-demo:';

export function readMockValue<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(`${storagePrefix}${key}`);
  return saved === null ? fallback : JSON.parse(saved) as T;
}

export function writeMockValue<T>(key: string, value: T) {
  localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('capaciti-demo:update', { detail: key }));
}

export function removeMockValue(key: string) {
  localStorage.removeItem(`${storagePrefix}${key}`);
  window.dispatchEvent(new CustomEvent('capaciti-demo:update', { detail: key }));
}

export function readMockCollection<T extends { id: string }>(key: string, fallback: T[]): T[] {
  return readMockValue(key, fallback);
}

export function mergeMockCollection<T extends { id: string }>(key: string, fallback: T[], updates: T[]) {
  const current = readMockCollection(key, fallback);
  const updatedById = new Map(updates.map((item) => [item.id, item]));
  const merged = current.map((item) => updatedById.get(item.id) ?? item);
  const existingIds = new Set(current.map((item) => item.id));
  updates.forEach((item) => {
    if (!existingIds.has(item.id)) merged.push(item);
  });
  writeMockValue(key, merged);
}
