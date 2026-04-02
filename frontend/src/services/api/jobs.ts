import { api } from './enhancedApi';

export const {
  useJobsListQuery,
  useJobsCreateMutation,
  useJobsUpdateMutation,
  useJobsDestroyMutation,
  useJobsMaterialsRetrieveQuery,
  useLazyJobsMaterialsRetrieveQuery,
  useJobsGroupsMaterialsCreateMutation,
  useJobsGroupsMaterialsPartialUpdateMutation,
  useJobsGroupsMaterialsDestroyMutation,
  useJobsBeginEditCreateMutation,
  useJobsCancelEditCreateMutation,
  useJobsGroupsCreateMutation,
  useJobsGroupsPartialUpdateMutation,
  useJobsGroupsDestroyMutation,
  useJobsMaterialsReorderCreateMutation,
  useJobsTaxRateCreateMutation,
  useJobsGroupsLaborCreateMutation,
  useJobsGroupsLaborPartialUpdateMutation,
  useJobsGroupsLaborDestroyMutation,
} = api;
