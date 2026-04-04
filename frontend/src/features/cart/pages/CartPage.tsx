import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useCart } from "../hooks";
import { useJobs } from "@/features/jobs/hooks";
import { useClients } from "@/features/clients/hooks";
import { useSettings } from "@/features/settings/hooks";
import { CenteredSpinner } from "@/components/shared/Spinner";
import {
  Trash2,
  Save,
  Pencil,
  Calendar,
  ArrowLeft,
  Plus,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ComboboxSelect } from "@/components/shared/ComboboxSelect";
import { useLocation, useNavigate } from "react-router-dom";
import { useDrop } from "react-dnd";
import { format } from "date-fns";
import { Helmet } from "react-helmet";
import type {
  JobMaterialRead,
  JobGroupRead,
} from "@/services/generatedApi";
import { GroupDropZone, GroupNameHeader } from "../components/CartGroups";
import {
  CartItemDragObject,
  CartItemRow,
  DropIndicator,
} from "../components/CartItemRow";
import { LaborSection } from "../components/LaborSection";
import { ExportPopover } from "../components/ExportPopover";
import { MaterialDetailModal } from "@/features/materials/components/MaterialDetailModal";
import { useMaterialsListQuery } from "@/services/api";
import type { MaterialNestedRead } from "@/services/generatedApi";

const TEXT_DISCARD_CHANGES = "Discard changes? Your edits will not be saved.";

