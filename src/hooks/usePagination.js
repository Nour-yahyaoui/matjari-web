import { useState, useMemo } from 'react'

export function usePagination(initialLimit = 10) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)

  const offset = useMemo(() => (page - 1) * limit, [page, limit])

  const goToPage = (p) => setPage(Math.max(1, p))
  const nextPage = (totalPages) => setPage((p) => Math.min(p + 1, totalPages || p + 1))
  const prevPage = () => setPage((p) => Math.max(1, p - 1))
  const reset = () => setPage(1)

  return { page, limit, offset, setLimit, goToPage, nextPage, prevPage, reset }
}
