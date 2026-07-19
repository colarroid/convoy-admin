'use client'

import { useEffect, useState } from 'react'

const name = (p: any) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Unknown'
const initial = (p: any) => (p?.first_name?.[0] ?? p?.last_name?.[0] ?? '?').toUpperCase()
const shortDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Passengers({ approved }: { approved: any[] }) {
  return (
    <div>
      <p className="mb-2 mono-label">
        {approved.length > 0 ? `Passengers on board (${approved.length})` : 'No approved passengers'}
      </p>
      {approved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {approved.map((j: any, idx: number) => (
            <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-neutral py-1 pl-1 pr-3 text-xs text-primary">
              <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-subtle text-[10px] font-semibold text-secondary">
                {j.rider?.photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={j.rider.photo_url} alt="" className="h-full w-full object-cover" />
                  : initial(j.rider)}
              </span>
              {name(j.rider)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function meta(f: any) {
  const bits: string[] = []
  if (f.trip?.depart_date) {
    bits.push(`Ride ${new Date(f.trip.depart_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${f.trip.depart_time ? `, ${f.trip.depart_time}` : ''}`)
  }
  if (f.trip?.pickup_point) bits.push(f.trip.pickup_point)
  return bits
}

export default function FeedbackList({ items }: { items: any[] }) {
  const [open, setOpen] = useState<any | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div className="-mx-7 grid gap-px border-b border-border bg-border sm:grid-cols-2">
        {items.map((f: any) => {
          const approved = (f.trip?.join_requests ?? []).filter((j: any) => j.status === 'approved')
          return (
            <button
              key={f.id}
              onClick={() => setOpen({ ...f, approved })}
              className="h-full bg-surface p-7 text-left transition-colors hover:bg-subtle/50"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-mono text-[13px] font-bold uppercase tracking-[0.025em] text-primary">{name(f.host)}</p>
                <span className="shrink-0 text-[11px] text-secondary">{shortDate(f.created_at)}</span>
              </div>
              <p className="mono-label mt-1">{f.trip?.community?.name ?? 'No community'}</p>
              <p className="mt-4 line-clamp-2 text-sm text-primary">
                {f.reason ? f.reason : <span className="italic text-secondary">No note left</span>}
              </p>
              <p className="mt-4 mono-label">
                {approved.length > 0 ? `${approved.length} on board` : 'No passengers'} · View
              </p>
            </button>
          )
        })}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
          onClick={() => setOpen(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto border border-border bg-surface"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div className="min-w-0">
                <p className="font-mono text-[13px] font-bold uppercase tracking-[0.025em] text-primary">{name(open.host)}</p>
                <p className="mono-label mt-1">{open.trip?.community?.name ?? 'No community'}</p>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.10em] text-secondary transition-colors hover:text-primary"
              >
                Close
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <p className="mb-2 mono-label">Reason</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary">
                  {open.reason ? open.reason : <span className="italic text-secondary">No note left</span>}
                </p>
              </div>

              <div className="border-t border-border pt-5">
                <Passengers approved={open.approved} />
              </div>

              <div className="border-t border-border pt-5">
                <p className="mb-2 mono-label">Trip</p>
                <div className="flex flex-col gap-1 text-sm text-secondary">
                  {meta(open).map((m, i) => <span key={i} className="text-primary">{m}</span>)}
                  <span>Feedback given {shortDate(open.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
