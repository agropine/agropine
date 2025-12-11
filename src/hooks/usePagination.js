import { useCallback, useState } from 'react';

/**
 * Custom hook for infinite scroll pagination
 */
export const usePagination = (fetchFunction, pageSize = 20) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEndReached, setIsEndReached] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async (filters = {}) => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFunction({
        ...filters,
        limit: pageSize,
        offset: page * pageSize,
      });

      if (Array.isArray(newData)) {
        if (newData.length === 0) {
          setIsEndReached(true);
          setHasMore(false);
        } else if (newData.length < pageSize) {
          // Last page
          setData(prevData => [...prevData, ...newData]);
          setIsEndReached(true);
          setHasMore(false);
        } else {
          // More pages available
          setData(prevData => [...prevData, ...newData]);
          setPage(prevPage => prevPage + 1);
        }
      }
    } catch (err) {
      console.error('Pagination error:', err);
      setError(err.message || 'Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchFunction, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(0);
    setIsLoading(false);
    setIsEndReached(false);
    setError(null);
    setHasMore(true);
  }, []);

  const refresh = useCallback(async (filters = {}) => {
    reset();
    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFunction({
        ...filters,
        limit: pageSize,
        offset: 0,
      });

      if (Array.isArray(newData)) {
        setData(newData);
        setPage(1);
        if (newData.length < pageSize) {
          setIsEndReached(true);
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Refresh error:', err);
      setError(err.message || 'Failed to refresh items');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, pageSize, reset]);

  return {
    data,
    page,
    isLoading,
    isEndReached,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
  };
};
