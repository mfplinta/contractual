import { useMemo } from 'react';
import Fuse, { IFuseOptions } from 'fuse.js';

export interface UseFuseReturn<T> {
  (query: string): T[];
  fuse: Fuse<T>;
  items: T[];
}

export function useFuse<T>(
  items: T[],
  keys: IFuseOptions<T>['keys'],
  opts?: Omit<IFuseOptions<T>, 'keys'>
): UseFuseReturn<T> {
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        threshold: 0.35,
        ignoreLocation: true,
        useExtendedSearch: true,
        ...opts,
        keys,
      }),
    [items]
  );

  const result = useMemo(() => {
    const search = (query: string): T[] => {
      if (!query) return items;
      return fuse.search(query).map((r) => r.item);
    };
    search.fuse = fuse;
    search.items = items;
    return search as UseFuseReturn<T>;
  }, [fuse, items]);

  return result;
}
