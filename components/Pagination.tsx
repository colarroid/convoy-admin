import Link from 'next/link'

interface PaginationProps {
  page: number       // 1-based current page
  pageSize: number
  total: number      // total row count
  basePath: string   // e.g. '/users'
  params?: Record<string, string | undefined> // other query params to preserve
}

/** Prev/Next pagination for admin lists. Renders nothing for a single page. */
export default function Pagination({ page, pageSize, total, basePath, params = {} }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const base = 'chip bg-neutral text-secondary hover:bg-subtle'
  const disabled = 'chip bg-neutral text-secondary opacity-40 pointer-events-none'

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-secondary">
      <span>{from}&ndash;{to} of {total}</span>
      <div className="flex items-center gap-2">
        {page > 1 ? <Link href={href(page - 1)} className={base}>Previous</Link> : <span className={disabled}>Previous</span>}
        <span className="px-1">Page {page} of {totalPages}</span>
        {page < totalPages ? <Link href={href(page + 1)} className={base}>Next</Link> : <span className={disabled}>Next</span>}
      </div>
    </div>
  )
}
