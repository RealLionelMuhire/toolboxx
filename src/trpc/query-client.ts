import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import superjson from 'superjson';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Increased stale time to reduce unnecessary refetches on navigation
        staleTime: 10 * 60 * 1000, // 10 minutes (was 5)
        gcTime: 30 * 60 * 1000, // 30 minutes (was 10) - keep cached data longer
        retry: (failureCount, error) => {
          // Client errors (auth, permission, not found, bad input) won't fix themselves on retry;
          // retrying them only keeps the spinner up for seconds before the error shows.
          // tRPC puts the HTTP status on error.data; the message rarely contains the code name.
          const data = (error as { data?: { httpStatus?: number; code?: string } } | null)?.data;
          const status = data?.httpStatus;
          if (status && status >= 400 && status < 500) return false;
          if (data?.code && ['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'BAD_REQUEST'].includes(data.code)) return false;
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch on every mount - rely on staleTime
        refetchOnReconnect: 'always',
      },
      mutations: {
        retry: false,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
