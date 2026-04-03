import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, ShoppingCart, Edit, Trash, ChevronRight, ChevronDown, ArrowUpDown } from 'lucide-react';
import { ImagePlaceholder } from '@/components/shared/ImagePlaceholder';
import * as Popover from '@radix-ui/react-popover';
import type { MaterialImageRead, MaterialNestedRead } from '@/services/generatedApi';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableRow, TableCell } from '@/components/ui/table';
import { useDrag } from 'react-dnd';
import { useIsTouchDevice } from '@/components/ui/use-mobile';
import { AddToCartPopover } from './AddToCartPopover';
import { MaterialImageCarousel } from './MaterialImageCarousel';
import { MaterialDetailModal } from './MaterialDetailModal';
import { useMaterialImages } from '../lib/materialImages';
import { Link } from 'react-router-dom';

const TOUCH_HOLD_DELAY = 250;
const INTERACTIVE_SELECTOR = "button,a,input,select,textarea,[role='button']";

const MaterialThumbnail = ({ images, alt }: { images: MaterialImageRead[]; alt: string }) => (
  <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
    {images.length > 0 ? (
      <MaterialImageCarousel
        images={images}
        alt={alt}
        className="h-full w-full"
        imageClassName="h-full w-full object-cover"
        showDotsOnHover={false}
      />
    ) : (
      <ImagePlaceholder size="h-full w-full" iconSize="h-5 w-5" />
    )}
  </div>
);

