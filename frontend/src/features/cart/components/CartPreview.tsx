import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import { MaterialImageCarousel } from '../../materials/components/MaterialImageCarousel';
import type { JobMaterialRead } from '../../../services/generatedApi';
import { useCart } from '../hooks';

interface CartPreviewProps {
  items: JobMaterialRead[];
  isDragHover: boolean;
  draggedPreviewText: string | null;
  onRemove: (itemId: number) => void;
  onClose: () => void;
}

export const CartPreview: React.FC<CartPreviewProps> = ({
  items,
  isDragHover,
  draggedPreviewText,
  onRemove,
  onClose,
}) => {
  const {
    cartPreviewScrollTop: rememberedScrollTop,
    cartPreviewKnownItemIds: rememberedItemIds,
    setCartPreviewScrollTop: onRememberedScrollTopChange,
    setCartPreviewKnownItemIds: onRememberedItemIdsChange,
  } = useCart();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollTop = rememberedScrollTop;
    });
  }, []);

  useEffect(() => {
    const currentItemIds = items.map((item) => item.id);
    const knownSet = new Set(rememberedItemIds);
    const hasNewDistinctItem = currentItemIds.some((id) => !knownSet.has(id));
    const hasDifferentKnownIds =
      rememberedItemIds.length !== currentItemIds.length ||
      rememberedItemIds.some((id, index) => id !== currentItemIds[index]);

    if (hasNewDistinctItem) {
      requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
        onRememberedScrollTopChange(container.scrollTop);
      });
    }

    if (hasDifferentKnownIds) {
      onRememberedItemIdsChange(currentItemIds);
    }
  }, [items, rememberedItemIds, onRememberedScrollTopChange, onRememberedItemIdsChange]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    onRememberedScrollTopChange(container.scrollTop);
  };

  return (
    <div className="absolute right-0 top-full w-80 pt-2 z-50">
      <div className="bg-white rounded-md shadow-lg border border-gray-100 py-1">
        <div className="px-4 py-2 border-b border-gray-100 font-medium text-gray-900 flex items-center justify-between">
          <span>{isDragHover ? 'Release to add item' : 'Current Job Items'}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/cart"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="View full cart"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">View full cart</TooltipContent>
          </Tooltip>
        </div>

        {isDragHover && draggedPreviewText && (
          <div className="px-4 py-3 text-sm text-[var(--accent-700)] bg-[var(--accent-50)] border-b border-[var(--accent-100)]">
            Drop to add: <span className="font-medium">{draggedPreviewText}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            {isDragHover ? 'Release to add this item' : 'Cart is empty'}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-60 overflow-y-auto"
          >
            {items.map((item, idx) => {
              return (
                <div key={idx} className="px-4 py-3 flex justify-between items-start hover:bg-[var(--accent-50)]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-none">
                      <MaterialImageCarousel
                        images={item.images ?? []}
                        alt={item.description || 'Material Item'}
                        className="h-full w-full"
                        imageClassName="h-full w-full object-cover"
                        showDotsOnHover={false}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate w-40">
                        {item.description || 'Material Item'}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}{item.unit ? ` · ${item.unit}` : ''}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    tooltip="Delete"
                    tooltipSide="left"
                    onClick={(e) => {
                      e.preventDefault();
                      onRemove(item.id);
                    }}
                    className="text-red-400 hover:text-red-500 p-0 h-auto"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
