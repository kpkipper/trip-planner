const KEY = 'jp.session'

export const storage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

// `null` is a storage event for clear().
export const isSessionKey = (key: string | null): boolean => key === null || key === KEY

export const getToken = (): string | null => {
  try {
    return storage()?.getItem(KEY) ?? null
  } catch {
    return null
  }
}

export const setToken = (token: string): void => {
  try {
    storage()?.setItem(KEY, token)
  } catch {
    // storage unavailable (private mode / quota); ignore
  }
}

export const clearToken = (): void => {
  try {
    storage()?.removeItem(KEY)
  } catch {
    // ignore
  }
}
