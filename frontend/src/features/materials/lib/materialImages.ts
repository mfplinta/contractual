import { useMemo } from 'react';
import type { MaterialImageRead, MaterialNestedRead } from '@/services/generatedApi';

type NullableId = number | null | undefined;

export type MaterialImageSelectionOptions = {
  variantId?: NullableId;
  storeId?: NullableId;
  includeMaterialImages?: boolean;
  includeVariantImages?: boolean;
  includeStoreImages?: boolean;
  inheritFromSourceVariant?: boolean;
};

export type MaterialImagePreferenceOptions = MaterialImageSelectionOptions & {
  preferExactStoreMatch?: boolean;
  preferVariantWithoutStore?: boolean;
  preferVariantWithAnyStore?: boolean;
  preferStoreOnlyMatch?: boolean;
  preferMaterialOnly?: boolean;
};

export type MaterialImageIndex = {
  all: MaterialImageRead[];
  material: MaterialImageRead[];
  variants: MaterialImageRead[];
  stores: MaterialImageRead[];
  byVariant: (variantId?: NullableId, options?: Pick<MaterialImageSelectionOptions, 'inheritFromSourceVariant'>) => MaterialImageRead[];
  byStore: (
    variantId?: NullableId,
    storeId?: NullableId,
    options?: Pick<MaterialImageSelectionOptions, 'inheritFromSourceVariant'>,
  ) => MaterialImageRead[];
  resolve: (options?: MaterialImageSelectionOptions) => MaterialImageRead[];
  first: (options?: MaterialImageSelectionOptions) => MaterialImageRead | undefined;
  preferred: (options?: MaterialImagePreferenceOptions) => MaterialImageRead | undefined;
};

export const dedupeMaterialImages = <T extends { id?: number; image: string }>(images: T[]) => {
  const seen = new Set<string>();
  return images.filter((img) => {
    const key = img.id !== undefined ? `id:${img.id}` : `url:${img.image}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getEffectiveVariantId = (
  material: MaterialNestedRead,
  variantId?: NullableId,
  inheritFromSourceVariant = true,
) => {
  if (variantId == null) return null;
  if (!inheritFromSourceVariant) return variantId;
  const variant = material.variants.find((item) => item.id === variantId);
  return variant?.sourceVariantId ?? variantId;
};

export const createMaterialImageIndex = (material: MaterialNestedRead): MaterialImageIndex => {
  const materialImages = (material.images ?? []).filter(
    (img) => img.variantId == null && img.storeId == null,
  );
  const variantImages = material.variants.flatMap((variant) => variant.images ?? []);
  const storeImages = material.variants.flatMap((variant) =>
    (variant.stores ?? []).flatMap((store) => store.images ?? []),
  );
  const allImages = dedupeMaterialImages([
    ...materialImages,
    ...variantImages,
    ...storeImages,
  ]);

  const byVariant: MaterialImageIndex['byVariant'] = (variantId, options) => {
    const effectiveVariantId = getEffectiveVariantId(
      material,
      variantId,
      options?.inheritFromSourceVariant ?? true,
    );
    if (effectiveVariantId == null) return [];
    return dedupeMaterialImages(
      allImages.filter(
        (img) => img.variantId === effectiveVariantId && img.storeId == null,
      ),
    );
  };

  const byStore: MaterialImageIndex['byStore'] = (variantId, storeId, options) => {
    if (storeId == null) return [];
    const effectiveVariantId = getEffectiveVariantId(
      material,
      variantId,
      options?.inheritFromSourceVariant ?? true,
    );
    return dedupeMaterialImages(
      allImages.filter(
        (img) =>
          img.storeId === storeId &&
          (effectiveVariantId == null || img.variantId == null || img.variantId === effectiveVariantId),
      ),
    );
  };

  const resolve: MaterialImageIndex['resolve'] = (options = {}) => {
    const {
      variantId,
      storeId,
      includeMaterialImages = true,
      includeVariantImages = true,
      includeStoreImages = true,
      inheritFromSourceVariant = true,
    } = options;

    return dedupeMaterialImages([
      ...(includeMaterialImages ? materialImages : []),
      ...(includeVariantImages ? byVariant(variantId, { inheritFromSourceVariant }) : []),
      ...(includeStoreImages ? byStore(variantId, storeId, { inheritFromSourceVariant }) : []),
    ]);
  };

  const first: MaterialImageIndex['first'] = (options) => resolve(options)[0];

  const preferred: MaterialImageIndex['preferred'] = (options = {}) => {
    const {
      variantId,
      storeId,
      inheritFromSourceVariant = true,
      preferExactStoreMatch = true,
      preferVariantWithoutStore = true,
      preferVariantWithAnyStore = false,
      preferStoreOnlyMatch = false,
      preferMaterialOnly = false,
    } = options;

    const effectiveVariantId = getEffectiveVariantId(
      material,
      variantId,
      inheritFromSourceVariant,
    );

    if (preferExactStoreMatch && effectiveVariantId != null && storeId != null) {
      const exact = allImages.find(
        (img) => img.variantId === effectiveVariantId && img.storeId === storeId,
      );
      if (exact) return exact;
    }

    if (preferVariantWithoutStore && effectiveVariantId != null) {
      const variantOnly = allImages.find(
        (img) => img.variantId === effectiveVariantId && img.storeId == null,
      );
      if (variantOnly) return variantOnly;
    }

    if (preferVariantWithAnyStore && effectiveVariantId != null) {
      const variantAnyStore = allImages.find(
        (img) => img.variantId === effectiveVariantId,
      );
      if (variantAnyStore) return variantAnyStore;
    }

    if (preferStoreOnlyMatch && storeId != null) {
      const storeOnly = allImages.find((img) => img.storeId === storeId);
      if (storeOnly) return storeOnly;
    }

    if (preferMaterialOnly) {
      return materialImages[0];
    }

    return first(options);
  };

  return {
    all: allImages,
    material: materialImages,
    variants: variantImages,
    stores: storeImages,
    byVariant,
    byStore,
    resolve,
    first,
    preferred,
  };
};

export const useMaterialImages = (material?: MaterialNestedRead) => {
  return useMemo(() => {
    if (!material) return undefined;
    return createMaterialImageIndex(material);
  }, [material]);
};