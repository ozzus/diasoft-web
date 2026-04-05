import { useEffect, useState } from 'react'

import { getBackendStatus, type BackendStatus } from '@/lib/api'

export function useBackendStatus() {
  const [status, setStatus] = useState<BackendStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void getBackendStatus()
      .then((nextStatus) => {
        if (cancelled) {
          return
        }
        setStatus(nextStatus)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return
        }
        setError(cause instanceof Error ? cause.message : 'failed to fetch backend status')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { status, error }
}
