import { useCallback, useMemo } from "react";
import Fuse from "fuse.js";
import type { MaterialNestedRead } from "@/services/generatedApi";
import {
  useMaterialsListQuery,
  useMaterialsCreateMutation,
  useMaterialsUpdateMutation,
  useMaterialsDestroyMutation,
} from "@/services/api";
import { useAppToast } from "@/hooks/useAppToast";

type MaterialStoreInput = {
  id?: number;
  store_id?: string;
  store_name?: string;
  sku?: string;
  price: number;
};

type ProxyVariantInput = {
  id?: number;
  unit: string;
  divisor: number;
};

export const useMaterials = () => {
  const { data: materials = [] } = useMaterialsListQuery();
  const { showToast } = useAppToast();

  const [addMaterialMutation] = useMaterialsCreateMutation();
  const [updateMaterialMutation] = useMaterialsUpdateMutation();
  const [deleteMaterialMutation] = useMaterialsDestroyMutation();

  const materialFuse = useMemo(
    () =>
      new Fuse(materials, {
        threshold: 0.35,
        ignoreLocation: true,
        useExtendedSearch: true,
        keys: [
          { name: "description", weight: 2 },
          { name: "variants.name", weight: 2 },
          { name: "tags", weight: 1 },
          { name: "variants.stores.store.name", weight: 1 },
          { name: "variants.stores.sku", weight: 1.5 },
        ],
      }),
    [materials],
  );

  const searchMaterials = useCallback(
    (query: string, filterTags: string[], filterStoreIds: string[]) => {
      const hasQuery = query.length > 0;
      const hasTags = filterTags.length > 0;
      const hasStores = filterStoreIds.length > 0;

      if (!hasQuery && !hasTags && !hasStores) return materials;

      const selectedStoreIds = new Set(filterStoreIds.map(String));
      const matchesStoreFilter = (material: MaterialNestedRead) =>
        !hasStores ||
        material.variants.some((variant) =>
          (variant.stores ?? []).some((storeInfo) =>
            selectedStoreIds.has(String(storeInfo.store.id)),
          ),
        );

      const tagConditions = filterTags.map((ft) => ({ tags: `'${ft}` }));

      let result: MaterialNestedRead[];

      if (hasQuery && hasTags) {
        const expression = {
          $and: [
            {
              $or: [
                { description: query },
                { "variants.name": query },
                { "tags.name": query },
                { "variants.stores.store.name": query },
                { "variants.stores.sku": query },
              ],
            },
            ...tagConditions,
          ],
        };
        result = materialFuse.search(expression as any).map((r) => r.item);
        return result.filter(matchesStoreFilter);
      }

      if (hasTags) {
        const expression = { $and: tagConditions };
        result = materialFuse.search(expression as any).map((r) => r.item);
        return result.filter(matchesStoreFilter);
      }

      if (hasQuery) {
        result = materialFuse.search(query).map((r) => r.item);
        return result.filter(matchesStoreFilter);
      }

      return materials.filter(matchesStoreFilter);
    },
    [materials, materialFuse],
  );

  const addMaterial = useCallback(
    async (
      materialData: { description: string },
      variantsData: {
        name: string;
        unit: string;
        stores: MaterialStoreInput[];
        proxy_variants?: ProxyVariantInput[];
      }[],
      tags?: string[],
      imageFiles?: Record<string, File>,
      deleteImages?: string[],
    ) => {
      const payload = {
        description: materialData.description,
        variants: variantsData.map((v) => ({
          name: v.name,
          unit: v.unit,
          stores: (v.stores || []).map((s: MaterialStoreInput) => ({
            ...(s.store_id && /^\d+$/.test(s.store_id)
              ? { storeId: Number(s.store_id) }
              : { storeName: s.store_name || s.store_id || "" }),
            price: s.price,
            sku: s.sku,
          })),
          proxyVariants: (v.proxy_variants || []).map((p) => ({
            ...(p.id !== undefined ? { id: p.id } : {}),
            unit: p.unit,
            divisor: p.divisor,
          })),
        })),
        tags: tags || [],
      };
      const hasImageFiles =
        !!imageFiles && Object.keys(imageFiles).length > 0;
      const hasDeleteImages =
        !!deleteImages && deleteImages.length > 0;

      if (!hasImageFiles && !hasDeleteImages) {
        await addMaterialMutation({ materialNested: payload }).unwrap();
        return;
      }

      const formData = new FormData();
      formData.append("materialNested", JSON.stringify(payload));

      if (hasImageFiles) {
        for (const [key, file] of Object.entries(imageFiles!)) {
          formData.append(key, file);
        }
      }

      if (hasDeleteImages) {
        formData.append("deleteImages", JSON.stringify(deleteImages));
      }

      await addMaterialMutation({
        materialNested: formData as any,
      }).unwrap();
    },
    [addMaterialMutation],
  );

  const updateMaterial = useCallback(
    async (
      id: number,
      materialData: { description: string },
      variantsData: {
        id?: number;
        name: string;
        unit: string;
        stores: MaterialStoreInput[];
        proxy_variants?: ProxyVariantInput[];
      }[],
      tags?: string[],
      imageFiles?: Record<string, File>,
      deleteImages?: string[],
    ) => {
      const payload = {
        description: materialData.description,
        variants: variantsData.map((v) => ({
          ...(v.id !== undefined ? { id: v.id } : {}),
          name: v.name,
          unit: v.unit,
          stores: (v.stores || []).map((s: MaterialStoreInput) => ({
            ...(s.id !== undefined ? { id: s.id } : {}),
            ...(s.store_id && /^\d+$/.test(s.store_id)
              ? { storeId: Number(s.store_id) }
              : { storeName: s.store_name || s.store_id || "" }),
            price: s.price,
            sku: s.sku,
          })),
          proxyVariants: (v.proxy_variants || []).map((p) => ({
            ...(p.id !== undefined ? { id: p.id } : {}),
            unit: p.unit,
            divisor: p.divisor,
          })),
        })),
        tags: tags || [],
      };
      const hasImageFiles =
        !!imageFiles && Object.keys(imageFiles).length > 0;
      const hasDeleteImages =
        !!deleteImages && deleteImages.length > 0;

      if (!hasImageFiles && !hasDeleteImages) {
        await updateMaterialMutation({
          id,
          materialNested: payload,
        }).unwrap();
        return;
      }

      const formData = new FormData();
      formData.append("materialNested", JSON.stringify(payload));

      if (hasImageFiles) {
        for (const [key, file] of Object.entries(imageFiles!)) {
          formData.append(key, file);
        }
      }

      if (hasDeleteImages) {
        formData.append("deleteImages", JSON.stringify(deleteImages));
      }

      await updateMaterialMutation({
        id,
        materialNested: formData as any,
      }).unwrap();
    },
    [updateMaterialMutation],
  );

  const deleteMaterial = useCallback(
    (id: number) => {
      deleteMaterialMutation({ id })
        .unwrap()
        .catch((error: any) => {
          if (error?.status === 409) {
            showToast(
              "warning",
              "Cannot Delete Material",
              "This material is currently used by one or more jobs and cannot be deleted.\n\nIf desired, you can hide this material so it won't appear in search results.",
            );
          }
        });
    },
    [deleteMaterialMutation, showToast],
  );

  return {
    materials,
    searchMaterials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  };
};
