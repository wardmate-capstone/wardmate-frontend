import { useEffect, useState } from 'react';
import { procedureError } from '@/lib/api/procedures';

/** Callers memoize load; cleanup prevents stale results and cancels the request. */
export function useProcedureQuery<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error: string }>({ loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: '' });
    load(controller.signal).then(data => { if (!controller.signal.aborted) setState({ data, loading: false, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setState({ loading: false, error: procedureError(error) }); });
    return () => controller.abort();
  }, [load, revision]);
  return { ...state, refresh: () => setRevision(value => value + 1) };
}
