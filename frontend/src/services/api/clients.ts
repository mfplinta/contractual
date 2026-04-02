import { api } from './enhancedApi';

export const {
  useClientsListQuery,
  useClientsCreateMutation,
  useClientsPartialUpdateMutation,
  useClientsDestroyMutation,
} = api;
