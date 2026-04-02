import { api } from './enhancedApi';

export const {
  useMaterialsListQuery,
  useMaterialsCreateMutation,
  useMaterialsUpdateMutation,
  useMaterialsDestroyMutation,
  useStoresListQuery,
  useStoresCreateMutation,
  useStoresUpdateMutation,
  useStoresDestroyMutation,
  useUnitsListQuery,
  useUnitsCreateMutation,
  useUnitsUpdateMutation,
  useUnitsDestroyMutation,
  useTagsListQuery,
  useTagsCreateMutation,
  useTagsUpdateMutation,
  useTagsDestroyMutation,
  useScrapeRetrieveQuery,
} = api;
