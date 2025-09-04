export function createAsyncState<T>(initial: T | null = null) {
  return { data: initial as T | null, loading: false as boolean, error: null as unknown };
}
