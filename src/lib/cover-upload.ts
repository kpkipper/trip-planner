import { completeCoverUpload, startCoverUpload } from '@/api/cover'
import { MAX_PHOTO_BYTES, putFile } from '@/lib/moment-upload'

const TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Messages from our own file check: shown as they are.
const WRONG_TYPE = 'Use a JPEG, PNG or WebP photo'
const TOO_LARGE = 'The photo must be 10 MB or smaller'
const EMPTY = 'That file is empty'
const OWN_MESSAGES = [WRONG_TYPE, TOO_LARGE, EMPTY]

/** Why `file` can't be a cover, or null when it can. */
export const coverFileError = (file: Pick<File, 'type' | 'size'>): string | null => {
  if (!TYPES.includes(file.type)) return WRONG_TYPE
  if (file.size <= 0) return EMPTY
  if (file.size > MAX_PHOTO_BYTES) return TOO_LARGE
  return null
}

export interface CoverUploadDeps {
  start: typeof startCoverUpload
  put: typeof putFile
  complete: typeof completeCoverUpload
}

const defaultDeps: CoverUploadDeps = {
  start: startCoverUpload,
  put: putFile,
  complete: completeCoverUpload,
}

/** Uploads `file` as the trip's cover and returns the new cover URL. */
export const uploadCover = async (
  slug: string,
  file: File,
  onProgress: (fraction: number) => void,
  deps: CoverUploadDeps = defaultDeps,
): Promise<string> => {
  const problem = coverFileError(file)
  if (problem) throw new Error(problem)
  const { upload_id, upload } = await deps.start(slug, {
    content_type: file.type,
    size_bytes: file.size,
  })
  await deps.put(upload, file, onProgress)
  const { cover_url } = await deps.complete(slug, upload_id)
  return cover_url
}

export const coverErrorMessage = (err: unknown): string => {
  if (err instanceof Error && OWN_MESSAGES.includes(err.message)) return err.message
  const res = (err as { response?: { status?: number; data?: { message?: string } } } | null)
    ?.response
  const msg = res?.data?.message ?? ''
  switch (res?.status) {
    case 400:
      if (msg.includes('unsupported')) return WRONG_TYPE
      if (msg.includes('dimensions')) return 'That photo is too big. Try a smaller one'
      if (msg.includes('too large')) return TOO_LARGE
      break
    case 403:
    case 404:
      return 'Only the trip owner can change the cover'
    case 409:
      return 'The cover changed at the same time. Please try again'
    case 429:
      return 'Too many uploads. Please try again later'
  }
  return "Couldn't update the cover. Please try again"
}