const MoreOptionsMenu = ({
  materialId,
  onDelete,
}: {
  materialId: number;
  onDelete: (id: number) => void;
}) => (
  <Popover.Root>
    <Tooltip>
      <TooltipTrigger asChild>
        <Popover.Trigger asChild>
          <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()} aria-label="More options">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </Popover.Trigger>
      </TooltipTrigger>
      <TooltipContent side="top">More options</TooltipContent>
    </Tooltip>
    <Popover.Portal>
      <Popover.Content
        className="w-40 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1"
        align="end"
        sideOffset={5}
      >
        <Link
          to={`/materials/${materialId}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--accent-50)] flex items-center"
        >
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(materialId);
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
        >
          <Trash className="h-4 w-4 mr-2" /> Delete
        </button>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

const AddToCartButton = ({
  material,
  variantId,
  hideVariantSelect,
  activeVariantId,
  setActiveVariantId,
}: {
  material: MaterialNestedRead;
  variantId: number | undefined;
  hideVariantSelect: boolean;
  activeVariantId: number | null;
  setActiveVariantId: (value: number | null) => void;
}) => (
  <Popover.Root
    open={activeVariantId === (variantId ?? null)}
    onOpenChange={(open) => setActiveVariantId(open ? (variantId ?? null) : null)}
    modal
  >
    <Tooltip>
      <TooltipTrigger asChild>
        <Popover.Trigger asChild>
          <Button size="sm" variant="outline" className="h-7 text-xs w-7 px-0" onClick={(e) => e.stopPropagation()} aria-label="Add">
            <ShoppingCart className="h-3 w-3" />
          </Button>
        </Popover.Trigger>
      </TooltipTrigger>
      <TooltipContent side="top">Add</TooltipContent>
    </Tooltip>
    <AddToCartPopover
      material={material}
      variantId={variantId}
      hideVariantSelect={hideVariantSelect}
      onOpenChange={(open) => setActiveVariantId(open ? (variantId ?? null) : null)}
    />
  </Popover.Root>
);

// -- Touch-hold drag hook -------------------------------------------------

function useTouchHoldDrag({
  dragSpec,
  deps,
  canTouchHold = true,
}: {
  dragSpec: Parameters<typeof useDrag>[0];
  deps: unknown[];
  canTouchHold?: boolean;
}) {
  const isTouchDevice = useIsTouchDevice();
  const [isTouchHoldActive, setIsTouchHoldActive] = useState(false);
  const touchHoldTimeoutRef = useRef<number | null>(null);

  const [collected, drag, dragPreview] = useDrag(dragSpec, deps);
  const isDragging = Boolean((collected as { isDragging?: boolean }).isDragging);

  useEffect(() => {
    return () => {
      if (touchHoldTimeoutRef.current) window.clearTimeout(touchHoldTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isDragging) setIsTouchHoldActive(false);
  }, [isDragging]);

  const startTouchHold = (event: React.PointerEvent) => {
    if (!canTouchHold) return;
    if (event.pointerType !== 'touch') return;
    if (touchHoldTimeoutRef.current) window.clearTimeout(touchHoldTimeoutRef.current);
    touchHoldTimeoutRef.current = window.setTimeout(() => setIsTouchHoldActive(true), TOUCH_HOLD_DELAY);
  };

  const endTouchHold = () => {
    if (touchHoldTimeoutRef.current) {
      window.clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }
    setIsTouchHoldActive(false);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (isTouchDevice) event.preventDefault();
  };

  const showTouchHold = canTouchHold && (isTouchHoldActive || isDragging);

  return { isDragging, drag, dragPreview, showTouchHold, startTouchHold, endTouchHold, handleContextMenu };
}

export function getMaterialColumns(onDelete: (id: number) => void): ColumnDef<MaterialNestedRead>[] {
  return [
    {
      id: 'expand',
      size: 32,
      header: () => null,
      cell: () => null,
    },
    {
      id: 'image',
      size: 52,
      header: () => null,
      cell: () => null,
    },
    {
      accessorKey: 'description',
      minSize: 160,
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
        >
          Material
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: () => null,
    },
    {
      id: 'unit',
      accessorFn: (row) => row.variants.length === 1 ? (row.variants[0]?.unit ?? '') : '',
      size: 80,
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
        >
          Unit
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: () => null,
    },
    {
      id: 'price',
      accessorFn: (row) => {
        const prices = row.variants.flatMap((v) => v.stores.map((s) => s.price));
        return prices.length > 0 ? Math.min(...prices) : 0;
      },
      size: 80,
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
        >
          Price
          <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      cell: () => null,
    },
    {
      id: 'actions',
      size: 100,
      header: () => null,
      cell: () => null,
    },
  ];
}

type MaterialTableRowProps = {
  material: MaterialNestedRead;
  dragItem: { variantId?: number; storeId?: number };
  canDrag?: boolean;
  canTouchHold?: boolean;
  onClick: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  rowClassName?: string;
  isVariant?: boolean;
  expandContent?: React.ReactNode;
  images: MaterialImageRead[];
  imageAlt: string;
  label: string;
  tags?: string[];
  unit: string;
  price: string;
  actions: React.ReactNode;
};

const MaterialTableRow = ({
  material,
  dragItem,
  canDrag = true,
  canTouchHold = true,
  onClick,
  rowClassName,
  isVariant = false,
  expandContent,
  images,
  imageAlt,
  label,
  tags,
  unit,
  price,
  actions,
}: MaterialTableRowProps) => {
  const { isDragging, drag, dragPreview, showTouchHold, startTouchHold, endTouchHold, handleContextMenu } = useTouchHoldDrag({
    dragSpec: () => ({
      type: 'MATERIAL',
      item: { material, ...dragItem },
      canDrag,
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    deps: [material, dragItem.variantId, dragItem.storeId, canDrag],
    canTouchHold,
  });

  const setRowRef = (node: HTMLTableRowElement | null) => {
    drag(node);
    if (!isVariant) dragPreview(node);
  };

  return (
    <TableRow
      ref={setRowRef}
      onPointerDown={startTouchHold}
      onPointerUp={endTouchHold}
      onPointerCancel={endTouchHold}
      onContextMenu={handleContextMenu}
      style={{ touchAction: showTouchHold ? 'none' : isVariant ? 'pan-y' : undefined }}
      className={`group ${rowClassName || ''} ${isDragging ? 'opacity-50' : ''} ${showTouchHold ? 'ring-2 ring-[var(--accent-400)] ring-inset' : ''}`.trim()}
      onClick={onClick}
    >
      <TableCell className={`pl-3 pr-1 py-2`}>{expandContent}</TableCell>
      <TableCell className={`pl-1 pr-2 py-2`}>
        <MaterialThumbnail images={images} alt={imageAlt} />
      </TableCell>
      {isVariant ? (
        <TableCell className={`px-3 py-2 text-sm text-gray-700`}>{label}</TableCell>
      ) : (
        <TableCell className={`px-4 py-3 whitespace-normal`}>
          <div className="min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 line-clamp-2">{label}</p>
            {tags && tags.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap max-w-full overflow-hidden">
                {tags.map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded truncate max-w-[140px]">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </TableCell>
      )}
      <TableCell className={`px-3 py-2 text-sm text-gray-500 truncate`}>{unit}</TableCell>
      <TableCell className={`px-3 py-2 text-sm font-medium text-gray-900 truncate`}>{price}</TableCell>
      <TableCell className={`px-3 py-2`}>{actions}</TableCell>
    </TableRow>
  );
};

type MaterialListRowProps = {
  material: MaterialNestedRead;
  onDelete: (id: number) => void;
};

export const MaterialListRow = ({ material, onDelete }: MaterialListRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailVariantId, setDetailVariantId] = useState<number | null>(null);

  const hasSingleVariant = material.variants.length === 1;
  const singleVariant = material.variants[0];
  const hasSingleNamedVariant = hasSingleVariant && Boolean((singleVariant?.name ?? '').trim());
  const materialImages = useMaterialImages(material);
  const displayedMaterialName =
    hasSingleVariant && hasSingleNamedVariant
      ? `${singleVariant?.name} - ${material.description}`
      : material.description;
  const displayedUnit = hasSingleVariant ? singleVariant?.unit : '';
  const singleVariantPrices = hasSingleVariant ? (singleVariant?.stores ?? []) : [];
  const displayedPrice = hasSingleVariant ? (singleVariantPrices.length > 0 ? Math.min(...singleVariantPrices.map(p => p.price)) : 0) : null;
  const singleVariantDefaultStoreId = singleVariant?.stores?.[0]?.store?.id;

  const singleVariantCarouselImages = hasSingleVariant
    ? materialImages?.resolve({ variantId: singleVariant?.id }) ?? []
    : [];
  const listImage = materialImages?.first();

  const handleRootRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    if (hasSingleVariant) {
      setDetailVariantId(singleVariant?.id ?? null);
      setIsDetailOpen(true);
      return;
    }
    setExpanded((prev) => !prev);
  };

  return (
    <>
      <MaterialTableRow
        material={material}
        dragItem={{ variantId: singleVariant?.id, storeId: singleVariantDefaultStoreId }}
        canDrag={hasSingleVariant}
        canTouchHold={hasSingleVariant}
        onClick={handleRootRowClick}
        expandContent={
          !hasSingleVariant ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          ) : undefined
        }
        images={hasSingleVariant ? singleVariantCarouselImages : (listImage ? [listImage] : [])}
        imageAlt={material.description}
        label={displayedMaterialName}
        tags={material.tags}
        unit={displayedUnit || '—'}
        price={displayedPrice !== null ? `$${displayedPrice.toFixed(2)}` : '—'}
        actions={
          <div className="flex justify-end space-x-2">
            {hasSingleVariant && (
              <AddToCartButton
                material={material}
                variantId={singleVariant?.id}
                hideVariantSelect={!hasSingleNamedVariant}
                activeVariantId={activeVariantId}
                setActiveVariantId={setActiveVariantId}
              />
            )}
            <MoreOptionsMenu materialId={material.id} onDelete={onDelete} />
          </div>
        }
      />

      {expanded && !hasSingleVariant &&
        material.variants.map((variant) => {
          const variantPrices = variant.stores ?? [];
          const variantPrice = variantPrices.length > 0 ? Math.min(...variantPrices.map((p) => p.price)) : 0;
          const variantImage = materialImages?.preferred({
            variantId: variant.id,
            includeMaterialImages: false,
            preferVariantWithAnyStore: true,
          });

          return (
            <MaterialTableRow
              key={variant.id}
              material={material}
              dragItem={{ variantId: variant.id, storeId: variant.stores?.[0]?.store?.id }}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest(INTERACTIVE_SELECTOR)) return;
                setDetailVariantId(variant.id);
                setIsDetailOpen(true);
              }}
              rowClassName="bg-gray-50"
              isVariant
              images={variantImage ? [variantImage] : []}
              imageAlt={variant.name || material.description}
              label={variant.name || 'Standard'}
              unit={variant.unit}
              price={`$${variantPrice.toFixed(2)}`}
              actions={
                <div className="flex justify-end space-x-2">
                  <AddToCartButton
                    material={material}
                    variantId={variant.id}
                    hideVariantSelect
                    activeVariantId={activeVariantId}
                    setActiveVariantId={setActiveVariantId}
                  />
                  <Button size="sm" variant="ghost" className="invisible" aria-hidden tabIndex={-1}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              }
            />
          );
        })}

      <MaterialDetailModal
        material={material}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        initialVariantId={detailVariantId}
      />
    </>
  );
};