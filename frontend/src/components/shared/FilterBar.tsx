import React, { useState, useRef, useEffect } from 'react';
import { Search, X, LucideIcon } from 'lucide-react';
import { capitalizeFirstLetter } from '@/lib/utils';
import { useFuse } from '../../hooks/useFuse';

export interface FilterItem {
  id: string;
  name: string;
  type?: string;
}

interface FilterBarProps {
  placeholder: string;
  items?: FilterItem[];
  selectedFilters?: FilterItem[];
  onFiltersChange?: (filters: FilterItem[]) => void;
  onSearchChange: (query: string) => void;
  searchValue?: string;
  suggestionIcon?: LucideIcon;
  suggestionLabel?: (item: FilterItem) => string;
  containerClassName?: string;
  rightContent?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  placeholder,
  items,
  selectedFilters,
  onFiltersChange,
  onSearchChange,
  searchValue,
  suggestionIcon: SuggestionIcon,
  suggestionLabel,
  containerClassName,
  rightContent
}) => {
  const [inputValue, setInputValue] = useState(searchValue || '');
  const [suggestions, setSuggestions] = useState<FilterItem[]>([]);
  const [isFocusedWithin, setIsFocusedWithin] = useState(false);
  const isControlled = searchValue !== undefined;
  const effectiveValue = isControlled ? (searchValue || '') : inputValue;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isControlled) {
      setInputValue(searchValue || '');
    }
  }, [isControlled, searchValue]);

  const fuseSearch = useFuse(items ?? [], ['name']);

  useEffect(() => {
    if(!items || !onFiltersChange || !selectedFilters) {
      return;
    }
    if (effectiveValue.length > 0) {
      setSuggestions(
        fuseSearch(effectiveValue).filter((item: FilterItem) =>
          !selectedFilters.some(f => f.id === item.id)
        )
      );
    } else {
      setSuggestions([]);
    }
  }, [effectiveValue, items, selectedFilters, fuseSearch]);

  const addFilter = (item: FilterItem) => {
    if(!onFiltersChange || !selectedFilters) {
      return;
    }
    const newFilters = [...selectedFilters, item];
    onFiltersChange(newFilters);
    if (isControlled) {
      onSearchChange('');
    } else {
      setInputValue('');
      onSearchChange('');
    }
    inputRef.current?.focus();
  };

  const removeFilter = (itemId: string) => {
    if(!onFiltersChange || !selectedFilters) {
      return;
    }
    const newFilters = selectedFilters.filter(f => f.id !== itemId);
    onFiltersChange(newFilters);
  };

  const getFilterColor = (filter: FilterItem) => {
    if (filter.type === 'client') return 'bg-blue-100 text-blue-800';
    if (filter.type === 'job') return 'bg-green-100 text-green-800';
    return 'bg-[var(--accent-100)] text-[var(--accent-800)]';
  };

  const getFilterRemoveColor = (filter: FilterItem) => {
    if (filter.type === 'client') return 'text-blue-600 hover:text-blue-900';
    if (filter.type === 'job') return 'text-green-600 hover:text-green-900';
    return 'text-[var(--accent-600)] hover:text-[var(--accent-900)]';
  };

  const barContent = (
    <div
      ref={containerRef}
      className="flex-1 w-full min-w-0 relative group"
      onFocusCapture={() => setIsFocusedWithin(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !containerRef.current?.contains(nextTarget)) {
          setIsFocusedWithin(false);
        }
      }}
      onClick={() => {
        inputRef.current?.focus();
      }}
      tabIndex={-1}
      style={{ cursor: 'text' }}
    >
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <div className="flex flex-wrap items-center w-full rounded-md border border-gray-300 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] pl-10 pr-3 py-2 min-h-[38px]">
        {selectedFilters?.map(filter => (
          <span key={filter.id} className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium mr-2 my-0.5 ${getFilterColor(filter)}`}>
            {filter.type && (
              <span className="text-xs opacity-60 mr-1">{filter.type}:</span>
            )}
            {filter.name}
            <button onClick={e => { e.stopPropagation(); removeFilter(filter.id); }} className={`ml-1 focus:outline-none ${getFilterRemoveColor(filter)}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
          placeholder={placeholder}
          value={effectiveValue}
          onChange={(e) => {
            const nextValue = e.target.value;
            if (!isControlled) {
              setInputValue(nextValue);
            }
            onSearchChange(nextValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && inputValue === '' && selectedFilters && selectedFilters.length > 0) {
              removeFilter(selectedFilters[selectedFilters.length - 1].id);
            }
          }}
          onClick={e => e.stopPropagation()}
        />
        {(effectiveValue.length > 0 || (selectedFilters && selectedFilters.length > 0)) && (
          <button
            type="button"
            className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              if (!isControlled) {
                setInputValue('');
              }
              onSearchChange('');
              if (onFiltersChange && selectedFilters && selectedFilters.length > 0) {
                onFiltersChange([]);
              }
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {/* Suggestions Dropdown */}
      {isFocusedWithin && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50">
          {suggestions.map(item => (
            <button
              key={item.id}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[var(--accent-50)] flex items-center"
              onClick={() => addFilter(item)}
            >
              {SuggestionIcon && <SuggestionIcon className="h-3 w-3 mr-2 text-gray-400" />}
              {suggestionLabel ? suggestionLabel(item) : (
                <>
                  {capitalizeFirstLetter(item.type!)}: <span className="font-medium ml-1">{item.name}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  if (!containerClassName && !rightContent) {
    return barContent;
  }

  return (
    <div className={containerClassName}>
      <div className="flex flex-row flex-nowrap gap-3 items-center">
        {barContent}
        {rightContent}
      </div>
    </div>
  );
};