export const CartPage = () => {
  const {
    currentMaterialItems,
    currentGroups,
    updateCartItem,
    removeFromCart,
    addToCart,
    isCartEditMode,
    setCartEditMode,
    resetCartState,
    switchCart,
    currentJobId,
    selectedClient,
    setSelectedClient,
    jobDescription,
    setJobDescription,
    createJobGroup,
    updateJobGroup,
    deleteJobGroup,
    reorderCartItem,
    updateJobTaxRate,
    currentLaborItems,
    addLaborItem,
    updateLaborItem,
    deleteLaborItem,
    isViewingSavedJob,
    billSubtotal,
    billTaxTotal,
    billTotal,
    isCartLoading,
  } = useCart();
  const { addJob, updateJob, jobs, beginEditJob, cancelEditJob } = useJobs();
  const { clients, addClient } = useClients();
  const { settings } = useSettings();
  const { data: materials = [] } = useMaterialsListQuery();

  if(!settings) {
    return <CenteredSpinner className="h-64" />;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);
  const [selectedMaterialDetail, setSelectedMaterialDetail] = useState<{
    material: MaterialNestedRead;
    initialVariantId?: number;
    initialStoreId?: number;
  } | null>(null);
  const [activeJobCreatedAt, setActiveJobCreatedAt] = useState<string | null>(
    null,
  );
  const baselineRef = useRef<{
    clientId: string;
    jobDescription: string;
  } | null>(null);
  const isEditModeRef = useRef(isCartEditMode);
  const isViewingSavedJobRef = useRef(false);

  /* ── DnD: track pending drop indicator ── */
  const [dropTarget, setDropTarget] = useState<{
    groupId: number;
    index: number;
  } | null>(null);

  /* ── Labor section expand/collapse per group ── */
  const [expandedLabor, setExpandedLabor] = useState<Record<number, boolean>>(
    {},
  );
  const toggleLaborExpanded = (groupId: number) =>
    setExpandedLabor((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  /* ── Inline tax rate editing ── */
  const [isEditingTaxRate, setIsEditingTaxRate] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState("");
  const taxRateInputRef = useRef<HTMLInputElement>(null);

  const locationJobId = useMemo(() => {
    const raw = (location.state as { jobId?: string | number } | null)?.jobId;
    if (raw === undefined || raw === null) return null;
    return typeof raw === "number" ? raw : Number(raw);
  }, [location.state]);

  // For the draft cart (new cart), editing is always allowed
  const canEditCart = !isViewingSavedJob || isCartEditMode;

  useEffect(() => {
    isEditModeRef.current = isCartEditMode;
    isViewingSavedJobRef.current = isViewingSavedJob;
  }, [isCartEditMode, isViewingSavedJob]);

  useEffect(() => {
    if (!locationJobId) return;
    setCartEditMode(false);
    baselineRef.current = null;
    switchCart(locationJobId);
  }, [locationJobId, switchCart, setCartEditMode]);

  // When navigating away from a saved job (read-only), switch back to the draft cart
  useEffect(() => {
    return () => {
      if (isViewingSavedJobRef.current && !isEditModeRef.current) {
        resetCartState();
      }
    };
  }, [resetCartState]);

  useEffect(() => {
    if (!currentJobId) return;
    const job = jobs.find((j) => j.id === currentJobId);
    if (!job) return;
    setSelectedClient(job.client?.id !== undefined ? String(job.client.id) : "");
    setJobDescription(String(job.id));
    setActiveJobCreatedAt(job.createdAt ?? null);
  }, [currentJobId, jobs]);

  // Capture baseline for detecting header field changes when entering edit mode
  useEffect(() => {
    if (!currentJobId || !isCartEditMode) return;
    if (baselineRef.current) return;
    baselineRef.current = {
      clientId: selectedClient,
      jobDescription,
    };
  }, [currentJobId, isCartEditMode, jobDescription, selectedClient]);

  // Drag and drop target — only allow dropping when cart is editable
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "MATERIAL",
      canDrop: () => canEditCart,
      drop: (item: any) => {
        if (!canEditCart) return;
        const { material, variantId, storeId } = item;
        const variant = material.variants.find((v: any) => v.id === variantId);
        const fallbackStoreId = variant?.stores?.[0]?.store?.id;
        const resolvedStoreId = storeId ?? fallbackStoreId;
        if (variant) {
          if (!resolvedStoreId) return;
          addToCart({
            groupId: currentGroups[currentGroups.length - 1]?.id ?? 0,
            variantId: variant.id,
            storeId: resolvedStoreId,
            quantity: 1,
          });
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
    [addToCart, canEditCart, currentGroups],
  );

  // Group items by their group
  const groupedItems = useMemo(() => {
    const sortedGroups = [...currentGroups].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    if (sortedGroups.length === 0) {
      return [
        {
          group: {
            id: 0,
            jobId: currentJobId ?? 0,
            name: null,
            sortOrder: 0,
            subtotal: 0,
            taxTotal: 0,
            total: 0,
            laborTimeTotal: 0,
            laborCostTotal: 0,
          } as JobGroupRead,
          items: currentMaterialItems,
        },
      ];
    }
    return sortedGroups.map((group) => ({
      group,
      items: currentMaterialItems
        .filter((item) => item.groupId === group.id)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    }));
  }, [currentGroups, currentMaterialItems]);

  const handleSave = async (): Promise<number | undefined> => {
    if (!jobDescription) {
      alert("Please enter a job description");
      return;
    }

    if (!selectedClient) {
      alert("Please select a client");
      return;
    }

    setIsSaving(true);
    try {
      // Check if client exists, if not create it
      let clientId =
        clients.find((c) => c.name === selectedClient)?.id ||
        clients.find((c) => String(c.id) === selectedClient)?.id;
      if (!clientId) {
        // Create new client
        const newClient = await addClient({
          name: selectedClient,
          email: "",
          phone: "",
          address: "",
        });
        clientId = newClient?.id;
      }
      const existingJob = jobs.find((job) => String(job.id) === jobDescription);
      const resolvedDescription = existingJob?.description ?? jobDescription;

      if (currentJobId && existingJob?.status == "saved") {
        // Updating an existing saved job
        await updateJob(currentJobId, {
          clientId,
          description: resolvedDescription,
        });
        setCartEditMode(false);
        baselineRef.current = null;
        return currentJobId;
      } else {
        // Saving the draft cart as a new job
        const result = await addJob({
          clientId,
          description: resolvedDescription,
        });
        const newJobId = result.job.id;
        switchCart(newJobId);
        setCartEditMode(false);
        baselineRef.current = null;
        return newJobId;
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save job");
    } finally {
      setIsSaving(false);
    }
  };

  const doExport = async (jobId: number, format: string, showLaborDetails: boolean, unifyGroups: boolean) => {
    const params = new URLSearchParams();
    if (format) params.set("fmt", format);
    if (showLaborDetails) params.set("showLaborDetails", "true");
    if (unifyGroups) params.set("unifyGroups", "true");
    const queryString = params.toString();
    const url = `/api/jobs/${jobId}/export${queryString ? `?${queryString}` : ""}`;

    if (format === "pdf") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Export failed");
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename =
      filenameMatch?.[1] ?? `job-export.${format === "pdf" ? "pdf" : "xlsx"}`;
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const handleExport = async (
    format: string = "excel",
    showLaborDetails: boolean = false,
    unifyGroups: boolean = false,
  ) => {
    try {
      let jobId: number | undefined;

      if (!currentJobId) {
        // New/draft cart — warn that exporting will save
        const confirmed = window.confirm(
          "Exporting will save the current job cart. Continue?",
        );
        if (!confirmed) return;
        // Save first, then export with the new job's ID
        jobId = await handleSave();
        if (!jobId) return; // save failed or was cancelled
      } else if (isCartEditMode) {
        // Saved job in edit mode — save changes first
        jobId = await handleSave();
        if (!jobId) return;
      } else {
        // Already saved and not editing — just export
        jobId = currentJobId;
      }

      // Export each selected format
      await doExport(jobId, format, showLaborDetails, unifyGroups);
    } catch (error) {
      console.error(error);
      alert("Failed to export job");
    }
  };

  const hasEdits = useMemo(() => {
    if (!isCartEditMode || !currentJobId) return false;
    // If baseline was captured, check header field changes
    if (baselineRef.current) {
      const baseline = baselineRef.current;
      if (baseline.clientId !== selectedClient) return true;
      if (baseline.jobDescription !== jobDescription) return true;
    }
    return true;
  }, [isCartEditMode, currentJobId, selectedClient, jobDescription]);

  const handleEnterEditMode = useCallback(async () => {
    if (!currentJobId) return;
    try {
      await beginEditJob(currentJobId);
      setCartEditMode(true);
      baselineRef.current = {
        clientId: selectedClient,
        jobDescription,
      };
    } catch {
      alert("Failed to enter edit mode");
    }
  }, [
    currentJobId,
    beginEditJob,
    setCartEditMode,
    selectedClient,
    jobDescription,
  ]);

  const navigateBackToLists = useCallback(async () => {
    navigate("/lists");
    resetCartState();
    baselineRef.current = null;
  }, [resetCartState, currentJobId, switchCart, navigate]);

  const handleCancelEdit = useCallback(async () => {
    if (!currentJobId) return;

    const doCancel = async () => {
      try {
        await cancelEditJob(currentJobId);
      } catch {
        // snapshot may not exist if no actual item changes were made
      }
      const baseline = baselineRef.current;
      if (baseline) {
        setSelectedClient(baseline.clientId);
        setJobDescription(baseline.jobDescription);
      }
      setCartEditMode(false);
      baselineRef.current = null;
    };

    if (hasEdits) {
      const shouldDiscard = window.confirm(TEXT_DISCARD_CHANGES);
      if (!shouldDiscard) return;
    }
    await doCancel();
  }, [currentJobId, hasEdits, cancelEditJob, setCartEditMode]);

  const handleBackClick = useCallback(async () => {
    if (isCartEditMode && hasEdits) {
      const shouldDiscard = window.confirm(TEXT_DISCARD_CHANGES);
      if (!shouldDiscard) return;
      // Cancel edit and restore snapshot
      if (currentJobId) {
        try {
          await cancelEditJob(currentJobId);
        } catch {
          // ignore
        }
      }
      setCartEditMode(false);
      baselineRef.current = null;
    }
    await navigateBackToLists();
  }, [
    isCartEditMode,
    hasEdits,
    currentJobId,
    cancelEditJob,
    setCartEditMode,
    navigateBackToLists,
  ]);

  const clientOptions = clients.map((c) => ({ value: String(c.id), label: c.name }));
  const jobOptions = useMemo(() => {
    const filtered = selectedClient
      ? jobs.filter((j) => String(j.client?.id) === selectedClient)
      : jobs;
    return filtered.map((j) => ({ value: String(j.id), label: j.description }));
  }, [jobs, selectedClient]);

  const billLaborTotal = useMemo(
    () =>
      currentGroups.reduce(
        (acc, group) => acc + Number(group.laborCostTotal ?? 0),
        0,
      ),
    [currentGroups],
  );

  const materialTotal = billTotal;
  const grandTotal = materialTotal + billLaborTotal;

  const handleJobDescriptionChange = useCallback(
    (value: string) => {
      setJobDescription(value);
      if (!selectedClient) {
        const matchedJob = jobs.find((j) => String(j.id) === value);
        if (matchedJob?.client?.id) {
          setSelectedClient(String(matchedJob.client.id));
        }
      }
    },
    [jobs, selectedClient, setJobDescription, setSelectedClient],
  );

  const handleClientChange = useCallback(
    (value: string) => {
      setSelectedClient(value);
      if (jobDescription) {
        const existingJob = jobs.find((j) => String(j.id) === jobDescription);
        if (existingJob && String(existingJob.client?.id) !== value) {
          setJobDescription("");
        }
      }
    },
    [jobs, jobDescription, setSelectedClient, setJobDescription],
  );

  const handleSplitGroup = useCallback(
    async (afterItemId: number, sourceGroupId: number) => {
      try {
        await createJobGroup(null, afterItemId, sourceGroupId);
      } catch {
        // ignore
      }
    },
    [createJobGroup],
  );

  const handleRenameGroup = useCallback(
    async (groupId: number, newName: string) => {
      try {
        await updateJobGroup(groupId, { name: newName || null });
      } catch {
        // ignore
      }
    },
    [updateJobGroup],
  );

  const handleDeleteGroup = useCallback(
    async (groupId: number, itemCount: number) => {
      if (itemCount > 0) {
        const ok = window.confirm(
          `This group has ${itemCount} item${itemCount > 1 ? "s" : ""}. Delete the group and all its items?`,
        );
        if (!ok) return;
      }
      try {
        await deleteJobGroup(groupId);
      } catch {
        // ignore
      }
    },
    [deleteJobGroup],
  );

  // Item field edit handlers (backend performs recalculation)
  const handleUnitPriceChange = useCallback(
    (item: JobMaterialRead, value: number | null) => {
      if (!canEditCart || value === null) return;
      updateCartItem(item.id, {
        unitPrice: value,
        wasPriceEdited: true,
      });
    },
    [canEditCart, updateCartItem],
  );

  const handleQuantityChange = useCallback(
    (item: JobMaterialRead, value: number | null) => {
      if (!canEditCart || value === null) return;
      updateCartItem(item.id, {
        quantity: value,
      });
    },
    [canEditCart, updateCartItem],
  );

  const handleTaxChange = useCallback(
    (item: JobMaterialRead, value: number | null) => {
      if (!canEditCart || value === null) return;
      updateCartItem(item.id, {
        tax: value,
        wasPriceEdited: true,
      });
    },
    [canEditCart, updateCartItem],
  );

  const handleTotalChange = useCallback(
    (item: JobMaterialRead, value: number | null) => {
      if (!canEditCart || value === null) return;
      updateCartItem(item.id, {
        totalPrice: value,
        wasPriceEdited: true,
      });
    },
    [canEditCart, updateCartItem],
  );

  const handleRevertPrice = useCallback(
    (item: JobMaterialRead) => {
      if (!canEditCart || !item.wasPriceEdited) return;
      const dbPrice = item.priceInfo?.price ?? item.unitPrice;
      updateCartItem(item.id, {
        unitPrice: dbPrice,
        wasPriceEdited: false,
      });
    },
    [canEditCart, updateCartItem],
  );

  const handleOpenCartItemDetails = useCallback(
    (item: JobMaterialRead) => {
      const material = materials.find((m) =>
        m.variants.some((v) => v.id === item.variantId),
      );
      if (!material) return;

      const matchedVariant =
        material.variants.find((v) => v.id === item.variantId) ??
        material.variants[0];
      const resolvedVariantId = matchedVariant?.id;
      const resolvedStoreId =
        (matchedVariant.stores ?? []).some((s) => s.store.id === item.storeId)
          ? item.storeId
          : undefined;

      setSelectedMaterialDetail({
        material,
        initialVariantId: resolvedVariantId,
        initialStoreId: resolvedStoreId,
      });
      setIsMaterialDetailOpen(true);
    },
    [materials],
  );

  const title = isViewingSavedJob ? "View Job" : "Current Job Items";

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{title} | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12">
        <div className="flex items-center gap-3">
          {isViewingSavedJob && (
            <button
              onClick={handleBackClick}
              className="text-gray-500 hover:text-gray-700 p-1 -ml-1"
              aria-label="Back to Saved Lists"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <div>
          {canEditCart && (
            <button
              type="button"
              onClick={() => createJobGroup()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--accent-fg-600)] bg-[var(--accent-600)] hover:bg-[var(--accent-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-500)]"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Group
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Cart List */}
        <div
          ref={drop}
          className={`lg:col-span-2 space-y-4 transition-colors rounded-lg ${
            isOver && canEditCart ? "ring-2 ring-[var(--accent-400)]" : ""
          }`}
        >
          {groupedItems.map(({ group, items: groupItems }, groupIdx) => {
            if (currentMaterialItems.length === 0 && currentGroups.length <= 1)
              return null;
            const hours = group.laborTimeTotal ? Math.floor(group.laborTimeTotal) : 0;
            const minutes = group.laborTimeTotal ? Math.round((group.laborTimeTotal - hours) * 60) : 0;
            return (
              <div key={group.id} className="space-y-0">
                {/* Group Name Header */}
                <div className="px-1 pb-1 flex items-center justify-between group/grouphdr">
                  <GroupNameHeader
                    name={group.name ?? null}
                    onRename={(name) => handleRenameGroup(group.id, name)}
                    disabled={!canEditCart}
                  />
                  {canEditCart && currentGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteGroup(group.id, groupItems.length)
                      }
                      className="opacity-100 sm:opacity-0 sm:group-hover/grouphdr:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600"
                      title="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Group Card — droppable zone */}
                <GroupDropZone
                  groupId={group.id}
                  itemCount={groupItems.length}
                  canDrop={canEditCart}
                  onDrop={(
                    dragObj: CartItemDragObject,
                    targetIndex: number,
                  ) => {
                    reorderCartItem(dragObj.itemId, group.id, targetIndex);
                    setDropTarget(null);
                  }}
                  onHover={(index: number) =>
                    setDropTarget({ groupId: group.id, index })
                  }
                  onLeave={() =>
                    setDropTarget((prev) =>
                      prev?.groupId === group.id ? null : prev,
                    )
                  }
                >
                  <ul className="divide-y divide-gray-200">
                    {groupItems.length === 0 && (
                      <li className="p-6 text-center text-gray-500 text-sm">
                        Drop items here
                      </li>
                    )}
                    {groupItems.map((item, idx) => {
                      const lineSubtotal = item.subtotal;
                      const lineTotal = item.totalPrice || 0;
                      const showIndicatorBefore =
                        dropTarget?.groupId === group.id &&
                        dropTarget?.index === idx;
                      return (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          idx={idx}
                          groupId={group.id}
                          images={item.images ?? []}
                          lineSubtotal={lineSubtotal}
                          lineTotal={lineTotal}
                          canEditCart={canEditCart}
                          showIndicatorBefore={showIndicatorBefore}
                          onSplit={
                            idx > 0
                              ? () =>
                                  handleSplitGroup(
                                    groupItems[idx - 1].id,
                                    group.id,
                                  )
                              : undefined
                          }
                          onRevertPrice={() => handleRevertPrice(item)}
                          onDelete={() => {
                            if (canEditCart) removeFromCart(item.id);
                          }}
                          onUnitPriceChange={(v) =>
                            handleUnitPriceChange(item, v)
                          }
                          onQuantityChange={(v) =>
                            handleQuantityChange(item, v)
                          }
                          onTaxChange={(v) => handleTaxChange(item, v)}
                          onTotalChange={(v) => handleTotalChange(item, v)}
                          onToggleIgnored={() => {
                            if (canEditCart) {
                              updateCartItem(item.id, {
                                ignored: !item.ignored,
                              });
                            }
                          }}
                          onOpenDetails={() => handleOpenCartItemDetails(item)}
                        />
                      );
                    })}
                    {/* Indicator at the very end of the group */}
                    <DropIndicator
                      visible={
                        dropTarget?.groupId === group.id &&
                        dropTarget?.index === groupItems.length
                      }
                    />
                  </ul>
                </GroupDropZone>

                {/* Group footer: subtotal, tax, total with labor toggle */}
                {groupItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleLaborExpanded(group.id)}
                    className={`mt-1 bg-[var(--accent-600)] text-[var(--accent-fg-600)] px-4 py-2 flex items-center justify-between gap-4 text-xs sm:text-sm w-full ${expandedLabor[group.id] ? "rounded-t-lg" : "rounded-lg"} hover:opacity-80 transition-opacity`}
                    title="Toggle labor items"
                  >
                    <div className="flex items-center gap-1.5">
                      {expandedLabor[group.id] ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      <Briefcase className="h-3.5 w-3.5" />
                      <span className="px-1" />
                      <div className="flex items-center gap-4">
                        {!(group.laborTimeTotal == 0) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[var(--accent-fg-600-dimmed)]" />
                            <span className="font-medium">
                              {group.laborTimeTotal && `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`}
                            </span>
                          </span>
                        )}
                        {!(group.laborCostTotal == 0) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-[var(--accent-fg-600-dimmed)]" />
                            <span className="font-medium">
                              {group.laborCostTotal.toFixed(2)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>
                        <span className="text-[var(--accent-fg-600-dimmed)] mr-1">
                          Subtotal
                        </span>
                        <span className="font-medium">
                          {group.subtotal.toFixed(2)}
                        </span>
                      </span>
                      <span>
                        <span className="text-[var(--accent-fg-600-dimmed)] mr-1">
                          Tax
                        </span>
                        <span className="font-medium">
                          {group.taxTotal.toFixed(2)}
                        </span>
                      </span>
                      <span>
                        <span className="text-[var(--accent-fg-600-dimmed)] mr-1">
                          Total
                        </span>
                        <span className="font-medium">
                          {group.total.toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </button>
                )}

                {/* Labor items section */}
                <LaborSection
                  groupId={group.id}
                  laborItems={currentLaborItems.filter(
                    (li) => li.groupId === group.id,
                  )}
                  canEdit={canEditCart}
                  expanded={!!expandedLabor[group.id]}
                  onAdd={async (gId, item) => {
                    await addLaborItem(gId, item);
                  }}
                  onUpdate={updateLaborItem}
                  onDelete={deleteLaborItem}
                />
              </div>
            );
          })}

          {isCartLoading ? (
            <CenteredSpinner className="h-48" />
          ) : currentMaterialItems.length === 0 && currentGroups.length <= 1 ? (
            <div className="bg-white shadow rounded-lg border-2 border-gray-200 p-8 text-center text-gray-500">
              Your cart is empty
            </div>
          ) : null}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Job Details</h2>
              {activeJobCreatedAt && (
                <div className="text-xs text-gray-500 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>{format(new Date(activeJobCreatedAt), "PP")}</span>
                    <Calendar className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <ComboboxSelect
                label="Client"
                options={clientOptions}
                value={selectedClient}
                onChange={handleClientChange}
                disabled={!canEditCart}
                placeholder="Search or create client..."
                createNewPrefix="Create new client:"
              />

              <ComboboxSelect
                label="Job Description/Name"
                options={jobOptions}
                value={jobDescription}
                onChange={handleJobDescriptionChange}
                disabled={!canEditCart}
                placeholder="Search or create job..."
                createNewPrefix="Create new job:"
              />
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6 space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Bill Subtotal</span>
                <span>${billSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  Total Tax (
                  {isEditingTaxRate && canEditCart ? (
                    <input
                      ref={taxRateInputRef}
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRateInput}
                      onChange={(e) => setTaxRateInput(e.target.value)}
                      onBlur={() => {
                        const parsed = parseFloat(taxRateInput);
                        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                          updateJobTaxRate(parsed / 100);
                        }
                        setIsEditingTaxRate(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          (e.target as HTMLInputElement).blur();
                        }
                        if (e.key === "Escape") {
                          setIsEditingTaxRate(false);
                        }
                      }}
                      className="w-16 px-1 py-0 text-sm border border-[var(--accent-400)] rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--accent-400)] text-right"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!canEditCart) return;
                        setTaxRateInput((settings.taxRate * 100).toFixed(2));
                        setIsEditingTaxRate(true);
                        setTimeout(() => taxRateInputRef.current?.select(), 0);
                      }}
                      disabled={!canEditCart}
                      className={`underline decoration-dotted underline-offset-2 ${
                        canEditCart
                          ? "hover:text-gray-900 cursor-pointer"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      {(settings.taxRate * 100).toFixed(2)}
                    </button>
                  )}
                  %)
                </span>
                <span>${billTaxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Material Total</span>
                <span>${materialTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Labor Total</span>
                <span>${billLaborTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-4">
                <span>Grand Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>

              <ExportPopover
                disabled={
                  !selectedClient || !jobDescription || currentMaterialItems.length === 0
                }
                onExport={handleExport}
              />

              {isViewingSavedJob && (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={isCartEditMode}
                  onClick={handleEnterEditMode}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isViewingSavedJob && isCartEditMode && (
                <div className="flex gap-2">
                  <Button
                    className="w-1/2"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={!isCartEditMode}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-1/2"
                    onClick={handleSave}
                    disabled={
                      isSaving || currentMaterialItems.length === 0 || !canEditCart
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
              {!isViewingSavedJob && (
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={isSaving || currentMaterialItems.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedMaterialDetail && (
        <MaterialDetailModal
          material={selectedMaterialDetail.material}
          open={isMaterialDetailOpen}
          onOpenChange={setIsMaterialDetailOpen}
          initialVariantId={selectedMaterialDetail.initialVariantId}
          initialStoreId={selectedMaterialDetail.initialStoreId}
          highlightVariantId={selectedMaterialDetail.initialVariantId}
          highlightStoreId={selectedMaterialDetail.initialStoreId}
        />
      )}
    </div>
  );
};
