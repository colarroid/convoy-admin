import Link from 'next/link'

/**
 * Telemetry-sheet primitives shared across the admin. A page is a stack of
 * full-bleed panels separated by hairline rules: a PageHeader strip, optional
 * Toolbar, then Bands of stat cells or sheet tables. These break out of the
 * layout's px-7 with -mx-7 so their rules touch the sheet frame.
 */

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8">
      {/* Compact section-title strip, matching the community dashboard. */}
      <div className="-mx-7 flex items-center justify-between gap-4 border-b border-border px-7 py-3">
        <p className="strip-title">{title}</p>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {sub && <p className="mt-4 max-w-3xl text-sm text-secondary">{sub}</p>}
    </div>
  )
}

/** Full-bleed toolbar row (filters, search) with a hairline underneath. */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-7 mb-8 flex flex-wrap items-center gap-2 border-b border-border px-7 pb-4">{children}</div>
  )
}

/** Grid of stat cells with hairline rules between them (gap-px on a border bg). */
export function Band({ children, className = 'lg:grid-cols-4' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`-mx-7 mb-8 grid gap-px border-y border-border bg-border sm:grid-cols-2 ${className}`}>
      {children}
    </div>
  )
}

export function BandCell({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  const inner = (
    <div className={`h-full bg-surface p-7 ${href ? 'transition-colors hover:bg-subtle/50' : ''}`}>
      <p className="mono-label">{label}</p>
      <p className="mt-3 font-mono text-4xl font-bold tracking-tight text-primary">{value}</p>
    </div>
  )
  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

/** Section strip: a titled rule for grouping content inside a page. */
export function SectionStrip({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="-mx-7 flex items-center justify-between border-b border-border px-7 py-3">
      <p className="strip-title">{title}</p>
      {right}
    </div>
  )
}
