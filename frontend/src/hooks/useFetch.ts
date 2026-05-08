import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UseFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export const useFetch = <T,>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  showError = true
) => {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await fetchFn();
        if (isMounted) {
          setState({ data: result, isLoading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          const err = error instanceof Error ? error : new Error(String(error));
          setState({ data: null, isLoading: false, error: err });
          if (showError) {
            toast.error(err.message);
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
};

interface UseMutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export const useMutation = <T, P = void>(
  mutationFn: (payload: P) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) => {
  const [state, setState] = useState<UseMutationState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (payload: P) => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const result = await mutationFn(payload);
        setState({ data: result, isLoading: false, error: null });
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, isLoading: false, error: err });
        options?.onError?.(err);
        throw err;
      }
    },
    [mutationFn, options]
  );

  return { ...state, mutate };
};

export const useAsync = <T, P = void>(
  asyncFn: (payload?: P) => Promise<T>,
  immediate = true
) => {
  const [state, setState] = useState<{
    status: 'idle' | 'pending' | 'success' | 'error';
    data: T | null;
    error: Error | null;
  }>({
    status: 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(
    async (payload?: P) => {
      setState({ status: 'pending', data: null, error: null });
      try {
        const result = await asyncFn(payload);
        setState({ status: 'success', data: result, error: null });
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', data: null, error: err });
        throw err;
      }
    },
    [asyncFn]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
};
