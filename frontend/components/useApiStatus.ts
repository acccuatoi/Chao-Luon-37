'use client'

import { useEffect, useState } from 'react';
import { ApiStatus } from '../lib/types';
import { fetchStatus } from '../lib/ui/api';

/** Loads GET /api/status once per mount. */
export function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchStatus()
      .then((s) => {
        if (alive) {
          setStatus(s);
          setOffline(false);
        }
      })
      .catch(() => alive && setOffline(true));
    return () => {
      alive = false;
    };
  }, []);

  return { status, offline };
}
