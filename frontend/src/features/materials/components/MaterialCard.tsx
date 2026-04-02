import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  FC,
  PointerEvent,
} from "react";
import Fuse from "fuse.js";
import {
  MoreVertical,
  ShoppingCart,
  Edit,
  Trash,
  Store as StoreIcon,
  ChevronDown,
} from "lucide-react";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";
import * as Popover from "@radix-ui/react-popover";
import type { MaterialNestedRead } from "@/services/generatedApi";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDrag } from "react-dnd";
import { Link } from "react-router-dom";
import { AddToCartPopover } from "./AddToCartPopover";
import { MaterialImageCarousel } from "./MaterialImageCarousel";
import { useIsTouchDevice } from "@/components/ui/use-mobile";
import { MaterialDetailModal } from "./MaterialDetailModal";
import { useNonPassiveWheelListener } from "@/hooks/useNonPassiveWheelListener";
import { useDetectTruncation } from '@/hooks/useDetectTruncation';
import { useMaterialImages } from '../lib/materialImages';

const INTERACTIVE_SELECTOR = "button,a,input,select,textarea,[role='button']";

type VariantStoreCandidate = {
  variantId: number;
  variantName: string;
  storeId: number | null;
  storeName: string;
  sku: string;
};

function findBestMatchWithFuse(
  candidates: VariantStoreCandidate[],
  defaultVariantId: number,
  query: string,
  filterStoreIds: string[],
): { variantId: number; storeId?: number } {
  if (candidates.length === 0) {
    return { variantId: defaultVariantId };
  }

  const trimmedQuery = query.trim();
  const storeIdSet = new Set(filterStoreIds.map(String));

  let pool = candidates;
  if (storeIdSet.size > 0) {
    const filtered = candidates.filter(
      (candidate) =>
        candidate.storeId !== null && storeIdSet.has(String(candidate.storeId)),
    );
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  if (!trimmedQuery) {
    const first = pool[0] ?? candidates[0];
    return {
      variantId: first?.variantId ?? defaultVariantId,
      ...(first?.storeId !== null ? { storeId: first?.storeId } : {}),
    };
  }

  const fuse = new Fuse(pool, {
    threshold: 0.35,
    ignoreLocation: true,
    includeScore: true,
    keys: [
      { name: "variantName", weight: 2 },
      { name: "storeName", weight: 1.5 },
      { name: "sku", weight: 1.75 },
    ],
  });

  const hit = fuse.search(trimmedQuery)[0]?.item ?? pool[0] ?? candidates[0];
  return {
    variantId: hit?.variantId ?? defaultVariantId,
    ...(hit?.storeId !== null ? { storeId: hit?.storeId } : {}),
  };
}

interface MaterialCardProps {
  material: MaterialNestedRead;
  onDelete: (id: number) => void;
  searchQuery?: string;
  filterStoreIds?: string[];
}

export const MaterialCard: FC<MaterialCardProps> = ({
  material,
  onDelete,
  searchQuery = "",
  filterStoreIds = [],
}) => {
  const defaultVariantId = material.variants[0]?.id ?? -1;
  const [selectedVariant, setSelectedVariant] = useState(
    defaultVariantId,
  );
  const [isTouchHoldActive, setIsTouchHoldActive] = useState(false);
  const touchHoldTimeoutRef = useRef<number | null>(null);
  const variantSelectRef = useRef<HTMLSelectElement | null>(null);
  const storeSelectRef = useRef<HTMLSelectElement | null>(null);
  const isTouchDevice = useIsTouchDevice();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false);
  const [isOptionsPopoverOpen, setIsOptionsPopoverOpen] = useState(false);
  const [isOptionsTooltipOpen, setIsOptionsTooltipOpen] = useState(false);
  const [suppressOptionsTooltip, setSuppressOptionsTooltip] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number>(-1);

  const variantStoreCandidates = useMemo<VariantStoreCandidate[]>(() => {
    const candidates: VariantStoreCandidate[] = [];

    for (const variant of material.variants) {
      const stores = variant.stores ?? [];
      if (stores.length === 0) {
        candidates.push({
          variantId: variant.id,
          variantName: variant.name ?? "",
          storeId: null,
          storeName: "",
          sku: "",
        });
        continue;
      }

      for (const storeInfo of stores) {
        candidates.push({
          variantId: variant.id,
          variantName: variant.name ?? "",
          storeId: storeInfo.store.id,
          storeName: storeInfo.store.name ?? "",
          sku: storeInfo.sku ?? "",
        });
      }
    }

    return candidates;
  }, [material]);

  const currentVariant =
    material.variants.find((v) => v.id === selectedVariant) ||
    material.variants[0];
  const hasSingleNamedVariant =
    material.variants.length === 1 &&
    Boolean((material.variants[0]?.name ?? "").trim());
  const showVariantSelector =
    material.variants.length > 1 || hasSingleNamedVariant;
  const variantStores = currentVariant?.stores ?? [];
  const selectedStore =
    variantStores.find((storeInfo) => storeInfo.store.id === selectedStoreId) ??
    variantStores[0];
  const effectiveStoreId = selectedStore?.store.id;
  const materialImages = useMaterialImages(material);
  const currentVariantPrice =
    variantStores.length > 0
      ? Math.min(...variantStores.map((s) => Number(s.price)))
      : 0;
  const displayedPrice = selectedStore
    ? Number(selectedStore.price)
    : currentVariantPrice;
  const currentVariantUnit = currentVariant?.unit || "—";
  const hasStores = variantStores.length > 0;
  const hasMultipleStores = variantStores.length > 1;
  const carouselImages = materialImages?.resolve({
    variantId: currentVariant?.id,
    storeId: effectiveStoreId,
  }) ?? [];
  const visibleTags = material.tags.slice(0, 3);
  const overflowTags = material.tags.slice(3);
  const { ref: descRef, isTruncated } = useDetectTruncation<HTMLHeadingElement>();

  // Drag and drop
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "MATERIAL",
      item: { material, variantId: selectedVariant, storeId: effectiveStoreId },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [material, selectedVariant, effectiveStoreId],
  );

  useEffect(() => {
    if (variantStores.length === 0) {
      setSelectedStoreId(-1);
      return;
    }

    const hasExistingSelected = variantStores.some(
      (storeInfo) => storeInfo.store.id === selectedStoreId,
    );

    if (!hasExistingSelected) {
      setSelectedStoreId(variantStores[0].store.id);
    }
  }, [variantStores, selectedStoreId]);

  // Auto-select the best variant/store based on search query and store filters
  useEffect(() => {
    const best = findBestMatchWithFuse(
      variantStoreCandidates,
      defaultVariantId,
      searchQuery,
      filterStoreIds,
    );
    setSelectedVariant(best.variantId);
    if (best.storeId !== undefined) {
      setSelectedStoreId(best.storeId);
    }
  }, [
    defaultVariantId,
    filterStoreIds,
    searchQuery,
    variantStoreCandidates,
  ]);

  useEffect(() => {
    return () => {
      if (touchHoldTimeoutRef.current) {
        window.clearTimeout(touchHoldTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDragging) {
      setIsTouchHoldActive(false);
    }
  }, [isDragging]);

  const startTouchHold = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    if (touchHoldTimeoutRef.current) {
      window.clearTimeout(touchHoldTimeoutRef.current);
    }
    touchHoldTimeoutRef.current = window.setTimeout(() => {
      setIsTouchHoldActive(true);
    }, 250);
  };

  const endTouchHold = () => {
    if (touchHoldTimeoutRef.current) {
      window.clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }
    setIsTouchHoldActive(false);
  };

  const showTouchHold = isTouchHoldActive || isDragging;
  const selectedVariantIndex = Math.max(
    0,
    material.variants.findIndex(
      (variant) => variant.id === selectedVariant,
    ),
  );
  const handleVariantWheel = useCallback(
    (event: WheelEvent) => {
      if (material.variants.length <= 1) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex =
        (selectedVariantIndex + direction + material.variants.length) %
        material.variants.length;
      setSelectedVariant(
        material.variants[nextIndex]?.id ?? selectedVariant,
      );
    },
    [material.variants, selectedVariant, selectedVariantIndex],
  );

  const selectedStoreIndex = Math.max(
    0,
    variantStores.findIndex((storeInfo) => storeInfo.store.id === selectedStoreId),
  );

  const handleStoreWheel = useCallback(
    (event: WheelEvent) => {
      if (variantStores.length <= 1) return;
      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex =
        (selectedStoreIndex + direction + variantStores.length) % variantStores.length;
      const nextStoreId = variantStores[nextIndex]?.store.id;
      if (nextStoreId !== undefined) {
        setSelectedStoreId(nextStoreId);
      }
    },
    [variantStores, selectedStoreIndex],
  );

  useNonPassiveWheelListener(variantSelectRef, handleVariantWheel, material.variants.length > 1);
  useNonPassiveWheelListener(storeSelectRef, handleStoreWheel, variantStores.length > 1);

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    if (isAddPopoverOpen) return;
    if (isOptionsPopoverOpen) return;
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    setIsDetailOpen(true);
  };

  return (
    <div
      ref={drag}
      style={{ touchAction: showTouchHold ? "none" : "pan-y" }}
      onPointerDown={startTouchHold}
      onPointerUp={endTouchHold}
      onPointerCancel={endTouchHold}
      onContextMenu={(event) => {
        if (isTouchDevice) {
          event.preventDefault();
        }
      }}
      onClick={handleCardClick}
      className={`group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col cursor-default ${isDragging ? "opacity-50" : ""} ${showTouchHold ? "ring-2 ring-[var(--accent-400)] ring-offset-2" : ""}`}
    >
      <div className="aspect-square bg-white relative overflow-hidden">
        {carouselImages.length > 0 ? (
          <MaterialImageCarousel
            images={carouselImages}
            alt={material.description}
            imageClassName="h-full w-full object-contain pointer-events-none transition-transform duration-300 ease-out will-change-transform group-hover:scale-110"
          />
        ) : (
          <ImagePlaceholder size="w-full h-full" iconSize="h-12 w-12" />
        )}

        {/* Variant selector on top right */}
        {showVariantSelector && (
          <div className="absolute top-2 left-2 z-20">
            <div className="relative">
              <select
                ref={variantSelectRef}
                className={`text-xs rounded-md border-gray-300 bg-white/90 backdrop-blur-sm shadow-sm px-2 py-1 focus:border-[var(--accent-500)] focus:ring-[var(--accent-500)] appearance-none ${material.variants.length <= 1 ? "cursor-default" : "cursor-pointer pr-4"}`}
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                disabled={material.variants.length <= 1}
                aria-label="Select variant"
              >
                {material.variants.map((v) => {
                  const hasProxies = material.variants.some((pv) => pv.sourceVariantId === v.id);
                  const showUnit = v.isProxy || hasProxies;
                  const label = v.name || "Standard";
                  return (
                    <option key={v.id} value={v.id}>
                      {showUnit ? `${label} (${v.unit})` : label}
                    </option>
                  );
                })}
              </select>
              {material.variants.length > 1 ? (
                <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
              ) : null}
            </div>
          </div>
        )}

        {/* Overlay actions on hover */}
        <div
          className={`absolute top-2 right-2 flex gap-2 transition-opacity z-20 ${isTouchDevice ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <Popover.Root
            open={isAddPopoverOpen}
            onOpenChange={setIsAddPopoverOpen}
            modal
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover.Trigger asChild>
                  <button
                    className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-[var(--accent-50)] text-[var(--accent-600)]"
                    aria-label="Add"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </Popover.Trigger>
              </TooltipTrigger>
              <TooltipContent side="top">Add</TooltipContent>
            </Tooltip>
            <AddToCartPopover
              material={material}
              variantId={selectedVariant}
              onVariantChange={setSelectedVariant}
              storeId={selectedStoreId}
              onStoreChange={setSelectedStoreId}
              hideVariantSelect={!showVariantSelector}
              onOpenChange={setIsAddPopoverOpen}
            />
          </Popover.Root>

          <Popover.Root
            open={isOptionsPopoverOpen}
            onOpenChange={(open) => {
              setIsOptionsPopoverOpen(open);
              setIsOptionsTooltipOpen(false);
              setSuppressOptionsTooltip(true);
            }}
            modal
          >
            <Tooltip
              open={
                !isOptionsPopoverOpen &&
                !suppressOptionsTooltip &&
                isOptionsTooltipOpen
              }
              onOpenChange={(open) => {
                if ((suppressOptionsTooltip || isOptionsPopoverOpen) && open) return;
                setIsOptionsTooltipOpen(open);
              }}
            >
              <TooltipTrigger asChild>
                <Popover.Trigger asChild>
                  <button
                    className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-600"
                    aria-label="More options"
                    onPointerDown={() => {
                      setSuppressOptionsTooltip(true);
                      setIsOptionsTooltipOpen(false);
                    }}
                    onPointerLeave={() => setSuppressOptionsTooltip(false)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </Popover.Trigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">More options</TooltipContent>
            </Tooltip>
            <Popover.Portal>
              <Popover.Content
                className="w-40 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1"
                align="end"
                sideOffset={5}
              >
                <Link
                  to={`/materials/${material.id}/edit`}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--accent-50)] flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Link>
                <button
                  onClick={() => onDelete(material.id)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash className="h-4 w-4 mr-2" /> Delete
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 ref={descRef} className="text-sm font-medium leading-5 text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {isTruncated ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">{material.description}</span>
              </TooltipTrigger>
              <TooltipContent side="top">{material.description}</TooltipContent>
            </Tooltip>
          ) : (
            <span>{material.description}</span>
          )}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          {hasStores ? (
            <div className="flex items-center text-xs text-gray-500 min-w-0">
              <StoreIcon className="h-3 w-3 mr-1" />
              <div className="relative min-w-0">
                <select
                  ref={storeSelectRef}
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(Number(event.target.value))}
                  disabled={!hasMultipleStores}
                  className={`appearance-none bg-transparent text-xs text-gray-500 focus:outline-none max-w-[9rem] truncate ${hasMultipleStores ? "cursor-pointer pr-4" : "cursor-default"}`}
                  aria-label="Select store"
                >
                  {variantStores.map((storeInfo) => (
                    <option key={storeInfo.id} value={storeInfo.store.id}>
                      {storeInfo.store?.name || "Unknown Store"}
                    </option>
                  ))}
                </select>
                {hasMultipleStores ? (
                  <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500">{currentVariantUnit}</span>
            <span className="text-lg font-bold text-gray-900">
              ${displayedPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
          {overflowTags.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 cursor-default">
                  ...
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="flex flex-col">
                  {overflowTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <MaterialDetailModal
        material={material}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        initialVariantId={selectedVariant}
      />
    </div>
  );
};
