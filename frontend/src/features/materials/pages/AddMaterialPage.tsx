import React, { useEffect, useMemo, useState } from 'react';
import { useMaterials } from '../hooks';
import { useStores } from '@/hooks/useStores';
import { useUnits } from '@/hooks/useUnits';
import { useTags } from '@/hooks/useTags';
import { useNavigate, useLocation, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { ComboboxSelect } from '@/components/shared/ComboboxSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { ImagePicker } from '@/components/shared/ImagePicker';
import type { MaterialNestedRead } from '@/services/generatedApi';
import { Helmet } from 'react-helmet';
import { useMaterialImages } from '../lib/materialImages';

interface StoreData {
  id?: number;
  storeId: number | null;
  sku: string;
  price: number;
  priceSource: 'manual' | 'api';
  image: File | null;
}

interface ProxyData {
  id?: number;
  unit: string;
  divisor: number;
}

interface VariantState {
  id?: number;
  name: string;
  unit: string;
  image: File | null;
  stores: StoreData[];
  proxyVariants: ProxyData[];
}

export const AddMaterialPage = () => {
  const { addMaterial, updateMaterial, materials } = useMaterials();
  const { stores } = useStores();
  const { units } = useUnits();
  const { allTags } = useTags();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const editingMaterial: MaterialNestedRead | undefined = useMemo(() => {
    return location.state?.material || materials.find((mat) => String(mat.id) === id);
  }, [id, location.state, materials]);
  const materialImages = useMaterialImages(editingMaterial);

  const [description, setDescription] = useState('');
  const [materialImage, setMaterialImage] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deletedImageKeys, setDeletedImageKeys] = useState<Set<string>>(new Set());
  
  // Variants state with stores
  const [variants, setVariants] = useState<VariantState[]>([
    { 
      name: '', 
      unit: 'each', 
      image: null,
      stores: [{ storeId: stores[0]?.id ?? null, sku: '', price: 0, priceSource: 'manual', image: null }],
      proxyVariants: [],
    }
  ]);

  const getMaterialInitialImageUrl = useMemo(() => {
    return materialImages?.material[0]?.image;
  }, [materialImages]);

  const getVariantInitialImageUrl = (variantId?: number) => {
    if (variantId === undefined) return undefined;
    return materialImages?.preferred({
      variantId,
      includeMaterialImages: false,
      includeStoreImages: false,
    })?.image;
  };

  const getStoreInitialImageUrl = (variantId?: number, storeId?: number | null) => {
    if (variantId === undefined || storeId === null || storeId === undefined) return undefined;
    return materialImages?.preferred({
      variantId,
      storeId: storeId,
      includeMaterialImages: false,
      includeVariantImages: false,
    })?.image;
  };

  useEffect(() => {
    if (!editingMaterial) return;
    setDescription(editingMaterial.description || '');
    setSelectedTags([...editingMaterial.tags]);

    // Separate real variants from proxy variants
    const realVariants = editingMaterial.variants.filter((v) => !v.isProxy);
    const proxyVariants = editingMaterial.variants.filter((v) => v.isProxy);

    setVariants(
      realVariants.map((variant) => {
        const storeEntries = variant.stores.length > 0
          ? variant.stores.map((s) => ({
              id: s.id,
              storeId: s.store.id,
              sku: s.sku ?? '',
              price: s.price,
              priceSource: 'manual' as const,
              image: null as File | null
            }))
          : [{
              storeId: stores[0]?.id ?? null,
              sku: '',
              price: 0,
              priceSource: 'manual' as const,
              image: null as File | null
            }];
        // Collect proxy variants that belong to this variant
        const variantProxies = proxyVariants
          .filter((pv) => pv.sourceVariantId === variant.id)
          .map((pv) => ({
            id: pv.id,
            unit: pv.unit,
            divisor: pv.divisor ?? 1,
          }));
        return {
          id: variant.id,
          name: variant.name ?? '',
          unit: variant.unit,
          image: null,
          stores: storeEntries,
          proxyVariants: variantProxies,
        };
      })
    );
  }, [editingMaterial, stores]);

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: '',
        unit: '',
        image: null,
        stores: [{ storeId: stores[0]?.id ?? null, sku: '', price: 0, priceSource: 'manual', image: null }],
        proxyVariants: [],
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof Omit<VariantState, 'stores'>, value: string | File | null) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleAddStore = (variantIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].stores.push({ storeId: stores[0]?.id ?? null, sku: '', price: 0, priceSource: 'manual', image: null });
    setVariants(newVariants);
  };

  const handleRemoveStore = (variantIndex: number, storeIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].stores = newVariants[variantIndex].stores.filter((_, i) => i !== storeIndex);
    setVariants(newVariants);
  };

  const handleStoreChange = (variantIndex: number, storeIndex: number, field: keyof StoreData, value: string | number | File | null) => {
    const newVariants = [...variants];
    newVariants[variantIndex].stores[storeIndex] = {
      ...newVariants[variantIndex].stores[storeIndex],
      [field]: value
    };
    setVariants(newVariants);
  };

  const handleAddProxy = (variantIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].proxyVariants.push({ unit: '', divisor: 1 });
    setVariants(newVariants);
  };

  const handleRemoveProxy = (variantIndex: number, proxyIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].proxyVariants = newVariants[variantIndex].proxyVariants.filter((_, i) => i !== proxyIndex);
    setVariants(newVariants);
  };

  const handleProxyChange = (variantIndex: number, proxyIndex: number, field: keyof ProxyData, value: string | number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].proxyVariants[proxyIndex] = {
      ...newVariants[variantIndex].proxyVariants[proxyIndex],
      [field]: value
    };
    setVariants(newVariants);
  };

  const handleFileChange = (
    file: File | null,
    level: 'material' | 'variant' | 'store',
    variantIndex?: number,
    storeIndex?: number
  ) => {
    if (level === 'material') {
      setMaterialImage(file);
    } else if (level === 'variant' && variantIndex !== undefined) {
      handleVariantChange(variantIndex, 'image', file);
    } else if (level === 'store' && variantIndex !== undefined && storeIndex !== undefined) {
      handleStoreChange(variantIndex, storeIndex, 'image', file);
    }
  };

  const handleImageDelete = (
    level: 'material' | 'variant' | 'store',
    variantIndex?: number,
    storeIndex?: number
  ) => {
    let key = '';
    if (level === 'material') {
      key = 'image';
    } else if (level === 'variant' && variantIndex !== undefined) {
      key = `variant_image_${variantIndex}`;
    } else if (level === 'store' && variantIndex !== undefined && storeIndex !== undefined) {
      key = `store_image_${variantIndex}_${storeIndex}`;
    }
    if (key) {
      setDeletedImageKeys(prev => new Set(prev).add(key));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || variants.length === 0) return;

    // Build image files map for FormData
    const imageFiles: Record<string, File> = {};
    const deletedKeys = new Set(deletedImageKeys);
    if (materialImage) {
      imageFiles['image'] = materialImage;
      deletedKeys.delete('image');
    }
    variants.forEach((v, idx) => {
      if (v.image) {
        imageFiles[`variant_image_${idx}`] = v.image;
        deletedKeys.delete(`variant_image_${idx}`);
      }
      v.stores.forEach((s, sIdx) => {
        if (s.image) {
          imageFiles[`store_image_${idx}_${sIdx}`] = s.image;
          deletedKeys.delete(`store_image_${idx}_${sIdx}`);
        }
      });
    });

    // Convert deleted keys to array for backend
    const deleteImages = Array.from(deletedKeys);

    // Convert variants with stores to API format.
    // Keep at least one valid store per variant when possible.
    const fullVariants = variants.map((v) => {
      const storesPayload: {
        id?: number;
        store_id?: string;
        store_name?: string;
        sku: string;
        price: number;
      }[] = [];

      for (const s of v.stores) {
        const resolvedStoreValue =
          s.storeId ??
          stores[0]?.id ??
          null;

        if (resolvedStoreValue === null || resolvedStoreValue === undefined) {
          continue;
        }

        const normalizedStoreValue = String(resolvedStoreValue).trim();
        if (!normalizedStoreValue) {
          continue;
        }

        const hasNumericStoreId = /^\d+$/.test(normalizedStoreValue);

        storesPayload.push({
          ...(s.id !== undefined ? { id: s.id } : {}),
          ...(hasNumericStoreId
            ? { store_id: normalizedStoreValue }
            : { store_name: normalizedStoreValue }),
          sku: s.sku,
          price: s.price,
        });
      }

      return {
        ...(v.id !== undefined ? { id: v.id } : {}),
        name: v.name,
        unit: v.unit,
        stores: storesPayload,
        proxy_variants: v.proxyVariants.map((p) => ({
          ...(p.id !== undefined ? { id: p.id } : {}),
          unit: p.unit,
          divisor: p.divisor,
        })),
      };
    });

    if (fullVariants.some((v) => v.stores.length === 0)) {
      window.alert('Each variant must have at least one store selected before saving.');
      return;
    }

    if (editingMaterial) {
      await updateMaterial(
        editingMaterial.id,
        { description },
        fullVariants,
        selectedTags,
        imageFiles,
        deleteImages,
      );
    } else {
      await addMaterial(
        { description },
        fullVariants,
        selectedTags,
        imageFiles,
        deleteImages,
      );
    }

    navigate('/');
  };

  // Prepare tag options
  const tagOptions = allTags.map(tag => ({ value: tag.name, label: tag.name }));

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Helmet>
        <title>Add New Material | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12 mb-6">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{editingMaterial ? 'Edit Material' : 'Add New Material'}</h1>
        </div>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        
        {/* Basic Info */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
              <input
                type="text"
                required
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 3/4 Inch Plywood Sheet"
              />
            </div>
          </div>

          <div>
            <ComboboxSelect
              label="Tags"
              mode="multiple"
              values={selectedTags}
              onChange={setSelectedTags}
              options={tagOptions}
              placeholder="Add tags..."
              createNewPrefix="Create new tag:"
            />
          </div>

          <ImagePicker
            label="Image"
            file={materialImage}
            onFileChange={(file) => handleFileChange(file, 'material')}
            onDelete={() => handleImageDelete('material')}
            initialUrl={getMaterialInitialImageUrl}
          />
        </div>

        {/* Variants */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Variants</h2>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddVariant}>
              <Plus className="h-4 w-4 mr-1" /> Add Variant
            </Button>
          </div>

          {variants.map((variant, variantIndex) => (
            <div key={variantIndex} className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
              <div className="relative">
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(variantIndex)}
                    className="absolute top-0 right-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                    <div className={`flex items-center w-full rounded-md border border-gray-200 bg-white px-3 py-2 min-h-[38px] ${
                      'focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)]'
                    }`}>
                      <input
                        type="text"
                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm p-0 text-gray-900 placeholder-gray-500"
                        placeholder="Standard"
                        value={variant.name}
                        onChange={(e) => handleVariantChange(variantIndex, 'name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <ComboboxSelect
                      label="Unit"
                      value={variant.unit}
                      onChange={(value) => {
                        handleVariantChange(variantIndex, 'unit', value);
                      }}
                      options={units.map(u => ({ value: u.name, label: u.name }))}
                      placeholder="e.g. sheet, box, lb"
                      createNewPrefix="Create new unit:"
                    />
                  </div>
                  
                  <ImagePicker
                    label="Variant Image"
                    file={variant.image}
                    onFileChange={(file) => handleFileChange(file, 'variant', variantIndex)}
                    onDelete={() => handleImageDelete('variant', variantIndex)}
                    initialUrl={getVariantInitialImageUrl(variant.id)}
                  />
                </div>
              </div>

              {/* Stores */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Stores</h3>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleAddStore(variantIndex)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Store
                  </Button>
                </div>

                {variant.stores.map((store, storeIndex) => (
                  <div key={storeIndex} className="bg-white p-3 rounded border border-gray-200 relative">
                    {variant.stores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStore(variantIndex, storeIndex)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <ComboboxSelect
                          label="Store"
                          value={store.storeId}
                          onChange={(value) => {
                            handleStoreChange(variantIndex, storeIndex, 'storeId', value);
                          }}
                          options={stores.map(s => ({ value: s.id, label: s.name }))}
                          placeholder="Select store..."
                          allowCreate
                          createNewPrefix="Create new store:"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                        <NumberInput
                          disabled={store.priceSource === 'api'}
                          className={`block w-full rounded-md border-gray-200 focus:border-[var(--accent-500)] focus:ring-[var(--accent-500)] text-sm ${
                            store.priceSource === 'api' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                          }`}
                          placeholder={store.priceSource === 'api' ? 'From API' : '0.00'}
                          value={store.price ?? null}
                          onValueChange={(value) => {
                            if (value !== null) handleStoreChange(variantIndex, storeIndex, 'price', value);
                          }}
                          formatOnBlur={(value) => value.toFixed(2)}
                          min={0.01}
                          step={0.01}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Store SKU</label>
                        <div className="flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px]">
                          <input
                            type="text"
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                            placeholder="Optional"
                            value={store.sku}
                            onChange={(e) => handleStoreChange(variantIndex, storeIndex, 'sku', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center mt-6">
                        <Checkbox
                          id={`api-${variantIndex}-${storeIndex}`}
                          checked={store.priceSource === 'api'}
                          onCheckedChange={(checked) => {
                            handleStoreChange(
                              variantIndex,
                              storeIndex,
                              'priceSource',
                              checked ? 'api' : 'manual'
                            );
                          }}
                        />
                        <label htmlFor={`api-${variantIndex}-${storeIndex}`} className="ml-2 block text-xs font-medium text-gray-700">
                          Get info from store API
                        </label>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <ImagePicker
                          label="Store Image"
                          file={store.image}
                          onFileChange={(file) => handleFileChange(file, 'store', variantIndex, storeIndex)}
                          onDelete={() => handleImageDelete('store', variantIndex, storeIndex)}
                          initialUrl={getStoreInitialImageUrl(variant.id, store.storeId)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Proxy Variants */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">Proxy Variants</h3>
                  <Button type="button" size="sm" variant="outline" onClick={() => handleAddProxy(variantIndex)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Proxy
                  </Button>
                </div>

                {variant.proxyVariants.map((proxy, proxyIndex) => (
                  <div key={proxyIndex} className="bg-white p-3 rounded border border-dashed border-gray-300 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveProxy(variantIndex, proxyIndex)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <ComboboxSelect
                          label="Proxy Unit"
                          value={proxy.unit}
                          onChange={(value) => handleProxyChange(variantIndex, proxyIndex, 'unit', value)}
                          options={units.map(u => ({ value: u.name, label: u.name }))}
                          placeholder="e.g. ft, in, lb"
                          createNewPrefix="Create new unit:"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Divisor</label>
                        <NumberInput
                          className="block w-full rounded-md border-gray-200 focus:border-[var(--accent-500)] focus:ring-[var(--accent-500)] text-sm"
                          placeholder="e.g. 250"
                          value={proxy.divisor ?? null}
                          onValueChange={(value) => {
                            if (value !== null) handleProxyChange(variantIndex, proxyIndex, 'divisor', value);
                          }}
                          formatOnBlur={(value) => String(value)}
                          min={1}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancel</Button>
          <Button type="submit">{editingMaterial ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </div>
  );
};