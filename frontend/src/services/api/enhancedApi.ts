import { generatedApi } from '../generatedApi';

export const api = generatedApi.enhanceEndpoints({
  endpoints: {
    // Materials
    materialsList: { providesTags: ['Materials', 'Tags'] },
    materialsCreate: { invalidatesTags: ['Materials', 'Tags', 'Stores', 'Units'] },
    materialsUpdate: { invalidatesTags: ['Materials', 'Tags', 'Stores', 'Units'] },
    materialsDestroy: { invalidatesTags: ['Materials', 'Tags'] },

    // Stores
    storesList: { providesTags: ['Stores'] },
    storesCreate: { invalidatesTags: ['Stores'] },
    storesUpdate: { invalidatesTags: ['Stores'] },
    storesDestroy: { invalidatesTags: ['Stores'] },

    // Units
    unitsList: { providesTags: ['Units'] },
    unitsCreate: { invalidatesTags: ['Units'] },
    unitsUpdate: { invalidatesTags: ['Units', 'Materials'] },
    unitsDestroy: { invalidatesTags: ['Units'] },

    // Tags
    tagsList: { providesTags: ['Tags'] },
    tagsCreate: { invalidatesTags: ['Tags'] },
    tagsUpdate: { invalidatesTags: ['Tags', 'Materials'] },
    tagsDestroy: { invalidatesTags: ['Tags', 'Materials'] },

    // Clients
    clientsList: { providesTags: ['Clients'] },
    clientsCreate: { invalidatesTags: ['Clients'] },
    clientsPartialUpdate: { invalidatesTags: ['Clients'] },
    clientsDestroy: { invalidatesTags: ['Clients'] },

    // Jobs
    jobsList: { providesTags: ['Jobs'] },
    jobsCreate: { invalidatesTags: ['Jobs', 'Settings'] },
    jobsUpdate: { invalidatesTags: ['Jobs', 'Settings'] },
    jobsDestroy: { invalidatesTags: ['Jobs', 'Settings'] },

    // Job Materials (nested under job)
    jobsMaterialsRetrieve: {
      providesTags: (_res: unknown, _err: unknown, arg: { id: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.id}` },
      ],
    },
    jobsGroupsMaterialsCreate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },
    jobsGroupsMaterialsPartialUpdate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },
    jobsGroupsMaterialsDestroy: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },

    // Job Groups
    jobsGroupsCreate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },
    jobsGroupsPartialUpdate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },
    jobsGroupsDestroy: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },

    // Job Labor
    jobsGroupsLaborCreate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },
    jobsGroupsLaborPartialUpdate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },
    jobsGroupsLaborDestroy: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { jobPk: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.jobPk}` },
      ],
    },

    // Job actions
    jobsCancelEditCreate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { id: number }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.id}` },
      ],
    },
    jobsMaterialsReorderCreate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { id: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.id}` },
      ],
    },
    jobsTaxRateCreate: {
      invalidatesTags: (_res: unknown, _err: unknown, arg: { id: string }) => [
        { type: 'Jobs' as const, id: `jobs-${arg.id}` },
        'Settings' as const,
      ],
    },

    // Settings
    settingsRetrieve: { providesTags: ['Settings'] },
    settingsUpdate: { invalidatesTags: ['Settings'] },
    settingsCompanyLogoUpdate: { invalidatesTags: ['Settings'] },
    settingsCompanyLogoDestroy: { invalidatesTags: ['Settings'] },

    // Auth
    authUserRetrieve: { providesTags: ['Auth'] },
    authLoginCreate: { invalidatesTags: ['Auth'] },
    authLogoutCreate: { invalidatesTags: ['Auth'] },
    authPasswordChangeCreate: {},
  },
});
