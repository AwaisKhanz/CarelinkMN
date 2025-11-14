export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

export function sortBy<T>(array: T[], keyFn: (item: T) => string | number): T[] {
  return [...array].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    return 0;
  });
}

export function sortByDesc<T>(array: T[], keyFn: (item: T) => string | number): T[] {
  return sortBy(array, keyFn).reverse();
}

export function filterBy<T>(array: T[], predicate: (item: T) => boolean): T[] {
  return array.filter(predicate);
}

export function findById<T extends { id: string }>(array: T[], id: string): T | undefined {
  return array.find(item => item.id === id);
}

export function findIndexById<T extends { id: string }>(array: T[], id: string): number {
  return array.findIndex(item => item.id === id);
}

export function removeById<T extends { id: string }>(array: T[], id: string): T[] {
  return array.filter(item => item.id !== id);
}

export function updateById<T extends { id: string }>(
  array: T[],
  id: string,
  updates: Partial<T>
): T[] {
  return array.map(item => 
    item.id === id ? { ...item, ...updates } : item
  );
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sample<T>(array: T[], count: number = 1): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, count);
}

export function intersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => array2.includes(item));
}

export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter(item => !array2.includes(item));
}

export function union<T>(array1: T[], array2: T[]): T[] {
  return unique([...array1, ...array2]);
}

export function flatten<T>(array: (T | T[])[]): T[] {
  return array.reduce<T[]>((flat, item) => 
    flat.concat(Array.isArray(item) ? flatten(item) : item), []
  );
}

export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }
  
  return [truthy, falsy];
}
