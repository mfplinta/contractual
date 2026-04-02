import { useEffect, useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import type { MaterialNestedRead } from '@/services/generatedApi';
import { useCart } from '../../cart/hooks';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { ComboboxSelect } from '@/components/shared/ComboboxSelect';
import { useAppToast } from '@/hooks/useAppToast';

interface AddToCartPopoverProps {
  material: MaterialNestedRead;
  variantId?: number;
  onVariantChange?: (variantId: number) => void;
  storeId?: number;
  onStoreChange?: (storeId: number) => void;
  hideVariantSelect?: boolean;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  onOpenChange?: (open: boolean) => void;
}

export const AddToCartPopover = ({
  material,
  variantId,
  onVariantChange,
  storeId,
  onStoreChange,
  hideVariantSelect = false,
  align = 'end',
  sideOffset = 5,
  onOpenChange
}: AddToCartPopoverProps) => {
  const { addToCart, currentGroups } = useCart();
  const { showToast } = useAppToast();

  const [localVariantId, setLocalVariantId] = useState(variantId ?? (material.variants[0]?.id ?? -1));
  const [selectedStoreId, setSelectedStoreId] = useState(-1);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (variantId !== undefined) {
      setLocalVariantId(variantId);
      return;
    }
    const nextDefault = material.variants[0]?.id ?? -1;
    if (nextDefault !== -1 && !material.variants.some(v => v.id === localVariantId)) {
      setLocalVariantId(nextDefault);
    }
  }, [variantId, material.variants, localVariantId]);

  const effectiveVariantId = variantId ?? localVariantId;
  const currentVariant = material.variants.find(v => v.id === effectiveVariantId) ?? material.variants[0];
  const currentVariantStores = currentVariant?.stores ?? [];

  useEffect(() => {
    if (currentVariantStores.length === 0) {
      setSelectedStoreId(-1);
      return;
    }

    const exists = currentVariantStores.some(
      (storeInfo) => storeInfo.store.id === selectedStoreId,
    );
    if (selectedStoreId === -1 || !exists) {
      setSelectedStoreId(currentVariantStores[0].store.id);
    }
  }, [currentVariantStores, selectedStoreId]);

  const hasSingleNamedVariant = material.variants.length === 1 && Boolean((material.variants[0]?.name ?? '').trim());
  const canShowVariantSelect = material.variants.length > 1 || hasSingleNamedVariant;
  const showVariantSelect = !hideVariantSelect && canShowVariantSelect;

  const variantOptions = useMemo(
    () => material.variants.map(variant => {
      const hasProxies = material.variants.some((pv) => pv.sourceVariantId === variant.id);
      const showUnit = variant.isProxy || hasProxies;
      const label = variant.name || 'Standard';
      return { value: variant.id, label: showUnit ? `${label} (${variant.unit})` : label };
    }),
    [material.variants]
  );
  const storeOptions = useMemo(
    () => currentVariantStores.map((storeInfo) => ({
      value: storeInfo.store.id,
      label: storeInfo.store.name,
    })),
    [currentVariantStores]
  );

  const handleVariantChange = (nextVariantId: number) => {
    setLocalVariantId(nextVariantId);
    onVariantChange?.(nextVariantId);
  };

  const handleStoreChange = (nextStoreId: number) => {
    setSelectedStoreId(nextStoreId);
    onStoreChange?.(nextStoreId);
  };

  useEffect(() => {
    if (storeId === undefined) return;
    if (storeId !== selectedStoreId) {
      setSelectedStoreId(storeId);
    }
  }, [storeId, selectedStoreId]);

  const handleAddToCart = () => {
    if (!currentVariant) return;
    showToast(
      "info",
      "Added to Cart",
      `${quantity}x ${currentVariant.name ? `${currentVariant.name} - ` : ''}${material.description} has been added to your cart.`,
    );
    addToCart({
      variantId: currentVariant.id,
      groupId: currentGroups[currentGroups.length - 1].id,
      storeId: selectedStoreId,
      quantity,
    });
    onOpenChange?.(false);
  };

  return (
    <Popover.Portal>
      <Popover.Content
        className="w-72 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
        align={align}
        sideOffset={sideOffset}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          event.preventDefault();
          onOpenChange?.(false);
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-medium text-gray-900">Add to Cart</h3>
            {hideVariantSelect && currentVariant && (
              <p className="text-xs text-gray-500">{currentVariant.name || 'Standard'}</p>
            )}
          </div>

          {showVariantSelect && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Variant</label>
              <ComboboxSelect
                value={effectiveVariantId}
                onChange={handleVariantChange}
                options={variantOptions}
                placeholder="Select variant"
                allowCreate={false}
                openOnFocus={false}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Store</label>
            <ComboboxSelect
              value={selectedStoreId}
              onChange={handleStoreChange}
              options={storeOptions}
              placeholder="Select store"
              allowCreate={false}
              openOnFocus={false}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Quantity</label>
            <NumberInput
              className="block w-full rounded-md border-gray-200 text-sm focus:border-[var(--accent-500)] focus:ring-[var(--accent-500)]"
              value={quantity}
              onValueChange={(value) => setQuantity(value ?? 1)}
              min={0.01}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Popover.Close asChild>
              <Button size="sm" variant="ghost">Cancel</Button>
            </Popover.Close>
            <Button size="sm" onClick={handleAddToCart}>Add Item</Button>
          </div>
        </div>
        <Popover.Arrow className="fill-white" />
      </Popover.Content>
    </Popover.Portal>
  );
};
