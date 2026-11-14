'use client'

import { useRef, useState } from 'react'

import { ImagePlus, Trash2 } from 'lucide-react'

import { removeCover } from '@/api/cover'
import { useToast } from '@/contexts/toast-context'
import { coverGradient } from '@/lib/cover-gradient'
import { coverErrorMessage, uploadCover } from '@/lib/cover-upload'
import { errorSummary } from '@/lib/error-summary'
import { safeMediaUrl } from '@/lib/safe-url'
import { buttonClass, cn, labelClass } from '@/lib/ui-classes'

interface Props {
  slug: string
  coverUrl: string | undefined
  // Refetch the trip after the cover changed.
  onChanged: () => void
}

// Owner-only: upload a cover photo or remove it. Saved at once (not with the settings form).
// Without a cover the trip shows its slug gradient, as previewed here.
export default function CoverPicker({ slug, coverUrl, onChanged }: Props) {
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [removing, setRemoving] = useState(false)
  const busy = progress !== null || removing
  const cover = safeMediaUrl(coverUrl)

  const onFile = async (file: File | undefined) => {
    if (!file || busy) return
    setProgress(0)
    try {
      await uploadCover(slug, file, setProgress)
      showToast('Cover updated')
      onChanged()
    } catch (err) {
      showToast(coverErrorMessage(err), 'error')
      console.error('Cover upload failed:', errorSummary(err))
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onRemove = async () => {
    if (busy) return
    setRemoving(true)
    try {
      await removeCover(slug)
      showToast('Cover removed')
      onChanged()
    } catch (err) {
      showToast(coverErrorMessage(err), 'error')
      console.error('Cover remove failed:', errorSummary(err))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div>
      <span className={cn(labelClass, 'mb-1.5 block')}>Cover image</span>
      <div
        className="relative aspect-[16/7] w-full overflow-hidden rounded-tile bg-chip"
        style={{ backgroundImage: coverGradient(slug) }}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- static export, signed remote cover
          <img
            src={cover}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {progress !== null && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium leading-normal text-white"
          >
            {progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : 'Processing…'}
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs leading-normal text-muted">
        {cover
          ? 'Shown at the top of the trip and on trip cards.'
          : 'No photo yet: the trip uses this colour. JPEG, PNG or WebP, up to 10 MB.'}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={buttonClass('secondary', 'sm')}
        >
          <ImagePlus size={15} />
          {cover ? 'Change photo' : 'Upload photo'}
        </button>
        {cover && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className={cn(buttonClass('ghost', 'sm'), 'text-danger hover:text-danger')}
          >
            <Trash2 size={15} />
            {removing ? 'Removing…' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  )
}
