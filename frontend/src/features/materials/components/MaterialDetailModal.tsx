import { FC } from 'react';
import { ExternalLink } from 'lucide-react';
import type { MaterialNestedRead } from '@/services/generatedApi';
import { ImagePlaceholder } from '@/components/shared/ImagePlaceholder';
import { MaterialImageCarousel } from './MaterialImageCarousel';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDetectTruncation } from '@/hooks/useDetectTruncation';
import { useMaterialImages } from '../lib/materialImages';

const SkuCell: FC<{ sku?: string }> = ({ sku }) => {
  const { ref, isTruncated } = useDetectTruncation<HTMLSpanElement>();

  if (!sku) {
    return (
      <td className="py-1.5 pr-4 text-gray-500">
        —
      </td>
    );
  }

  const content = (
    <span ref={ref} className="block truncate">
      {sku}
    </span>
  );

  return (
    <td className="py-1.5 pr-4 text-gray-500">
      {isTruncated ? (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top">{sku}</TooltipContent>
        </Tooltip>
      ) : (
        content
      )}
    </td>
  );
};

interface MaterialDetailModalProps {
  material: MaterialNestedRead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialVariantId?: number | null;
  initialStoreId?: number | null;
  highlightVariantId?: number | null;
  highlightStoreId?: number | null;
}

export const MaterialDetailModal: FC<MaterialDetailModalProps> = ({
  material,
  open,
  onOpenChange,
  initialVariantId,
  initialStoreId,
  highlightVariantId,
  highlightStoreId,
}) => {
  const materialImages = useMaterialImages(material);
  const allImages = materialImages?.all ?? [];
  const preferredImage = materialImages?.preferred({
    variantId: initialVariantId,
    storeId: initialStoreId,
    preferVariantWithAnyStore: true,
    preferStoreOnlyMatch: true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="h-56 sm:h-72 md:h-80 bg-gray-100 relative overflow-hidden rounded-t-lg border-b border-gray-200">
          {allImages.length > 0 ? (
            <MaterialImageCarousel
              images={allImages}
              alt={material.description}
              className="h-full"
              imageClassName="object-contain"
              initialImageId={preferredImage?.id}
            />
          ) : (
            <ImagePlaceholder size="w-full h-full" iconSize="h-16 w-16" />
          )}
        </div>

        <div className="p-6 space-y-4">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {material.description}
          </DialogTitle>

          {material.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {material.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Variants table */}
          <div className="space-y-3">
            {material.variants.map(variant => {
              const variantLabel = variant.name?.trim() || 'Standard';
              const stores = variant.stores ?? [];
              const isVariantHighlighted =
                highlightVariantId != null && variant.id === highlightVariantId;

              return (
                <div key={variant.id}>
                  <h4
                    className={`text-sm font-semibold mb-1 ${
                      isVariantHighlighted ? 'text-[var(--accent-700)]' : 'text-gray-700'
                    }`}
                  >
                    {variantLabel}
                    {variant.unit && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        ({variant.unit})
                      </span>
                    )}
                  </h4>

                  {stores.length > 0 ? (
                    <table className="w-full text-sm border-collapse table-fixed">
                      <colgroup>
                        <col className="w-[34%]" />
                        <col className="w-[26%]" />
                        <col className="w-[20%]" />
                        <col className="w-[20%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-xs">
                          <th className="text-left py-1.5 pr-4 font-medium">Store</th>
                          <th className="text-left py-1.5 pr-4 font-medium">SKU</th>
                          <th className="text-right py-1.5 pr-4 font-medium">Price</th>
                          <th className="text-right py-1.5 font-medium">Go to store</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stores.map(storeInfo => {
                          const sku = storeInfo.sku?.trim();
                          const storeUrl = storeInfo.store?.storeUrl?.trim();
                          const hasGoToStoreLink = Boolean(storeUrl && sku);
                          const goToStoreHref = hasGoToStoreLink
                            ? storeUrl!.replace('%s', encodeURIComponent(sku!))
                            : '';
                          const isStoreHighlighted =
                            highlightVariantId != null &&
                            highlightStoreId != null &&
                            variant.id === highlightVariantId &&
                            storeInfo.store?.id === highlightStoreId;

                          return (
                            <tr
                              key={storeInfo.id}
                              className={`border-b ${
                                isStoreHighlighted
                                  ? 'bg-[var(--accent-50)] border-[var(--accent-200)]'
                                  : 'border-gray-100'
                              }`}
                            >
                              <td className="py-1.5 pr-4 text-gray-900">
                                {storeInfo.store?.name || 'Unknown Store'}
                              </td>
                              <SkuCell sku={sku} />
                              <td className="py-1.5 pr-4 text-right font-medium text-gray-900 tabular-nums">
                                ${Number(storeInfo.price).toFixed(2)}
                              </td>
                              <td className="py-1.5 text-right">
                                {hasGoToStoreLink ? (
                                  <a
                                    className="inline-flex items-center gap-1 text-[var(--accent-600)] hover:text-[var(--accent-700)]"
                                    href={goToStoreHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open in store"
                                  >
                                    <span className="text-xs">Open</span>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ) : (
                                  <span
                                    className="inline-flex items-center text-gray-300 cursor-not-allowed"
                                    title="Store URL and SKU are required"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-gray-400">No stores for this variant.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
