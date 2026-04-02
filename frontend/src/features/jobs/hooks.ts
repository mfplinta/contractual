import { useCallback } from "react";
import { useAppDispatch } from "@/app/hooks";
import type { JobWrite } from "@/services/generatedApi";
import {
  useJobsListQuery,
  useJobsCreateMutation,
  useJobsUpdateMutation,
  useJobsDestroyMutation,
  useJobsBeginEditCreateMutation,
  useJobsCancelEditCreateMutation,
  useLazyJobsMaterialsRetrieveQuery,
  api,
} from "@/services/api";

export const useJobs = () => {
  const dispatch = useAppDispatch();
  const { data: jobs = [] } = useJobsListQuery();

  const [addJobMutation] = useJobsCreateMutation();
  const [updateJobMutation] = useJobsUpdateMutation();
  const [deleteJobMutation] = useJobsDestroyMutation();
  const [beginEditJobMutation] = useJobsBeginEditCreateMutation();
  const [cancelEditJobMutation] = useJobsCancelEditCreateMutation();
  const [getJobItemsTrigger] = useLazyJobsMaterialsRetrieveQuery();

  const addJob = useCallback(
    async (data: JobWrite) => {
      const result = await addJobMutation({ job: data }).unwrap();
      dispatch(
        api.util.invalidateTags([
          { type: "Jobs", id: `jobs-${result.job.id}` },
        ]),
      );
      return result;
    },
    [addJobMutation, dispatch],
  );

  const updateJob = useCallback(
    async (id: number, data: JobWrite) => {
      const result = await updateJobMutation({ id, job: data }).unwrap();
      dispatch(
        api.util.invalidateTags([
          { type: "Jobs", id: `jobs-${result.id}` },
        ]),
      );
      return result;
    },
    [updateJobMutation, dispatch],
  );

  const deleteJob = useCallback(
    (id: number) => {
      deleteJobMutation({ id })
        .unwrap()
        .catch(() => undefined);
    },
    [deleteJobMutation],
  );

  const beginEditJob = useCallback(
    async (jobId: number) => {
      await beginEditJobMutation({ id: jobId }).unwrap();
    },
    [beginEditJobMutation],
  );

  const cancelEditJob = useCallback(
    async (jobId: number) => {
      await cancelEditJobMutation({ id: jobId }).unwrap();
    },
    [cancelEditJobMutation],
  );

  const loadJobMaterials = useCallback(
    async (id: number) => {
      await getJobItemsTrigger({ id: String(id) }).unwrap();
    },
    [getJobItemsTrigger],
  );

  return {
    jobs,
    addJob,
    updateJob,
    deleteJob,
    beginEditJob,
    cancelEditJob,
    loadJobMaterials,
  };
};
