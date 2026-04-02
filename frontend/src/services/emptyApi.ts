import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Helper to get CSRF token from cookie
function getCsrfToken(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '/',
  prepareHeaders: (headers) => {
    const csrf = getCsrfToken();
    if (csrf) {
      headers.set('X-CSRFToken', csrf);
    }
    return headers;
  },
  credentials: 'same-origin',
  responseHandler: async (response) => {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  },
});

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  // Ensure CSRF token exists before mutating requests
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET');
  if (method !== 'GET' && !getCsrfToken()) {
    await rawBaseQuery({ url: '/api/auth/csrf/', method: 'GET' }, api, extraOptions);
  }

  const result = await rawBaseQuery(args, api, extraOptions);

  // On 403 with CSRF failure, refetch token and retry once
  if (result.error && result.error.status === 403) {
    const data = result.error.data as Record<string, unknown> | undefined;
    if (data && typeof data.detail === 'string' && data.detail.includes('CSRF')) {
      await rawBaseQuery({ url: '/api/auth/csrf/', method: 'GET' }, api, extraOptions);
      return rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const emptySplitApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Materials', 'Clients', 'Jobs', 'Settings', 'Tags', 'Stores', 'Units', 'Auth'],
  endpoints: () => ({}),
});
