export interface ClipboardDeps {
  writeText?: (text: string) => Promise<void>
  legacy?: (text: string) => boolean
}

const legacyCopy = (text: string): boolean => {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(area)
  }
}

// Copies text; true on success. Tries the async clipboard first, then execCommand.
export const copyText = async (text: string, deps: ClipboardDeps = {}): Promise<boolean> => {
  const writeText =
    deps.writeText ??
    (typeof navigator !== 'undefined' && navigator.clipboard?.writeText
      ? (t: string) => navigator.clipboard.writeText(t)
      : undefined)
  if (writeText) {
    try {
      await writeText(text)
      return true
    } catch {
      // fall through to the legacy path
    }
  }
  try {
    return (deps.legacy ?? legacyCopy)(text)
  } catch {
    return false
  }
}
