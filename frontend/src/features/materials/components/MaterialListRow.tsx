import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, ShoppingCart, Edit, Trash, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { ImagePlaceholder } from '@/components/shared/ImagePlaceholder';
import * as Popover from '@radix-ui/react-popover';
import type { MaterialNestedRead } from '@/services/generatedApi';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TableRow } from '@/components/ui/table';
import { ResponsiveTableCell } from '@/components/shared/ResponsiveTable';
import { useDrag } from 'react-dnd';
import { useIsMobileWidth } from '@/components/ui/use-mobile';
import { AddToCartPopover } from './AddToCartPopover';
import { MaterialImageCarousel } from './MaterialImageCarousel';
import { MaterialDetailModal } from './MaterialDetailModal';
import { useMaterialImages } from '../lib/materialImages';
import { Link } from 'react-router-dom';

const TOUCH_HOLD_DELAY = 250;
const INTERACTIVE_SELECTOR = "button,a,input,select,textarea,[role='button']";

type MaterialListRowProps = {
  material: MaterialNestedRead;
  onDelete: (id: number) => void;
};

export const MaterialListRow = ({ material, onDelete }: MaterialListRowProps) => {
  const isMobile = useIsMobileWidth();
  const [expanded, setExpanded] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailVariantId, setDetailVariantId] = useState<number | null>(null);
  const [isTouchHoldActive, setIsTouchHoldActive] = useState(false);
  const touchHoldTimeoutRef = useRef<number | null>(null);

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

  const [{ isDragging }, drag, dragPreview] = useDrag(
    () => ({
      type: 'MATERIAL',
      item: {
        material,
        variantId: singleVariant?.id,
        storeId: singleVariantDefaultStoreId,
      },
      canDrag: hasSingleVariant,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }),
    [material, singleVariant?.id, singleVariantDefaultStoreId, hasSingleVariant]
  );

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

  const startTouchHold = (event: React.PointerEvent) => {
    if (!hasSingleVariant) return;
    if (event.pointerType !== 'touch') return;
    if (touchHoldTimeoutRef.current) {
      window.clearTimeout(touchHoldTimeoutRef.current);
    }
    touchHoldTimeoutRef.current = window.setTimeout(() => {
      setIsTouchHoldActive(true);
    }, TOUCH_HOLD_DELAY);
  };

  const endTouchHold = () => {
    if (touchHoldTimeoutRef.current) {
      window.clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }
    setIsTouchHoldActive(false);
  };

  const showTouchHold = hasSingleVariant && (isTouchHoldActive || isDragging);
  const setRowRef = (node: HTMLTableRowElement | null) => {
    drag(node);
    dragPreview(node);
  };

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
      <TableRow
        ref={setRowRef}
        onPointerDown={startTouchHold}
        onPointerUp={endTouchHold}
        onPointerCancel={endTouchHold}
        onContextMenu={(event) => event.preventDefault()}
        style={{ touchAction: showTouchHold ? 'none' : undefined }}
        className={`group ${isDragging ? 'opacity-50' : ''} ${showTouchHold ? 'ring-2 ring-[var(--accent-400)] ring-inset' : ''}`}
        onClick={handleRootRowClick}
      >
        <ResponsiveTableCell className="p-0 sm:hidden" colSpan={6}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center justify-center h-10 w-6 flex-none">
              {hasSingleVariant ? (
                <div className="cursor-move text-gray-400 hover:text-gray-600 select-none touch-pan-y">
                  <GripVertical className="h-4 w-4" />
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded((prev) => !prev);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
              )}
            </div>
            {hasSingleVariant ? (
              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-none">
                {singleVariantCarouselImages.length > 0 ? (
                  <MaterialImageCarousel
                    images={singleVariantCarouselImages}
                    alt={material.description}
                    className="h-full w-full"
                    imageClassName="h-full w-full object-cover"
                    showDotsOnHover={false}
                  />
                ) : (
                  <ImagePlaceholder size="h-full w-full" iconSize="h-5 w-5" />
                )}
              </div>
            ) : (
              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-none">
                {listImage ? (
                  <MaterialImageCarousel
                    images={[listImage]}
                    alt={material.description}
                    className="h-full w-full"
                    imageClassName="h-full w-full object-cover"
                    showDotsOnHover={false}
                  />
                ) : (
                  <ImagePlaceholder size="h-full w-full" iconSize="h-5 w-5" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-[minmax(160px,1fr)_64px_72px] gap-4 items-center w-full">
                <div className="min-w-0 flex flex-col items-start">
                  <p className="text-sm font-medium text-gray-900 truncate w-full">{displayedMaterialName}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {material.tags.map((t) => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded whitespace-nowrap">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">{displayedUnit || '—'}</div>
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {displayedPrice !== null ? `$${displayedPrice.toFixed(2)}` : '—'}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 flex-none">
              {hasSingleVariant && isMobile && (
                <Popover.Root
                  open={activeVariantId === (singleVariant?.id ?? null)}
                  onOpenChange={(open) => setActiveVariantId(open ? (singleVariant?.id ?? null) : null)}
                  modal
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Popover.Trigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs w-7 px-0"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Add"
                        >
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                      </Popover.Trigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Add</TooltipContent>
                  </Tooltip>
                  <AddToCartPopover
                    material={material}
                    variantId={singleVariant?.id}
                    hideVariantSelect={!hasSingleNamedVariant}
                    onOpenChange={(open) => setActiveVariantId(open ? (singleVariant?.id ?? null) : null)}
                  />
                </Popover.Root>
              )}
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
                      to={`/materials/${material.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--accent-50)] flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(material.id);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <Trash className="h-4 w-4 mr-2" /> Delete
                    </button>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </div>
          </div>
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell w-6 px-3 py-3" columnKey="handle">
          <div className="flex items-center justify-center h-10">
            {hasSingleVariant ? (
              <div className="cursor-move text-gray-400 hover:text-gray-600">
                <GripVertical className="h-4 w-4" />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((prev) => !prev);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            )}
          </div>
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell w-10 px-3 py-3" columnKey="image">
          {hasSingleVariant ? (
            <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
              {singleVariantCarouselImages.length > 0 ? (
                <MaterialImageCarousel
                  images={singleVariantCarouselImages}
                  alt={material.description}
                  className="h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  showDotsOnHover={false}
                />
              ) : (
                <ImagePlaceholder size="h-full w-full" iconSize="h-5 w-5" />
              )}
            </div>
          ) : (
            <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
              {listImage ? (
                <MaterialImageCarousel
                  images={[listImage]}
                  alt={material.description}
                  className="h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  showDotsOnHover={false}
                />
              ) : (
                <ImagePlaceholder size="h-full w-full" iconSize="h-5 w-5" />
              )}
            </div>
          )}
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-4 py-3" columnKey="material">
          <div className="min-w-0 flex flex-col items-start">
            <p className="text-sm font-medium text-gray-900 truncate w-full">{displayedMaterialName}</p>
            <div className="flex gap-1 mt-1 flex-wrap max-w-full overflow-hidden">
              {material.tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 rounded truncate max-w-[140px]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-3 text-sm text-gray-500 truncate" columnKey="unit">
          {displayedUnit || '—'}
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-3 text-sm font-medium text-gray-900 truncate" columnKey="price">
          {displayedPrice !== null ? `$${displayedPrice.toFixed(2)}` : '—'}
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-3" columnKey="actions">
          <div className="flex justify-end space-x-2">
            {hasSingleVariant && !isMobile && (
              <Popover.Root
                open={activeVariantId === (singleVariant?.id ?? null)}
                onOpenChange={(open) => setActiveVariantId(open ? (singleVariant?.id ?? null) : null)}
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
                  variantId={singleVariant?.id}
                  hideVariantSelect={!hasSingleNamedVariant}
                  onOpenChange={(open) => setActiveVariantId(open ? (singleVariant?.id ?? null) : null)}
                />
              </Popover.Root>
            )}
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
                    to={`/materials/${material.id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--accent-50)] flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(material.id);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <Trash className="h-4 w-4 mr-2" /> Delete
                  </button>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </ResponsiveTableCell>
      </TableRow>

      {expanded && !hasSingleVariant &&
        material.variants.map((variant) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            material={material}
            activeVariantId={activeVariantId}
            setActiveVariantId={setActiveVariantId}
            onOpenDetail={(variantId) => {
              setDetailVariantId(variantId);
              setIsDetailOpen(true);
            }}
            rowClassName="bg-gray-50"
          />
        ))}

      <MaterialDetailModal
        material={material}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        initialVariantId={detailVariantId}
      />
    </>
  );
};

const VariantRow = ({
  variant,
  material,
  activeVariantId,
  setActiveVariantId,
  onOpenDetail,
  rowClassName
}: {
  variant: MaterialNestedRead['variants'][number];
  material: MaterialNestedRead;
  activeVariantId: number | null;
  setActiveVariantId: (value: number | null) => void;
  onOpenDetail: (variantId: number) => void;
  rowClassName?: string;
}) => {
  const isMobile = useIsMobileWidth();
  const materialImages = useMaterialImages(material);
  const [isTouchHoldActive, setIsTouchHoldActive] = useState(false);
  const touchHoldTimeoutRef = useRef<number | null>(null);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: 'MATERIAL',
      item: {
        material,
        variantId: variant.id,
        storeId: variant.stores?.[0]?.store?.id,
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }),
    [material, variant.id, variant.stores]
  );

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

  const startTouchHold = (event: React.PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    if (touchHoldTimeoutRef.current) {
      window.clearTimeout(touchHoldTimeoutRef.current);
    }
    touchHoldTimeoutRef.current = window.setTimeout(() => {
      setIsTouchHoldActive(true);
    }, TOUCH_HOLD_DELAY);
  };

  const endTouchHold = () => {
    if (touchHoldTimeoutRef.current) {
      window.clearTimeout(touchHoldTimeoutRef.current);
      touchHoldTimeoutRef.current = null;
    }
    setIsTouchHoldActive(false);
  };

  const showTouchHold = isTouchHoldActive || isDragging;
  const setRowRef = (node: HTMLTableRowElement | null) => {
    drag(node);
  };

  const variantPrices = variant.stores ?? [];
  const variantPrice = variantPrices.length > 0 ? Math.min(...variantPrices.map((p) => p.price)) : 0;
  const variantImage = materialImages?.preferred({
    variantId: variant.id,
    includeMaterialImages: false,
    preferVariantWithAnyStore: true,
  });

  const handleVariantRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(INTERACTIVE_SELECTOR)) return;
    onOpenDetail(variant.id);
  };

  return (
    <>
      <TableRow
        ref={setRowRef}
        onPointerDown={startTouchHold}
        onPointerUp={endTouchHold}
        onPointerCancel={endTouchHold}
        onContextMenu={(event) => event.preventDefault()}
        style={{ touchAction: showTouchHold ? 'none' : 'pan-y' }}
        onClick={handleVariantRowClick}
        className={`${rowClassName || ''} ${isDragging ? 'opacity-50' : ''} ${showTouchHold ? 'ring-2 ring-[var(--accent-400)] ring-inset' : ''}`.trim()}
      >
        <ResponsiveTableCell className="p-0 sm:hidden" colSpan={6}>
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="cursor-move text-gray-400 hover:text-gray-600 flex-none select-none touch-pan-y">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-none">
              {variantImage ? (
                <MaterialImageCarousel
                  images={[variantImage]}
                  alt={variant.name || material.description}
                  className="h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  showDotsOnHover={false}
                />
              ) : (
                <ImagePlaceholder size="h-full w-full" iconSize="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-[minmax(140px,1fr)_64px_72px] gap-4 items-center w-full">
                <div className="text-sm text-gray-700 truncate min-w-0">{variant.name || 'Standard'}</div>
                <div className="text-sm text-gray-500 whitespace-nowrap">{variant.unit}</div>
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">${variantPrice.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex justify-end flex-none">
              {isMobile && (
                <Popover.Root
                  open={activeVariantId === variant.id}
                  onOpenChange={(open) => setActiveVariantId(open ? variant.id : null)}
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
                    variantId={variant.id}
                    hideVariantSelect
                    onOpenChange={(open) => setActiveVariantId(open ? variant.id : null)}
                  />
                </Popover.Root>
              )}
            </div>
          </div>
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-2" columnKey="handle">
          <div className="cursor-move text-gray-400 hover:text-gray-600">
            <GripVertical className="h-4 w-4" />
          </div>
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-2" columnKey="image">
          <div className="h-10 w-10 rounded overflow-hidden bg-gray-100">
            {variantImage ? (
              <MaterialImageCarousel
                images={[variantImage]}
                alt={variant.name || material.description}
                className="h-full w-full"
                imageClassName="h-full w-full object-cover"
                showDotsOnHover={false}
              />
            ) : (
              <ImagePlaceholder size="h-full w-full" iconSize="h-5 w-5" />
            )}
          </div>
        </ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-2 text-sm text-gray-700" columnKey="material">{variant.name || 'Standard'}</ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-2 text-sm text-gray-500" columnKey="unit">{variant.unit}</ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-2 text-sm font-medium text-gray-900" columnKey="price">${variantPrice.toFixed(2)}</ResponsiveTableCell>
        <ResponsiveTableCell className="hidden sm:table-cell px-3 py-2" columnKey="actions">
          <div className="flex justify-end">
            {!isMobile && (
              <Popover.Root
                open={activeVariantId === variant.id}
                onOpenChange={(open) => setActiveVariantId(open ? variant.id : null)}
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
                  variantId={variant.id}
                  hideVariantSelect
                  onOpenChange={(open) => setActiveVariantId(open ? variant.id : null)}
                />
              </Popover.Root>
            )}
          </div>
        </ResponsiveTableCell>
      </TableRow>
    </>
  );
};