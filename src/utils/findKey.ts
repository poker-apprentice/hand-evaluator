type Entries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T][];

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

export const findKey = <K extends PropertyKey, V>(
  obj: Record<K, V>,
  predicate: (v: V) => boolean,
): K | undefined => {
  const [key] = getEntries(obj).find(([_key, value]) => predicate(value)) ?? [];
  return key;
};
