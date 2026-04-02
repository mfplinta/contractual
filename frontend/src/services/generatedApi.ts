import { emptySplitApi as api } from "./emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    authCsrfRetrieve: build.query<
      AuthCsrfRetrieveApiResponse,
      AuthCsrfRetrieveApiArg
    >({
      query: () => ({ url: `/api/auth/csrf/` }),
    }),
    authLoginCreate: build.mutation<
      AuthLoginCreateApiResponse,
      AuthLoginCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/login/`,
        method: "POST",
        body: queryArg.login,
      }),
    }),
    authLogoutRetrieve: build.query<
      AuthLogoutRetrieveApiResponse,
      AuthLogoutRetrieveApiArg
    >({
      query: () => ({ url: `/api/auth/logout/` }),
    }),
    authLogoutCreate: build.mutation<
      AuthLogoutCreateApiResponse,
      AuthLogoutCreateApiArg
    >({
      query: () => ({ url: `/api/auth/logout/`, method: "POST" }),
    }),
    authPasswordChangeCreate: build.mutation<
      AuthPasswordChangeCreateApiResponse,
      AuthPasswordChangeCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/password/change/`,
        method: "POST",
        body: queryArg.passwordChange,
      }),
    }),
    authUserRetrieve: build.query<
      AuthUserRetrieveApiResponse,
      AuthUserRetrieveApiArg
    >({
      query: () => ({ url: `/api/auth/user/` }),
    }),
    authUserUpdate: build.mutation<
      AuthUserUpdateApiResponse,
      AuthUserUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/user/`,
        method: "PUT",
        body: queryArg.user,
      }),
    }),
    authUserPartialUpdate: build.mutation<
      AuthUserPartialUpdateApiResponse,
      AuthUserPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/auth/user/`,
        method: "PATCH",
        body: queryArg.patchedUser,
      }),
    }),
    clientsList: build.query<ClientsListApiResponse, ClientsListApiArg>({
      query: () => ({ url: `/api/clients/` }),
    }),
    clientsCreate: build.mutation<
      ClientsCreateApiResponse,
      ClientsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/clients/`,
        method: "POST",
        body: queryArg.client,
      }),
    }),
    clientsRetrieve: build.query<
      ClientsRetrieveApiResponse,
      ClientsRetrieveApiArg
    >({
      query: (queryArg) => ({ url: `/api/clients/${queryArg.id}/` }),
    }),
    clientsUpdate: build.mutation<
      ClientsUpdateApiResponse,
      ClientsUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/clients/${queryArg.id}/`,
        method: "PUT",
        body: queryArg.client,
      }),
    }),
    clientsPartialUpdate: build.mutation<
      ClientsPartialUpdateApiResponse,
      ClientsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/clients/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedClient,
      }),
    }),
    clientsDestroy: build.mutation<
      ClientsDestroyApiResponse,
      ClientsDestroyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/clients/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    jobsList: build.query<JobsListApiResponse, JobsListApiArg>({
      query: () => ({ url: `/api/jobs/` }),
    }),
    jobsCreate: build.mutation<JobsCreateApiResponse, JobsCreateApiArg>({
      query: (queryArg) => ({
        url: `/api/jobs/`,
        method: "POST",
        body: queryArg.job,
      }),
    }),
    jobsGroupsCreate: build.mutation<
      JobsGroupsCreateApiResponse,
      JobsGroupsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/`,
        method: "POST",
        body: queryArg.jobGroupCreateRequest,
      }),
    }),
    jobsGroupsLaborCreate: build.mutation<
      JobsGroupsLaborCreateApiResponse,
      JobsGroupsLaborCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.groupPk}/labor/`,
        method: "POST",
        body: queryArg.jobLabor,
      }),
    }),
    jobsGroupsLaborPartialUpdate: build.mutation<
      JobsGroupsLaborPartialUpdateApiResponse,
      JobsGroupsLaborPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.groupPk}/labor/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedJobLabor,
      }),
    }),
    jobsGroupsLaborDestroy: build.mutation<
      JobsGroupsLaborDestroyApiResponse,
      JobsGroupsLaborDestroyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.groupPk}/labor/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    jobsGroupsMaterialsCreate: build.mutation<
      JobsGroupsMaterialsCreateApiResponse,
      JobsGroupsMaterialsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.groupPk}/materials/`,
        method: "POST",
        body: queryArg.jobMaterialCreateRequest,
      }),
    }),
    jobsGroupsMaterialsPartialUpdate: build.mutation<
      JobsGroupsMaterialsPartialUpdateApiResponse,
      JobsGroupsMaterialsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.groupPk}/materials/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedJobMaterial,
      }),
    }),
    jobsGroupsMaterialsDestroy: build.mutation<
      JobsGroupsMaterialsDestroyApiResponse,
      JobsGroupsMaterialsDestroyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.groupPk}/materials/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    jobsGroupsPartialUpdate: build.mutation<
      JobsGroupsPartialUpdateApiResponse,
      JobsGroupsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedJobGroup,
      }),
    }),
    jobsGroupsDestroy: build.mutation<
      JobsGroupsDestroyApiResponse,
      JobsGroupsDestroyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.jobPk}/groups/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    jobsRetrieve: build.query<JobsRetrieveApiResponse, JobsRetrieveApiArg>({
      query: (queryArg) => ({ url: `/api/jobs/${queryArg.id}/` }),
    }),
    jobsUpdate: build.mutation<JobsUpdateApiResponse, JobsUpdateApiArg>({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/`,
        method: "PUT",
        body: queryArg.job,
      }),
    }),
    jobsPartialUpdate: build.mutation<
      JobsPartialUpdateApiResponse,
      JobsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedJob,
      }),
    }),
    jobsDestroy: build.mutation<JobsDestroyApiResponse, JobsDestroyApiArg>({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    jobsBeginEditCreate: build.mutation<
      JobsBeginEditCreateApiResponse,
      JobsBeginEditCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/begin-edit/`,
        method: "POST",
      }),
    }),
    jobsCancelEditCreate: build.mutation<
      JobsCancelEditCreateApiResponse,
      JobsCancelEditCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/cancel-edit/`,
        method: "POST",
      }),
    }),
    jobsExportRetrieve: build.query<
      JobsExportRetrieveApiResponse,
      JobsExportRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/export/`,
        params: {
          fmt: queryArg.fmt,
          showLaborDetails: queryArg.showLaborDetails,
        },
      }),
    }),
    jobsMaterialsRetrieve: build.query<
      JobsMaterialsRetrieveApiResponse,
      JobsMaterialsRetrieveApiArg
    >({
      query: (queryArg) => ({ url: `/api/jobs/${queryArg.id}/materials/` }),
    }),
    jobsMaterialsReorderCreate: build.mutation<
      JobsMaterialsReorderCreateApiResponse,
      JobsMaterialsReorderCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/materials/reorder/`,
        method: "POST",
        body: queryArg.reorderMaterialRequest,
      }),
    }),
    jobsTaxRateCreate: build.mutation<
      JobsTaxRateCreateApiResponse,
      JobsTaxRateCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/jobs/${queryArg.id}/tax-rate/`,
        method: "POST",
        body: queryArg.updateTaxRateRequest,
      }),
    }),
    materialsList: build.query<MaterialsListApiResponse, MaterialsListApiArg>({
      query: () => ({ url: `/api/materials/` }),
    }),
    materialsCreate: build.mutation<
      MaterialsCreateApiResponse,
      MaterialsCreateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/materials/`,
        method: "POST",
        body: queryArg.materialNested,
      }),
    }),
    materialsRetrieve: build.query<
      MaterialsRetrieveApiResponse,
      MaterialsRetrieveApiArg
    >({
      query: (queryArg) => ({ url: `/api/materials/${queryArg.id}/` }),
    }),
    materialsUpdate: build.mutation<
      MaterialsUpdateApiResponse,
      MaterialsUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/materials/${queryArg.id}/`,
        method: "PUT",
        body: queryArg.materialNested,
      }),
    }),
    materialsPartialUpdate: build.mutation<
      MaterialsPartialUpdateApiResponse,
      MaterialsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/materials/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedMaterialNested,
      }),
    }),
    materialsDestroy: build.mutation<
      MaterialsDestroyApiResponse,
      MaterialsDestroyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/materials/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    scrapeRetrieve: build.query<
      ScrapeRetrieveApiResponse,
      ScrapeRetrieveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/scrape/${queryArg.scraperId}/`,
        params: {
          sku: queryArg.sku,
        },
      }),
    }),
    settingsRetrieve: build.query<
      SettingsRetrieveApiResponse,
      SettingsRetrieveApiArg
    >({
      query: () => ({ url: `/api/settings/` }),
    }),
    settingsUpdate: build.mutation<
      SettingsUpdateApiResponse,
      SettingsUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/settings/`,
        method: "PUT",
        body: queryArg.settings,
      }),
    }),
    settingsCompanyLogoUpdate: build.mutation<
      SettingsCompanyLogoUpdateApiResponse,
      SettingsCompanyLogoUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/settings/companyLogo/`,
        method: "PUT",
        body: queryArg.body,
      }),
    }),
    settingsCompanyLogoDestroy: build.mutation<
      SettingsCompanyLogoDestroyApiResponse,
      SettingsCompanyLogoDestroyApiArg
    >({
      query: () => ({ url: `/api/settings/companyLogo/`, method: "DELETE" }),
    }),
    storesList: build.query<StoresListApiResponse, StoresListApiArg>({
      query: () => ({ url: `/api/stores/` }),
    }),
    storesCreate: build.mutation<StoresCreateApiResponse, StoresCreateApiArg>({
      query: (queryArg) => ({
        url: `/api/stores/`,
        method: "POST",
        body: queryArg.store,
      }),
    }),
    storesRetrieve: build.query<
      StoresRetrieveApiResponse,
      StoresRetrieveApiArg
    >({
      query: (queryArg) => ({ url: `/api/stores/${queryArg.id}/` }),
    }),
    storesUpdate: build.mutation<StoresUpdateApiResponse, StoresUpdateApiArg>({
      query: (queryArg) => ({
        url: `/api/stores/${queryArg.id}/`,
        method: "PUT",
        body: queryArg.store,
      }),
    }),
    storesPartialUpdate: build.mutation<
      StoresPartialUpdateApiResponse,
      StoresPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stores/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedStore,
      }),
    }),
    storesDestroy: build.mutation<
      StoresDestroyApiResponse,
      StoresDestroyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/stores/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    systemRetrieve: build.query<
      SystemRetrieveApiResponse,
      SystemRetrieveApiArg
    >({
      query: () => ({ url: `/api/system/` }),
    }),
    tagsList: build.query<TagsListApiResponse, TagsListApiArg>({
      query: () => ({ url: `/api/tags/` }),
    }),
    tagsCreate: build.mutation<TagsCreateApiResponse, TagsCreateApiArg>({
      query: (queryArg) => ({
        url: `/api/tags/`,
        method: "POST",
        body: queryArg.tag,
      }),
    }),
    tagsRetrieve: build.query<TagsRetrieveApiResponse, TagsRetrieveApiArg>({
      query: (queryArg) => ({ url: `/api/tags/${queryArg.id}/` }),
    }),
    tagsUpdate: build.mutation<TagsUpdateApiResponse, TagsUpdateApiArg>({
      query: (queryArg) => ({
        url: `/api/tags/${queryArg.id}/`,
        method: "PUT",
        body: queryArg.tag,
      }),
    }),
    tagsPartialUpdate: build.mutation<
      TagsPartialUpdateApiResponse,
      TagsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/tags/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedTag,
      }),
    }),
    tagsDestroy: build.mutation<TagsDestroyApiResponse, TagsDestroyApiArg>({
      query: (queryArg) => ({
        url: `/api/tags/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
    unitsList: build.query<UnitsListApiResponse, UnitsListApiArg>({
      query: () => ({ url: `/api/units/` }),
    }),
    unitsCreate: build.mutation<UnitsCreateApiResponse, UnitsCreateApiArg>({
      query: (queryArg) => ({
        url: `/api/units/`,
        method: "POST",
        body: queryArg.unit,
      }),
    }),
    unitsRetrieve: build.query<UnitsRetrieveApiResponse, UnitsRetrieveApiArg>({
      query: (queryArg) => ({ url: `/api/units/${queryArg.id}/` }),
    }),
    unitsUpdate: build.mutation<UnitsUpdateApiResponse, UnitsUpdateApiArg>({
      query: (queryArg) => ({
        url: `/api/units/${queryArg.id}/`,
        method: "PUT",
        body: queryArg.unit,
      }),
    }),
    unitsPartialUpdate: build.mutation<
      UnitsPartialUpdateApiResponse,
      UnitsPartialUpdateApiArg
    >({
      query: (queryArg) => ({
        url: `/api/units/${queryArg.id}/`,
        method: "PATCH",
        body: queryArg.patchedUnit,
      }),
    }),
    unitsDestroy: build.mutation<UnitsDestroyApiResponse, UnitsDestroyApiArg>({
      query: (queryArg) => ({
        url: `/api/units/${queryArg.id}/`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as generatedApi };
export type AuthCsrfRetrieveApiResponse = unknown;
export type AuthCsrfRetrieveApiArg = void;
export type AuthLoginCreateApiResponse = /** status 200  */ Login;
export type AuthLoginCreateApiArg = {
  login: Login;
};
export type AuthLogoutRetrieveApiResponse = unknown;
export type AuthLogoutRetrieveApiArg = void;
export type AuthLogoutCreateApiResponse = unknown;
export type AuthLogoutCreateApiArg = void;
export type AuthPasswordChangeCreateApiResponse =
  /** status 200  */ PasswordChange;
export type AuthPasswordChangeCreateApiArg = {
  passwordChange: PasswordChange;
};
export type AuthUserRetrieveApiResponse = /** status 200  */ UserRead;
export type AuthUserRetrieveApiArg = void;
export type AuthUserUpdateApiResponse = /** status 200  */ UserRead;
export type AuthUserUpdateApiArg = {
  user: User;
};
export type AuthUserPartialUpdateApiResponse = /** status 200  */ UserRead;
export type AuthUserPartialUpdateApiArg = {
  patchedUser: PatchedUser;
};
export type ClientsListApiResponse = /** status 200  */ ClientRead[];
export type ClientsListApiArg = void;
export type ClientsCreateApiResponse = /** status 201  */ ClientRead;
export type ClientsCreateApiArg = {
  client: Client;
};
export type ClientsRetrieveApiResponse = /** status 200  */ ClientRead;
export type ClientsRetrieveApiArg = {
  /** A unique integer value identifying this client. */
  id: number;
};
export type ClientsUpdateApiResponse = /** status 200  */ ClientRead;
export type ClientsUpdateApiArg = {
  /** A unique integer value identifying this client. */
  id: number;
  client: Client;
};
export type ClientsPartialUpdateApiResponse = /** status 200  */ ClientRead;
export type ClientsPartialUpdateApiArg = {
  /** A unique integer value identifying this client. */
  id: number;
  patchedClient: PatchedClient;
};
export type ClientsDestroyApiResponse = unknown;
export type ClientsDestroyApiArg = {
  /** A unique integer value identifying this client. */
  id: number;
};
export type JobsListApiResponse = /** status 200  */ JobRead[];
export type JobsListApiArg = void;
export type JobsCreateApiResponse = /** status 201  */ JobCreateResponseRead;
export type JobsCreateApiArg = {
  job: JobWrite;
};
export type JobsGroupsCreateApiResponse = /** status 201  */ JobGroupRead;
export type JobsGroupsCreateApiArg = {
  jobPk: string;
  jobGroupCreateRequest: JobGroupCreateRequest;
};
export type JobsGroupsLaborCreateApiResponse = /** status 201  */ JobLaborRead;
export type JobsGroupsLaborCreateApiArg = {
  groupPk: number;
  jobPk: string;
  jobLabor: JobLabor;
};
export type JobsGroupsLaborPartialUpdateApiResponse =
  /** status 200  */ JobLaborRead;
export type JobsGroupsLaborPartialUpdateApiArg = {
  groupPk: number;
  id: number;
  jobPk: string;
  patchedJobLabor: PatchedJobLabor;
};
export type JobsGroupsLaborDestroyApiResponse = unknown;
export type JobsGroupsLaborDestroyApiArg = {
  groupPk: number;
  id: number;
  jobPk: string;
};
export type JobsGroupsMaterialsCreateApiResponse =
  /** status 201  */ JobMaterialRead;
export type JobsGroupsMaterialsCreateApiArg = {
  groupPk: number;
  jobPk: string;
  jobMaterialCreateRequest: JobMaterialCreateRequest;
};
export type JobsGroupsMaterialsPartialUpdateApiResponse =
  /** status 200  */ JobMaterialRead;
export type JobsGroupsMaterialsPartialUpdateApiArg = {
  groupPk: number;
  id: number;
  jobPk: string;
  patchedJobMaterial: PatchedJobMaterialWrite;
};
export type JobsGroupsMaterialsDestroyApiResponse = unknown;
export type JobsGroupsMaterialsDestroyApiArg = {
  groupPk: number;
  id: number;
  jobPk: string;
};
export type JobsGroupsPartialUpdateApiResponse =
  /** status 200  */ JobGroupRead;
export type JobsGroupsPartialUpdateApiArg = {
  id: number;
  jobPk: string;
  patchedJobGroup: PatchedJobGroup;
};
export type JobsGroupsDestroyApiResponse = unknown;
export type JobsGroupsDestroyApiArg = {
  id: number;
  jobPk: string;
};
export type JobsRetrieveApiResponse = /** status 200  */ JobRead;
export type JobsRetrieveApiArg = {
  /** Job reference: numeric id or 'draft'. */
  id: string;
};
export type JobsUpdateApiResponse = /** status 200  */ JobRead;
export type JobsUpdateApiArg = {
  /** A unique integer value identifying this job. */
  id: number;
  job: JobWrite;
};
export type JobsPartialUpdateApiResponse = /** status 200  */ JobRead;
export type JobsPartialUpdateApiArg = {
  /** A unique integer value identifying this job. */
  id: number;
  patchedJob: PatchedJobWrite;
};
export type JobsDestroyApiResponse = unknown;
export type JobsDestroyApiArg = {
  /** A unique integer value identifying this job. */
  id: number;
};
export type JobsBeginEditCreateApiResponse =
  /** status 200  */ BeginEditResponse;
export type JobsBeginEditCreateApiArg = {
  /** A unique integer value identifying this job. */
  id: number;
};
export type JobsCancelEditCreateApiResponse =
  /** status 200  */ CancelEditResponse;
export type JobsCancelEditCreateApiArg = {
  /** A unique integer value identifying this job. */
  id: number;
};
export type JobsExportRetrieveApiResponse = unknown;
export type JobsExportRetrieveApiArg = {
  /** Export format: excel or pdf */
  fmt?: string;
  /** A unique integer value identifying this job. */
  id: number;
  /** Show labor details */
  showLaborDetails?: string;
};
export type JobsMaterialsRetrieveApiResponse =
  /** status 200  */ JobMaterialsResponseRead;
export type JobsMaterialsRetrieveApiArg = {
  /** Job reference: numeric id or 'draft'. */
  id: string;
};
export type JobsMaterialsReorderCreateApiResponse =
  /** status 200  */ ReorderMaterialResponse;
export type JobsMaterialsReorderCreateApiArg = {
  /** Job reference: numeric id or 'draft'. */
  id: string;
  reorderMaterialRequest: ReorderMaterialRequest;
};
export type JobsTaxRateCreateApiResponse =
  /** status 200  */ UpdateTaxRateResponse;
export type JobsTaxRateCreateApiArg = {
  /** Job reference: numeric id or 'draft'. */
  id: string;
  updateTaxRateRequest: UpdateTaxRateRequest;
};
export type MaterialsListApiResponse = /** status 200  */ MaterialNestedRead[];
export type MaterialsListApiArg = void;
export type MaterialsCreateApiResponse = /** status 201  */ MaterialNestedRead;
export type MaterialsCreateApiArg = {
  materialNested: MaterialNestedWrite;
};
export type MaterialsRetrieveApiResponse =
  /** status 200  */ MaterialNestedRead;
export type MaterialsRetrieveApiArg = {
  /** A unique integer value identifying this material. */
  id: number;
};
export type MaterialsUpdateApiResponse = /** status 200  */ MaterialNestedRead;
export type MaterialsUpdateApiArg = {
  /** A unique integer value identifying this material. */
  id: number;
  materialNested: MaterialNestedWrite;
};
export type MaterialsPartialUpdateApiResponse =
  /** status 200  */ MaterialNestedRead;
export type MaterialsPartialUpdateApiArg = {
  /** A unique integer value identifying this material. */
  id: number;
  patchedMaterialNested: PatchedMaterialNestedWrite;
};
export type MaterialsDestroyApiResponse = unknown;
export type MaterialsDestroyApiArg = {
  /** A unique integer value identifying this material. */
  id: number;
};
export type ScrapeRetrieveApiResponse = /** status 200  */ ScraperPriceResponse;
export type ScrapeRetrieveApiArg = {
  scraperId: string;
  sku: string;
};
export type SettingsRetrieveApiResponse = /** status 200  */ SettingsResponse;
export type SettingsRetrieveApiArg = void;
export type SettingsUpdateApiResponse = unknown;
export type SettingsUpdateApiArg = {
  settings: Settings;
};
export type SettingsCompanyLogoUpdateApiResponse =
  /** status 200  */ CompanyLogoResponse;
export type SettingsCompanyLogoUpdateApiArg = {
  body: {
    logo?: Blob;
  };
};
export type SettingsCompanyLogoDestroyApiResponse = unknown;
export type SettingsCompanyLogoDestroyApiArg = void;
export type StoresListApiResponse = /** status 200  */ StoreRead[];
export type StoresListApiArg = void;
export type StoresCreateApiResponse = /** status 201  */ StoreRead;
export type StoresCreateApiArg = {
  store: Store;
};
export type StoresRetrieveApiResponse = /** status 200  */ StoreRead;
export type StoresRetrieveApiArg = {
  /** A unique integer value identifying this store. */
  id: number;
};
export type StoresUpdateApiResponse = /** status 200  */ StoreRead;
export type StoresUpdateApiArg = {
  /** A unique integer value identifying this store. */
  id: number;
  store: Store;
};
export type StoresPartialUpdateApiResponse = /** status 200  */ StoreRead;
export type StoresPartialUpdateApiArg = {
  /** A unique integer value identifying this store. */
  id: number;
  patchedStore: PatchedStore;
};
export type StoresDestroyApiResponse = unknown;
export type StoresDestroyApiArg = {
  /** A unique integer value identifying this store. */
  id: number;
};
export type SystemRetrieveApiResponse = /** status 200  */ SystemInfoResponse;
export type SystemRetrieveApiArg = void;
export type TagsListApiResponse = /** status 200  */ TagRead[];
export type TagsListApiArg = void;
export type TagsCreateApiResponse = /** status 201  */ TagRead;
export type TagsCreateApiArg = {
  tag: Tag;
};
export type TagsRetrieveApiResponse = /** status 200  */ TagRead;
export type TagsRetrieveApiArg = {
  /** A unique integer value identifying this tag. */
  id: number;
};
export type TagsUpdateApiResponse = /** status 200  */ TagRead;
export type TagsUpdateApiArg = {
  /** A unique integer value identifying this tag. */
  id: number;
  tag: Tag;
};
export type TagsPartialUpdateApiResponse = /** status 200  */ TagRead;
export type TagsPartialUpdateApiArg = {
  /** A unique integer value identifying this tag. */
  id: number;
  patchedTag: PatchedTag;
};
export type TagsDestroyApiResponse = unknown;
export type TagsDestroyApiArg = {
  /** A unique integer value identifying this tag. */
  id: number;
};
export type UnitsListApiResponse = /** status 200  */ UnitRead[];
export type UnitsListApiArg = void;
export type UnitsCreateApiResponse = /** status 201  */ UnitRead;
export type UnitsCreateApiArg = {
  unit: Unit;
};
export type UnitsRetrieveApiResponse = /** status 200  */ UnitRead;
export type UnitsRetrieveApiArg = {
  /** A unique integer value identifying this unit. */
  id: number;
};
export type UnitsUpdateApiResponse = /** status 200  */ UnitRead;
export type UnitsUpdateApiArg = {
  /** A unique integer value identifying this unit. */
  id: number;
  unit: Unit;
};
export type UnitsPartialUpdateApiResponse = /** status 200  */ UnitRead;
export type UnitsPartialUpdateApiArg = {
  /** A unique integer value identifying this unit. */
  id: number;
  patchedUnit: PatchedUnit;
};
export type UnitsDestroyApiResponse = unknown;
export type UnitsDestroyApiArg = {
  /** A unique integer value identifying this unit. */
  id: number;
};
export type Login = {
  username?: string;
  email?: string;
  password: string;
};
export type PasswordChange = {
  oldPassword: string;
  newPassword1: string;
  newPassword2: string;
};
export type User = {
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  firstName?: string;
  lastName?: string;
};
export type UserRead = {
  pk: number;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username: string;
  firstName?: string;
  lastName?: string;
};
export type PatchedUser = {
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username?: string;
  firstName?: string;
  lastName?: string;
};
export type PatchedUserRead = {
  pk?: number;
  /** Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only. */
  username?: string;
  firstName?: string;
  lastName?: string;
};
export type Client = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};
export type ClientRead = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};
export type PatchedClient = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};
export type PatchedClientRead = {
  id?: number;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
};
export type StatusEnum = "draft" | "saved";
export type Job = {
  description: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: StatusEnum;
  taxRate?: number;
};
export type JobRead = {
  id: number;
  client: ClientRead;
  description: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: StatusEnum;
  taxRate?: number;
  subtotal: number;
  taxTotal: number;
  total: number;
};
export type JobWrite = {
  clientId?: number;
  clientName?: string;
  description: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: StatusEnum;
  taxRate?: number;
};
export type JobCreateResponse = {
  job: Job;
};
export type JobCreateResponseRead = {
  job: JobRead;
};
export type JobCreateResponseWrite = {
  job: JobWrite;
};
export type JobGroup = {
  name?: string | null;
  sortOrder?: number;
};
export type JobGroupRead = {
  id: number;
  jobId: number;
  name?: string | null;
  sortOrder?: number;
  subtotal: number;
  taxTotal: number;
  total: number;
  laborTimeTotal: number;
  laborCostTotal: number;
};
export type JobGroupCreateRequest = {
  name?: string | null;
  splitAfterItemId?: number;
  sourceGroupId?: number;
};
export type JobLabor = {
  description?: string;
  time?: number;
  cost?: number;
};
export type JobLaborRead = {
  id: number;
  groupId: number;
  description?: string;
  time?: number;
  cost?: number;
};
export type PatchedJobLabor = {
  description?: string;
  time?: number;
  cost?: number;
};
export type PatchedJobLaborRead = {
  id?: number;
  groupId?: number;
  description?: string;
  time?: number;
  cost?: number;
};
export type JobMaterial = {
  variantId: number;
  storeId: number;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  tax?: number;
  notes?: string | null;
  wasPriceEdited?: boolean;
  ignored?: boolean;
  unit?: string | null;
  sortOrder?: number;
};
export type StoreNested = {
  sku?: string;
  price: number;
  priceFromApi?: boolean;
};
export type Store = {
  name: string;
  storeUrl?: string;
};
export type StoreRead = {
  id: number;
  name: string;
  storeUrl?: string;
};
export type MaterialImage = {
  image: string;
};
export type MaterialImageRead = {
  id: number;
  materialId: number | null;
  variantId: number | null;
  storeId: number | null;
  image: string;
};
export type StoreNestedRead = {
  id: number;
  store: StoreRead;
  sku?: string;
  price: number;
  priceFromApi?: boolean;
  images: MaterialImageRead[];
};
export type StoreNestedWrite = {
  storeId?: number;
  storeName?: string;
  sku?: string;
  price: number;
  priceFromApi?: boolean;
};
export type JobMaterialRead = {
  id: number;
  groupId: number;
  variantId: number;
  storeId: number;
  description: string;
  priceInfo: StoreNestedRead | null;
  images: MaterialImageRead[];
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  subtotal: number;
  tax?: number;
  notes?: string | null;
  wasPriceEdited?: boolean;
  ignored?: boolean;
  unit?: string | null;
  sortOrder?: number;
};
export type JobMaterialWrite = {
  variantId: number;
  storeId: number;
  quantity?: number;
  unitPrice: number;
  totalPrice: number;
  tax?: number;
  notes?: string | null;
  wasPriceEdited?: boolean;
  ignored?: boolean;
  unit?: string | null;
  sortOrder?: number;
};
export type JobMaterialCreateRequest = {
  variantId: number;
  storeId: number;
  quantity?: number;
  notes?: string;
  wasPriceEdited?: boolean;
  ignored?: boolean;
  unit?: string;
  sortOrder?: number;
};
export type PatchedJobMaterial = {
  variantId?: number;
  storeId?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  tax?: number;
  notes?: string | null;
  wasPriceEdited?: boolean;
  ignored?: boolean;
  unit?: string | null;
  sortOrder?: number;
};
export type PatchedJobMaterialRead = {
  id?: number;
  groupId?: number;
  variantId?: number;
  storeId?: number;
  description?: string;
  priceInfo?: StoreNestedRead | null;
  images?: MaterialImageRead[];
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  subtotal?: number;
  tax?: number;
  notes?: string | null;
  wasPriceEdited?: boolean;
  ignored?: boolean;
  unit?: string | null;
  sortOrder?: number;
};
export type PatchedJobMaterialWrite = {
  variantId?: number;
  storeId?: number;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  tax?: number;
  notes?: string | null;
  wasPriceEdited?: boolean;
  ignored?: boolean;
  unit?: string | null;
  sortOrder?: number;
};
export type PatchedJobGroup = {
  name?: string | null;
  sortOrder?: number;
};
export type PatchedJobGroupRead = {
  id?: number;
  jobId?: number;
  name?: string | null;
  sortOrder?: number;
  subtotal?: number;
  taxTotal?: number;
  total?: number;
  laborTimeTotal?: number;
  laborCostTotal?: number;
};
export type PatchedJob = {
  description?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: StatusEnum;
  taxRate?: number;
};
export type PatchedJobRead = {
  id?: number;
  client?: ClientRead;
  description?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: StatusEnum;
  taxRate?: number;
  subtotal?: number;
  taxTotal?: number;
  total?: number;
};
export type PatchedJobWrite = {
  clientId?: number;
  clientName?: string;
  description?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  status?: StatusEnum;
  taxRate?: number;
};
export type BeginEditResponse = {
  ok: boolean;
};
export type CancelEditResponse = {
  ok: boolean;
};
export type JobMaterialsResponse = {
  materialItems: JobMaterial[];
  groups: JobGroup[];
  laborItems: JobLabor[];
};
export type JobMaterialsResponseRead = {
  materialItems: JobMaterialRead[];
  groups: JobGroupRead[];
  laborItems: JobLaborRead[];
};
export type JobMaterialsResponseWrite = {
  materialItems: JobMaterialWrite[];
  groups: JobGroup[];
  laborItems: JobLabor[];
};
export type ReorderMaterialResponse = {
  ok: boolean;
};
export type ReorderMaterialRequest = {
  itemId: number;
  targetGroupId: number;
  targetIndex: number;
};
export type UpdateTaxRateResponse = {
  ok: boolean;
};
export type UpdateTaxRateRequest = {
  taxRate: number;
};
export type MaterialVariantNested = {
  name?: string | null;
  unit: string;
  stores: StoreNested[];
};
export type MaterialVariantNestedRead = {
  id: number;
  name?: string | null;
  unit: string;
  stores: StoreNestedRead[];
  images: MaterialImageRead[];
  isProxy: boolean;
  sourceVariantId: number | null;
  divisor: number | null;
};
export type ProxyVariantWrite = {
  id?: number;
  unit: string;
  divisor: number;
};
export type MaterialVariantNestedWrite = {
  name?: string | null;
  unit: string;
  stores: StoreNestedWrite[];
  proxyVariants?: ProxyVariantWrite[];
};
export type MaterialNested = {
  description: string;
  variants: MaterialVariantNested[];
  tags: string[];
};
export type MaterialNestedRead = {
  id: number;
  description: string;
  variants: MaterialVariantNestedRead[];
  tags: string[];
  images: MaterialImageRead[];
};
export type MaterialNestedWrite = {
  description: string;
  variants: MaterialVariantNestedWrite[];
  tags: string[];
};
export type PatchedMaterialNested = {
  description?: string;
  variants?: MaterialVariantNested[];
  tags?: string[];
};
export type PatchedMaterialNestedRead = {
  id?: number;
  description?: string;
  variants?: MaterialVariantNestedRead[];
  tags?: string[];
  images?: MaterialImageRead[];
};
export type PatchedMaterialNestedWrite = {
  description?: string;
  variants?: MaterialVariantNestedWrite[];
  tags?: string[];
};
export type ScraperPriceResponse = {
  price: string;
  image: string | null;
  sku: string;
  error?: string;
};
export type SettingsResponse = {
  taxRate: number;
  materialsViewMode: string;
  accentColor: string;
  companyLogoUrl: string | null;
  defaultExportFormat: string;
  defaultExportShowLaborDetails: boolean;
};
export type MaterialsViewModeEnum = "grid" | "list";
export type DefaultExportFormatEnum = "excel" | "pdf";
export type Settings = {
  taxRate?: number;
  materialsViewMode?: MaterialsViewModeEnum;
  accentColor?: string;
  defaultExportFormat?: DefaultExportFormatEnum;
  defaultExportShowLaborDetails?: boolean;
};
export type CompanyLogoResponse = {
  companyLogoUrl: string;
};
export type PatchedStore = {
  name?: string;
  storeUrl?: string;
};
export type PatchedStoreRead = {
  id?: number;
  name?: string;
  storeUrl?: string;
};
export type SystemInfoResponse = {
  hasLibreOffice: boolean;
};
export type Tag = {
  name: string;
};
export type TagRead = {
  id: number;
  name: string;
};
export type PatchedTag = {
  name?: string;
};
export type PatchedTagRead = {
  id?: number;
  name?: string;
};
export type Unit = {
  name: string;
};
export type UnitRead = {
  id: number;
  name: string;
};
export type PatchedUnit = {
  name?: string;
};
export type PatchedUnitRead = {
  id?: number;
  name?: string;
};
export const {
  useAuthCsrfRetrieveQuery,
  useAuthLoginCreateMutation,
  useAuthLogoutRetrieveQuery,
  useAuthLogoutCreateMutation,
  useAuthPasswordChangeCreateMutation,
  useAuthUserRetrieveQuery,
  useAuthUserUpdateMutation,
  useAuthUserPartialUpdateMutation,
  useClientsListQuery,
  useClientsCreateMutation,
  useClientsRetrieveQuery,
  useClientsUpdateMutation,
  useClientsPartialUpdateMutation,
  useClientsDestroyMutation,
  useJobsListQuery,
  useJobsCreateMutation,
  useJobsGroupsCreateMutation,
  useJobsGroupsLaborCreateMutation,
  useJobsGroupsLaborPartialUpdateMutation,
  useJobsGroupsLaborDestroyMutation,
  useJobsGroupsMaterialsCreateMutation,
  useJobsGroupsMaterialsPartialUpdateMutation,
  useJobsGroupsMaterialsDestroyMutation,
  useJobsGroupsPartialUpdateMutation,
  useJobsGroupsDestroyMutation,
  useJobsRetrieveQuery,
  useJobsUpdateMutation,
  useJobsPartialUpdateMutation,
  useJobsDestroyMutation,
  useJobsBeginEditCreateMutation,
  useJobsCancelEditCreateMutation,
  useJobsExportRetrieveQuery,
  useJobsMaterialsRetrieveQuery,
  useJobsMaterialsReorderCreateMutation,
  useJobsTaxRateCreateMutation,
  useMaterialsListQuery,
  useMaterialsCreateMutation,
  useMaterialsRetrieveQuery,
  useMaterialsUpdateMutation,
  useMaterialsPartialUpdateMutation,
  useMaterialsDestroyMutation,
  useScrapeRetrieveQuery,
  useSettingsRetrieveQuery,
  useSettingsUpdateMutation,
  useSettingsCompanyLogoUpdateMutation,
  useSettingsCompanyLogoDestroyMutation,
  useStoresListQuery,
  useStoresCreateMutation,
  useStoresRetrieveQuery,
  useStoresUpdateMutation,
  useStoresPartialUpdateMutation,
  useStoresDestroyMutation,
  useSystemRetrieveQuery,
  useTagsListQuery,
  useTagsCreateMutation,
  useTagsRetrieveQuery,
  useTagsUpdateMutation,
  useTagsPartialUpdateMutation,
  useTagsDestroyMutation,
  useUnitsListQuery,
  useUnitsCreateMutation,
  useUnitsRetrieveQuery,
  useUnitsUpdateMutation,
  useUnitsPartialUpdateMutation,
  useUnitsDestroyMutation,
} = injectedRtkApi;
