const KEY = 'jp.session'

const storage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

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
