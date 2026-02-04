import { QueryClient } from '@tanstack/react-query';

// API request helper function
export const apiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Apply default options like headers here
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'same-origin', // Include cookies in the request
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  return response;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});