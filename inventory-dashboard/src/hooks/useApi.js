/**
 * useApi – generic hook for data fetching with loading / error / data states.
 * Usage:
 *   const { data, loading, error, refetch } = useApi(fetchInventory, { search: '' });
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(apiFn, params = {}, opts = {}) {
  const { immediate = true } = opts;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  // Stringify params to detect changes reliably in the effect dep array
  const paramsKey = JSON.stringify(params);

  const fetch = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(overrideParams ?? params);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFn, paramsKey]);

  useEffect(() => {
    if (immediate) fetch();
  }, [fetch, immediate]);

  return { data, loading, error, refetch: fetch };
}
