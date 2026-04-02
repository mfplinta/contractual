import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMaterials } from '../hooks';
import { useSettings } from '@/features/settings/hooks';
import { useTags } from '@/hooks/useTags';
import { useStores } from '@/hooks/useStores';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setMaterialsSearchQuery,
  setMaterialsSelectedStoreIds,
  setMaterialsSelectedTags,
} from '../materialSlice';
import { FilterBar, FilterItem } from '@/components/shared/FilterBar';
import { MaterialCard } from '../components/MaterialCard';
import { MaterialListRow } from '../components/MaterialListRow';
import { ResponsiveTable } from '@/components/shared/ResponsiveTable';
import { Plus, Filter as FilterIcon, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TagRead } from '@/services/generatedApi';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet';

export const MaterialsPage = () => {
  const { searchMaterials, deleteMaterial } = useMaterials();
  const { settings, updateSettings } = useSettings();
  const { allTags } = useTags();
  const { stores } = useStores();
  const dispatch = useAppDispatch();
  const materialsSearchQuery = useAppSelector(state => state.ui.materialsSearchQuery);
  const materialsSelectedTags = useAppSelector(state => state.ui.materialsSelectedTags);
  const materialsSelectedStoreIds = useAppSelector(state => state.ui.materialsSelectedStoreIds);
  const viewMode = settings?.materialsViewMode || 'grid';
  const GRID_PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(GRID_PAGE_SIZE);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'description' | 'variants' | 'price' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const tagFilterItems: FilterItem[] = allTags.map(tag => ({
    id: `tag:${tag.id}`,
    name: tag.name,
    type: 'tag'
  }));

  const storeFilterItems: FilterItem[] = stores.map((store) => ({
    id: `store:${store.id}`,
    name: store.name,
    type: 'store',
  }));

  const filterItems: FilterItem[] = [...tagFilterItems, ...storeFilterItems];

  const selectedTagFilters = materialsSelectedTags
    .map(tagName => allTags.find(tag => tag.name === tagName))
    .filter((tag): tag is TagRead => Boolean(tag))
    .map(tag => ({ id: `tag:${tag.id}`, name: tag.name, type: 'tag' as const }));

  const selectedStoreFilters = materialsSelectedStoreIds
    .map((storeId) => stores.find((store) => String(store.id) === String(storeId)))
    .filter(Boolean)
    .map((store) => ({
      id: `store:${store!.id}`,
      name: store!.name,
      type: 'store' as const,
    }));

  const selectedFilters = [...selectedTagFilters, ...selectedStoreFilters];

  const materials = useMemo(() => {
    const filtered = searchMaterials(
      materialsSearchQuery,
      materialsSelectedTags,
      materialsSelectedStoreIds,
    );
    
    // When no sort is active, preserve Fuse relevance order
    if (!sortField) return filtered;

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      if (sortField === 'variants') {
        aVal = a.variants.length;
        bVal = b.variants.length;
      } else if (sortField === 'price') {
        const aPrices = a.variants.flatMap(v => v.stores.map(s => s.price));
        aVal = aPrices.length > 0 ? Math.min(...aPrices) : 0;
        const bPrices = b.variants.flatMap(v => v.stores.map(s => s.price));
        bVal = bPrices.length > 0 ? Math.min(...bPrices) : 0;
      } else {
        aVal = a[sortField];
        bVal = b[sortField];
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [materialsSearchQuery, materialsSelectedTags, materialsSelectedStoreIds, searchMaterials, sortField, sortDirection]);

  const totalPages = Math.ceil(materials.length / itemsPerPage);
  const paginatedMaterials = materials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const gridMaterials = materials.slice(0, visibleCount);
  const hasMoreGrid = visibleCount < materials.length;

  // Reset visible count when filters/sort change
  useEffect(() => {
    setVisibleCount(GRID_PAGE_SIZE);
  }, [materialsSearchQuery, materialsSelectedTags, materialsSelectedStoreIds, sortField, sortDirection]);

  // Reset sort when search query or tag filters change to preserve Fuse relevance order
  useEffect(() => {
    setSortField(null);
    setSortDirection('asc');
  }, [materialsSearchQuery, materialsSelectedTags, materialsSelectedStoreIds]);

  // IntersectionObserver for infinite scroll in grid view
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + GRID_PAGE_SIZE, materials.length));
  }, [materials.length]);

  useEffect(() => {
    if (viewMode !== 'grid') return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreGrid) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, hasMoreGrid, loadMore]);

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this material?')) {
      deleteMaterial(id);
    }
  };

  const handleSort = (field: 'description' | 'variants' | 'price') => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      <Helmet>
        <title>Materials | Contractual</title>
      </Helmet>

      <div className="flex items-center justify-between h-12 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
        <Link 
          to="/materials/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--accent-fg-600)] bg-[var(--accent-600)] hover:bg-[var(--accent-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-500)]"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Material
        </Link>
      </div>

      <FilterBar
        containerClassName="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 sticky top-20 z-40"
        placeholder="Search materials..."
        items={filterItems}
        selectedFilters={selectedFilters}
        onFiltersChange={(filters) => {
          const tags = filters
            .filter((f) => f.type === 'tag')
            .map((f) => f.name);
          const storeIds = filters
            .filter((f) => f.type === 'store')
            .map((f) => f.id.replace('store:', ''));

          dispatch(setMaterialsSelectedTags(tags));
          dispatch(setMaterialsSelectedStoreIds(storeIds));
        }}
        onSearchChange={(query) => dispatch(setMaterialsSearchQuery(query))}
        searchValue={materialsSearchQuery}
        suggestionIcon={FilterIcon}
        rightContent={(
          <div className="flex items-center bg-gray-100 rounded-lg flex-none">
            <button
              onClick={() => updateSettings({ materialsViewMode: 'grid' })}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'grid' ? "bg-white shadow-sm text-[var(--accent-600)]" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => updateSettings({ materialsViewMode: 'list' })}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'list' ? "bg-white shadow-sm text-[var(--accent-600)]" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <ListIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      />

      {materials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No materials found matching your criteria.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gridMaterials.map(material => (
                  <MaterialCard 
                    key={material.id} 
                    material={material}
                    onDelete={handleDelete}
                    searchQuery={materialsSearchQuery}
                    filterStoreIds={materialsSelectedStoreIds}
                  />
                ))}
              </div>
              {hasMoreGrid && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  <span className="text-sm text-gray-400">Loading more...</span>
                </div>
              )}
            </>
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'handle', label: '', minWidth: '48px', width: 48 },
                { key: 'image', label: '', minWidth: '64px', width: 64 },
                {
                  key: 'material',
                  label: 'Material',
                  minWidth: '200px',
                  resizable: true,
                  expand: true,
                  onSort: () => handleSort('description'),
                  sortDirection: sortField === 'description' ? sortDirection : null,
                },
                {
                  key: 'unit',
                  label: 'Unit',
                  minWidth: '80px',
                  resizable: true,
                  onSort: () => handleSort('variants'),
                  sortDirection: sortField === 'variants' ? sortDirection : null,
                },
                {
                  key: 'price',
                  label: 'Price',
                  minWidth: '90px',
                  resizable: true,
                  onSort: () => handleSort('price'),
                  sortDirection: sortField === 'price' ? sortDirection : null,
                },
                {
                  key: 'actions',
                  label: '',
                  align: 'right',
                  minWidth: '120px',
                  shrinkMinWidth: '64px',
                  resizable: true,
                  keepRight: true
                }
              ]}
            >
              {paginatedMaterials.map((material) => (
                <MaterialListRow
                  key={material.id}
                  material={material}
                  onDelete={handleDelete}
                />
              ))}
            </ResponsiveTable>
          )}

        {/* Pagination (list view only) */}
        {viewMode === 'list' && (
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
            
            <div className="ml-4 flex items-center">
               <span className="mr-2 text-sm text-gray-600">Show:</span>
               <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                  }}
                  className="border-gray-300 rounded-md text-sm"
               >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
               </select>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
};