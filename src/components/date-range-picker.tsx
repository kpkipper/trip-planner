'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

import {
  addDays,
  addMonthsClamped,
  cellState,
  type DateRange,
  formatDateLong,
  formatDateShort,
  isOutOfRange,
  monthGrid,
  monthOf,
  type MonthRef,
  monthTitle,
  pickDate,
  rangeSummary,
  shiftMonth,
  todayISO,
  WEEKDAYS,
} from '@/lib/date-range'
import { buttonClass, cn, fieldErrorClass, labelClass } from '@/lib/ui-classes'
import { useModalA11y } from '@/lib/use-modal-a11y'

interface Props {
  start: string
  end: string
  /** Called once with both dates when a full range is picked. */
  onChange: (start: string, end: string) => void
  startError?: string
  endError?: string
}

const DESKTOP = '(min-width: 640px)'
const visibleMonths = () =>
  typeof window !== 'undefined' && window.matchMedia(DESKTOP).matches ? 2 : 1

const inView = (date: string, view: MonthRef, count: number) => {
  const m = monthOf(date)
  const diff = (m.year - view.year) * 12 + (m.month - view.month)
  return diff >= 0 && diff < count
}

// Range picker in the style of hotel booking sites: one field with Start | End halves
// opens a calendar (two months on desktop, one month in a bottom sheet on mobile).
// The first tap picks the start, the second the end; the range is applied and the
// calendar closes. Closing before the end is picked keeps the old dates.
export default function DateRangePicker({ start, end, onChange, startError, endError }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange>({ start, end })
  const [view, setView] = useState<MonthRef>(() => monthOf(start || todayISO()))
  const [hover, setHover] = useState<string | undefined>()
  const [focusDate, setFocusDate] = useState(start || todayISO())
  const [today] = useState(todayISO)
  const panelRef = useRef<HTMLDivElement>(null)
  const focusRef = useRef<HTMLButtonElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const moveFocus = useRef(false)
  const noteId = useId()

  const close = () => {
    setOpen(false)
    setHover(undefined)
  }
  useModalA11y(panelRef, { open, onClose: close, initialFocus: focusRef, returnFocus: triggerRef })

  // Desktop: drop down under the field, but slide up as far as needed to stay on screen
  // (page scroll is locked while the calendar is open). Mobile is a bottom sheet via CSS,
  // so any inline position is cleared there.
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const panel = panelRef.current
      const trigger = triggerRef.current
      if (!panel || !trigger) return
      if (visibleMonths() === 1) {
        panel.style.top = ''
        panel.style.left = ''
        return
      }
      const t = trigger.getBoundingClientRect()
      const gap = 16
      const top = Math.max(
        gap,
        Math.min(t.bottom + 8, window.innerHeight - panel.offsetHeight - gap),
      )
      const left = Math.max(
        gap,
        Math.min(
          t.left + t.width / 2 - panel.offsetWidth / 2,
          window.innerWidth - panel.offsetWidth - gap,
        ),
      )
      panel.style.top = `${top}px`
      panel.style.left = `${left}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  // Keyboard moves focus to the new day once it has rendered.
  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    focusRef.current?.focus()
  }, [focusDate, view])

  const openPicker = () => {
    const first = start || todayISO()
    setDraft({ start, end })
    setView(monthOf(first))
    setFocusDate(first)
    setOpen(true)
  }

  const pick = (date: string) => {
    const next = pickDate(draft, date)
    setFocusDate(date)
    if (next.done) {
      onChange(next.start, next.end)
      close()
      return
    }
    setDraft({ start: next.start, end: next.end })
  }

  const onGridKey = (e: React.KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    // Move from the day that has focus (the view may have changed since focusDate was set).
    const from = (e.target as HTMLElement).dataset?.date ?? focusDate
    let next: string | undefined
    if (e.key in step) next = addDays(from, step[e.key])
    else if (e.key === 'PageUp' || e.key === 'PageDown')
      next = addMonthsClamped(from, e.key === 'PageUp' ? -1 : 1)
    if (!next) return
    e.preventDefault()
    const count = visibleMonths()
    if (!inView(next, view, count)) {
      setView(next < from ? monthOf(next) : shiftMonth(monthOf(next), 1 - count))
    }
    moveFocus.current = true
    setFocusDate(next)
  }

  const months = [view, shiftMonth(view, 1)]
  // The one day button in the tab order: the focused day if shown, else the 1st of the view.
  // (The second month is hidden by CSS on mobile, so only count what is visible.)
  const tabbable = inView(focusDate, view, visibleMonths())
    ? focusDate
    : `${view.year}-${String(view.month + 1).padStart(2, '0')}-01`
  const choosingEnd = draft.start !== '' && draft.end === ''
  const summary = rangeSummary(start, end)
  const hint = choosingEnd ? 'Now pick the last day of the trip' : 'Pick the first day of the trip'

  return (
    <div className="relative">
      <div className="mb-1.5 grid grid-cols-2 gap-4">
        <span className={labelClass}>Start Date</span>
        <span className={labelClass}>End Date</span>
      </div>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Trip dates. Start date: ${start ? formatDateLong(start) : 'not set'}. End date: ${end ? formatDateLong(end) : 'not set'}`}
        aria-describedby={summary || startError || endError ? noteId : undefined}
        onClick={openPicker}
        className={cn(
          'grid w-full grid-cols-2 rounded-tile bg-chip text-left transition hover:bg-[#e8e8e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          (startError || endError) && fieldErrorClass,
          open && 'ring-2 ring-accent',
        )}
      >
        <DateHalf value={start} />
        <DateHalf value={end} divider />
      </button>
      {summary && !startError && !endError && (
        <p id={noteId} className="mt-1.5 text-xs leading-normal text-muted">
          {summary}
        </p>
      )}
      {(startError || endError) && (
        <p id={noteId} className="mt-1 text-xs leading-normal text-danger">
          {startError || endError}
        </p>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 sm:bg-transparent" onClick={close} />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Choose trip dates"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-card bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-soft sm:inset-x-auto sm:bottom-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[min(640px,calc(100vw-2rem))] sm:rounded-card sm:p-5 sm:shadow-[0_12px_40px_rgb(17_17_17/0.16)]"
          >
            <div className="mb-3 flex items-center justify-between sm:hidden">
              <h2 className="text-base font-semibold leading-normal text-ink">Trip dates</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className={cn(buttonClass('ghost', 'sm'), 'p-2')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <DraftTile label="Start" value={draft.start} active={!choosingEnd} />
              <DraftTile label="End" value={draft.end} active={choosingEnd} />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setView((v) => shiftMonth(v, -1))}
                aria-label="Previous month"
                className={cn(buttonClass('ghost', 'sm'), 'absolute left-0 top-0 p-2')}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setView((v) => shiftMonth(v, 1))}
                aria-label="Next month"
                className={cn(buttonClass('ghost', 'sm'), 'absolute right-0 top-0 p-2')}
              >
                <ChevronRight size={18} />
              </button>

              <div
                className="grid gap-6 sm:grid-cols-2"
                onKeyDown={onGridKey}
                onMouseLeave={() => setHover(undefined)}
              >
                {months.map((m, i) => (
                  <table
                    key={`${m.year}-${m.month}`}
                    className={cn('w-full border-collapse', i === 1 && 'hidden sm:table')}
                  >
                    <caption className="pb-3 pt-1.5 text-center text-sm font-semibold leading-normal text-ink">
                      {monthTitle(m.year, m.month)}
                    </caption>
                    <thead>
                      <tr>
                        {WEEKDAYS.map((w) => (
                          <th
                            key={w.long}
                            scope="col"
                            abbr={w.long}
                            className="pb-1 text-center text-xs font-medium leading-normal text-muted"
                          >
                            {w.short}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthGrid(m.year, m.month).map((week, wi) => (
                        <tr key={wi}>
                          {week.map((date, di) =>
                            date ? (
                              <DayCell
                                key={date}
                                date={date}
                                state={cellState(date, draft, hover)}
                                today={date === today}
                                tooFar={isOutOfRange(date, draft)}
                                tabbable={date === tabbable}
                                buttonRef={date === tabbable ? focusRef : undefined}
                                onPick={pick}
                                onHover={setHover}
                              />
                            ) : (
                              <td key={`pad-${di}`} />
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <p aria-live="polite" className="text-sm leading-normal text-muted">
                {hint}
              </p>
              <button type="button" onClick={close} className={buttonClass('secondary', 'sm')}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DateHalf({ value, divider }: { value: string; divider?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2 px-4 py-2.5', divider && 'border-l border-line')}>
      <CalendarDays size={16} className="shrink-0 text-muted" aria-hidden />
      <span
        className={cn(
          'truncate text-sm leading-normal',
          value ? 'font-medium text-ink' : 'text-muted',
        )}
      >
        {value ? formatDateShort(value) : 'Add date'}
      </span>
    </span>
  )
}

function DraftTile({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div
      className={cn(
        'rounded-tile px-3 py-2 ring-1 ring-inset',
        active ? 'bg-surface ring-2 ring-primary' : 'bg-chip ring-transparent',
      )}
    >
      <div className="text-xs leading-normal text-muted">{label}</div>
      <div className={cn('text-sm font-medium leading-normal', value ? 'text-ink' : 'text-muted')}>
        {value ? formatDateShort(value) : 'Add date'}
      </div>
    </div>
  )
}

interface DayCellProps {
  date: string
  state: ReturnType<typeof cellState>
  today: boolean
  /** More than MAX_TRIP_DAYS from the start: drawn dim; tapping it starts a new range. */
  tooFar: boolean
  tabbable: boolean
  buttonRef?: React.Ref<HTMLButtonElement>
  onPick: (date: string) => void
  onHover: (date: string) => void
}

function DayCell({
  date,
  state,
  today,
  tooFar,
  tabbable,
  buttonRef,
  onPick,
  onHover,
}: DayCellProps) {
  const selected = state === 'start' || state === 'end' || state === 'single'
  // The soft band behind the range; start/end cells only fill the half facing the range.
  const band =
    state === 'between'
      ? 'bg-accent-soft'
      : state === 'start'
        ? 'bg-[linear-gradient(to_right,transparent_50%,var(--color-accent-soft)_50%)]'
        : state === 'end'
          ? 'bg-[linear-gradient(to_left,transparent_50%,var(--color-accent-soft)_50%)]'
          : ''
  const role =
    state === 'start'
      ? ', trip start'
      : state === 'end'
        ? ', trip end'
        : state === 'single'
          ? ', selected'
          : ''
  return (
    <td className={cn('p-0 py-0.5', band)}>
      <button
        ref={buttonRef}
        type="button"
        data-date={date}
        tabIndex={tabbable ? 0 : -1}
        aria-pressed={selected}
        aria-label={`${formatDateLong(date)}${today ? ', today' : ''}${role}${tooFar ? ', too far for an end date' : ''}`}
        onClick={() => onPick(date)}
        onMouseEnter={() => onHover(date)}
        className={cn(
          'relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          selected ? 'bg-primary font-semibold text-white' : 'text-ink hover:bg-chip',
          today && !selected && 'font-semibold',
          tooFar && 'text-muted/50',
        )}
      >
        {Number(date.slice(8))}
        {today && (
          <span
            aria-hidden
            className={cn(
              'absolute bottom-1 h-1 w-1 rounded-full',
              selected ? 'bg-white' : 'bg-accent',
            )}
          />
        )}
      </button>
    </td>
  )
}
