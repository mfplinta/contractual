import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { RootState } from "@/app/store";
import type {
  JobLabor,
  PatchedJobGroup,
  PatchedJobLabor,
  PatchedJobMaterial,
} from "@/services/generatedApi";
import {
  setCurrentJobId,
  setCartEditMode,
  setSelectedClient,
  setJobDescription,
  setCartPreviewScrollTop,
  setCartPreviewKnownItemIds,
  resetCartState,
  setIsViewingSavedJob,
} from "./cartSlice";
import {
  useJobsMaterialsRetrieveQuery,
  useJobsGroupsMaterialsCreateMutation,
  useJobsGroupsMaterialsDestroyMutation,
  useJobsGroupsMaterialsPartialUpdateMutation,
  useJobsGroupsCreateMutation,
  useJobsGroupsPartialUpdateMutation,
  useJobsGroupsDestroyMutation,
  useJobsMaterialsReorderCreateMutation,
  useJobsTaxRateCreateMutation,
  useJobsGroupsLaborCreateMutation,
  useJobsGroupsLaborPartialUpdateMutation,
  useJobsGroupsLaborDestroyMutation,
} from "@/services/api";

const DRAFT_JOB_PK = "draft";

export const useCart = () => {
  const dispatch = useAppDispatch();

  const currentJobId = useAppSelector(
    (state: RootState) => state.cart.currentJobId,
  );
  const isViewingSavedJob = useAppSelector(
    (state: RootState) => state.cart.isViewingSavedJob,
  );
  const isCartEditMode = useAppSelector(
    (state: RootState) => state.cart.isEditMode,
  );
  const selectedClient = useAppSelector(
    (state: RootState) => state.cart.selectedClient,
  );
  const jobDescription = useAppSelector(
    (state: RootState) => state.cart.jobDescription,
  );
  const cartPreviewScrollTop = useAppSelector(
    (state: RootState) => state.cart.cartPreviewScrollTop,
  );
  const cartPreviewKnownItemIds = useAppSelector(
    (state: RootState) => state.cart.cartPreviewKnownItemIds,
  );

  const activeJobRef =
    isViewingSavedJob && currentJobId
      ? String(currentJobId)
      : DRAFT_JOB_PK;

  const {
    data: jobItemsData = { materialItems: [], laborItems: [], groups: [] },
  } = useJobsMaterialsRetrieveQuery({ id: activeJobRef });

  const currentMaterialItems = jobItemsData.materialItems;
  const currentGroups = jobItemsData.groups;
  const currentLaborItems = jobItemsData.laborItems;

  const itemCount = useMemo(
    () => currentMaterialItems.reduce((acc, item) => acc + Number(item.quantity ?? 0), 0),
    [currentMaterialItems],
  );

  const billSubtotal = useMemo(
    () => currentGroups.reduce((acc, group) => acc + Number(group.subtotal ?? 0), 0),
    [currentGroups],
  );

  const billTaxTotal = useMemo(
    () => currentGroups.reduce((acc, group) => acc + Number(group.taxTotal ?? 0), 0),
    [currentGroups],
  );

  const billTotal = useMemo(() => billSubtotal + billTaxTotal, [billSubtotal, billTaxTotal]);

  const [addJobMaterialMutation] = useJobsGroupsMaterialsCreateMutation();
  const [removeJobMaterialMutation] =
    useJobsGroupsMaterialsDestroyMutation();
  const [updateJobMaterialMutation] =
    useJobsGroupsMaterialsPartialUpdateMutation();
  const [createJobGroupMutation] = useJobsGroupsCreateMutation();
  const [updateJobGroupMutation] = useJobsGroupsPartialUpdateMutation();
  const [deleteJobGroupMutation] = useJobsGroupsDestroyMutation();
  const [reorderJobMaterialMutation] =
    useJobsMaterialsReorderCreateMutation();
  const [updateJobTaxRateMutation] = useJobsTaxRateCreateMutation();
  const [addJobLaborMutation] = useJobsGroupsLaborCreateMutation();
  const [updateJobLaborMutation] =
    useJobsGroupsLaborPartialUpdateMutation();
  const [deleteJobLaborMutation] = useJobsGroupsLaborDestroyMutation();

  const addToCart = useCallback(
    (item: {
      groupId: number;
      variantId: number;
      storeId: number;
      quantity?: number;
      notes?: string | null;
      wasPriceEdited?: boolean;
      ignored?: boolean;
      unit?: string | null;
      sortOrder?: number;
    }) => {
      addJobMaterialMutation({
        jobPk: activeJobRef,
        groupPk: item.groupId,
        jobMaterialCreateRequest: {
          variantId: item.variantId,
          storeId: item.storeId,
          quantity: item.quantity ?? 1,
          notes: item.notes ?? undefined,
          wasPriceEdited: item.wasPriceEdited,
          ignored: item.ignored,
          sortOrder: item.sortOrder,
        },
      })
        .unwrap()
        .catch(() => undefined);
    },
    [activeJobRef, addJobMaterialMutation],
  );

  const updateCartItem = useCallback(
    (itemId: number, updates: PatchedJobMaterial) => {
      const item = currentMaterialItems.find((i) => i.id === itemId);
      if (!item?.id || !item.groupId) return;
      updateJobMaterialMutation({
        jobPk: activeJobRef,
        groupPk: item.groupId,
        id: item.id,
        patchedJobMaterial: updates,
      })
        .unwrap()
        .catch(() => undefined);
    },
    [activeJobRef, currentMaterialItems, updateJobMaterialMutation],
  );

  const removeFromCart = useCallback(
    (itemId: number) => {
      const item = currentMaterialItems.find((i) => i.id === itemId);
      if (!item?.id || !item.groupId) return;
      removeJobMaterialMutation({
        jobPk: activeJobRef,
        groupPk: item.groupId,
        id: item.id,
      })
        .unwrap()
        .catch(() => undefined);
    },
    [activeJobRef, currentMaterialItems, removeJobMaterialMutation],
  );

  const switchCart = useCallback(
    (id: number | null) => {
      if (id !== null) {
        dispatch(setCurrentJobId(id));
        dispatch(setIsViewingSavedJob(true));
        return;
      }
      dispatch(setCurrentJobId(null));
      dispatch(setIsViewingSavedJob(false));
      dispatch(setCartEditMode(true));
    },
    [dispatch],
  );

  const setCartEditModeHandler = useCallback(
    (isEditMode: boolean) => {
      dispatch(setCartEditMode(isEditMode));
    },
    [dispatch],
  );

  const resetCartStateHandler = useCallback(() => {
    dispatch(resetCartState());
  }, [dispatch]);

  const setSelectedClientHandler = useCallback(
    (client: string) => {
      dispatch(setSelectedClient(client));
    },
    [dispatch],
  );

  const setJobDescriptionHandler = useCallback(
    (description: string) => {
      dispatch(setJobDescription(description));
    },
    [dispatch],
  );

  const setCartPreviewScrollTopHandler = useCallback(
    (scrollTop: number) => {
      dispatch(setCartPreviewScrollTop(scrollTop));
    },
    [dispatch],
  );

  const setCartPreviewKnownItemIdsHandler = useCallback(
    (itemIds: number[]) => {
      dispatch(setCartPreviewKnownItemIds(itemIds));
    },
    [dispatch],
  );

  const createJobGroup = useCallback(
    async (
      name?: string | null,
      splitAfterItemId?: number,
      sourceGroupId?: number,
    ) => {
      return await createJobGroupMutation({
        jobPk: activeJobRef,
        jobGroupCreateRequest: { name, splitAfterItemId, sourceGroupId },
      }).unwrap();
    },
    [activeJobRef, createJobGroupMutation],
  );

  const updateJobGroup = useCallback(
    async (groupId: number, updates: PatchedJobGroup) => {
      await updateJobGroupMutation({
        jobPk: activeJobRef,
        id: groupId,
        patchedJobGroup: updates,
      }).unwrap();
    },
    [activeJobRef, updateJobGroupMutation],
  );

  const deleteJobGroup = useCallback(
    async (groupId: number) => {
      await deleteJobGroupMutation({
        jobPk: activeJobRef,
        id: groupId,
      }).unwrap();
    },
    [activeJobRef, deleteJobGroupMutation],
  );

  const reorderCartItem = useCallback(
    async (itemId: number, targetGroupId: number, targetIndex: number) => {
      await reorderJobMaterialMutation({
        id: activeJobRef,
        reorderMaterialRequest: { itemId, targetGroupId, targetIndex },
      }).unwrap();
    },
    [activeJobRef, reorderJobMaterialMutation],
  );

  const updateJobTaxRate = useCallback(
    async (taxRate: number) => {
      await updateJobTaxRateMutation({
        id: activeJobRef,
        updateTaxRateRequest: { taxRate },
      }).unwrap();
    },
    [activeJobRef, updateJobTaxRateMutation],
  );

  const addLaborItem = useCallback(
    async (groupId: number, item: JobLabor) => {
      return await addJobLaborMutation({
        jobPk: activeJobRef,
        groupPk: groupId,
        jobLabor: item,
      }).unwrap();
    },
    [activeJobRef, addJobLaborMutation],
  );

  const updateLaborItem = useCallback(
    (groupId: number, laborId: number, updates: PatchedJobLabor) => {
      updateJobLaborMutation({
        jobPk: activeJobRef,
        groupPk: groupId,
        id: laborId,
        patchedJobLabor: updates,
      }).unwrap();
    },
    [activeJobRef, updateJobLaborMutation],
  );

  const deleteLaborItem = useCallback(
    (groupId: number, laborId: number) => {
      deleteJobLaborMutation({
        jobPk: activeJobRef,
        groupPk: groupId,
        id: laborId,
      })
        .unwrap()
        .catch(() => undefined);
    },
    [activeJobRef, deleteJobLaborMutation],
  );

  return {
    currentJobId,
    isViewingSavedJob,
    isCartEditMode,
    selectedClient,
    jobDescription,
    cartPreviewScrollTop,
    cartPreviewKnownItemIds,
    currentMaterialItems,
    currentGroups,
    currentLaborItems,
    itemCount,
    billSubtotal,
    billTaxTotal,
    billTotal,
    addToCart,
    addJobMaterial: addToCart,
    updateCartItem,
    removeFromCart,
    switchCart,
    setActiveJobId: switchCart,
    setCartEditMode: setCartEditModeHandler,
    setSelectedClient: setSelectedClientHandler,
    setJobDescription: setJobDescriptionHandler,
    setCartPreviewScrollTop: setCartPreviewScrollTopHandler,
    setCartPreviewKnownItemIds: setCartPreviewKnownItemIdsHandler,
    resetCartState: resetCartStateHandler,
    createJobGroup,
    updateJobGroup,
    deleteJobGroup,
    reorderCartItem,
    updateJobTaxRate,
    addLaborItem,
    addJobLabor: addLaborItem,
    updateLaborItem,
    deleteLaborItem,
  };
};
