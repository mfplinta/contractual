import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, X } from 'lucide-react';
import { useIsTouchDevice } from '../ui/use-mobile';

type ComboboxValue = string | number;

interface ComboboxOption<T extends ComboboxValue> {
  value: T;
  label: string;
}

interface BaseComboboxProps<T extends ComboboxValue> {
  label?: string;
  options: ComboboxOption<T>[];
  placeholder?: string;
  createNewPrefix?: string;
  allowCreate?: boolean;
  disabled?: boolean;
}

interface SingleComboboxProps<T extends ComboboxValue> extends BaseComboboxProps<T> {
  mode?: 'single';
  value: T | null;
  onChange: (value: T) => void;
  openOnFocus?: boolean;
}

interface MultipleComboboxProps<T extends ComboboxValue> extends BaseComboboxProps<T> {
  mode: 'multiple';
  values: T[];
  onChange: (values: T[]) => void;
}

type ComboboxSelectProps<T extends ComboboxValue> = SingleComboboxProps<T> | MultipleComboboxProps<T>;

export const ComboboxSelect = <T extends ComboboxValue>(props: ComboboxSelectProps<T>) => {
  const isMultipleProps = (input: ComboboxSelectProps<T>): input is MultipleComboboxProps<T> => {
    return input.mode === 'multiple';
  };

  const {
    label,
    options,
    placeholder = 'Search or create...',
    createNewPrefix = 'Create new:',
    allowCreate = true,
    disabled = false
  } = props;

  const isMultiple = isMultipleProps(props);
  const singleValue = !isMultiple ? (props as SingleComboboxProps<T>).value : null;
  const multipleValues = isMultiple ? (props as MultipleComboboxProps<T>).values : [];

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipFocusOpenRef = useRef(false);
  const [isMobileEditingEnabled, setIsMobileEditingEnabled] = useState(false);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const isTouchDevice = useIsTouchDevice();
  const isMobileLike = isTouchDevice;
  const lastTouchTimeRef = useRef(0);
  const awaitingSecondTapRef = useRef(false);
  const menuInteractionRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = useRef(false);

  const selectedValues = isMultiple
    ? multipleValues
    : (singleValue !== null ? [singleValue] : []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!isMultiple || !selectedValues.includes(option.value))
  );

  const exactMatch = options.find(
    opt => opt.label.toLowerCase() === searchQuery.toLowerCase()
  );

  const createValue = (() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length === 0) return null;
    return trimmedQuery as T;
  })();
  const canCreateValue = createValue !== null;

  const showCreateNew = !disabled
    && allowCreate
    && searchQuery.length > 0
    && !exactMatch
    && canCreateValue
    && (!isMultiple || !selectedValues.includes(createValue));

  const allowTextInput = !isMobileLike || options.length === 0 || isMobileEditingEnabled;

  const selectedOption = !isMultiple
    ? options.find(opt => opt.value === singleValue)
    : undefined;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsMobileEditingEnabled(false);
      awaitingSecondTapRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setHasUserTyped(false);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: T) => {
    if (disabled) return;
    if (isMultiple) {
      (props as MultipleComboboxProps<T>).onChange([...multipleValues, optionValue]);
      setSearchQuery('');
      inputRef.current?.focus();
    } else {
      (props as SingleComboboxProps<T>).onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
      setHasUserTyped(false);
    }
  };

  const handleRemove = (optionValue: T) => {
    if (disabled) return;
    if (!isMultiple) return;
    (props as MultipleComboboxProps<T>).onChange(multipleValues.filter((value) => value !== optionValue));
  };

  const handleCreateNew = () => {
    if (disabled) return;
    if (!allowCreate) return;
    if (!canCreateValue || createValue === null) return;
    if (isMultiple) {
      (props as MultipleComboboxProps<T>).onChange([...multipleValues, createValue]);
      setSearchQuery('');
      inputRef.current?.focus();
    } else {
      (props as SingleComboboxProps<T>).onChange(createValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!allowTextInput) return;
    if (disabled) return;
    if (!hasUserTyped) {
      setHasUserTyped(true);
    }
    setSearchQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    if (!allowTextInput) return;
    if (disabled) return;
    if (skipFocusOpenRef.current) {
      skipFocusOpenRef.current = false;
      return;
    }
    if (!isMultiple && (props as SingleComboboxProps<T>).openOnFocus !== false) {
      setIsOpen(true);
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (isMobileLike && options.length > 0 && !isMobileEditingEnabled) {
      setIsOpen(true);
      return;
    }
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSearchQuery('');
      }
      return next;
    });
    if (!isOpen) {
      if (allowTextInput) {
        inputRef.current?.focus();
      }
    }
  };

  const handleMobileTap = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    if (!isMobileLike || disabled || options.length === 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-combobox-menu]')) return;
    if (target?.closest('button')) return;
    if (event.type === 'touchstart') {
      lastTouchTimeRef.current = Date.now();
    }
    if (event.type === 'mousedown' && Date.now() - lastTouchTimeRef.current < 500) {
      return;
    }

    if (!isOpen) {
      event.preventDefault();
      event.stopPropagation();
      awaitingSecondTapRef.current = true;
      setIsOpen(true);
      return;
    }

    if (awaitingSecondTapRef.current && !isMobileEditingEnabled) {
      event.preventDefault();
      event.stopPropagation();
      awaitingSecondTapRef.current = false;
      setIsMobileEditingEnabled(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleMobileChevronTap = () => {
    if (!isMobileLike || disabled || options.length === 0) return false;
    if (!isOpen) {
      awaitingSecondTapRef.current = true;
      setIsOpen(true);
      return true;
    }
    if (awaitingSecondTapRef.current && !isMobileEditingEnabled) {
      awaitingSecondTapRef.current = false;
      setIsMobileEditingEnabled(true);
      requestAnimationFrame(() => inputRef.current?.focus());
      return true;
    }
    return true;
  };

  const getDisplayLabel = (value: T) => {
    return options.find(opt => opt.value === value)?.label || String(value);
  };

  const isNewValue = (value: T) => {
    return !options.find(opt => opt.value === value);
  };

  const displayValue = isMultiple
    ? searchQuery
    : (hasUserTyped || searchQuery.length > 0
        ? searchQuery
      : (selectedOption?.label || (singleValue !== null ? String(singleValue) : '')));
    const singleIsNewValue = !isMultiple && singleValue !== null && !options.find(opt => opt.value === singleValue);
  const inputTextColor = singleIsNewValue ? 'text-green-700' : 'text-gray-900';

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}


      {isMultiple ? (
        <div
          className="relative"
          onMouseDown={handleMobileTap}
          onTouchStart={(event) => {
            if (!isMobileLike) return;
            touchStartRef.current = { x: event.touches[0]?.clientX ?? 0, y: event.touches[0]?.clientY ?? 0 };
            touchMovedRef.current = false;
          }}
          onTouchMove={(event) => {
            if (!isMobileLike || !touchStartRef.current) return;
            const dx = Math.abs((event.touches[0]?.clientX ?? 0) - touchStartRef.current.x);
            const dy = Math.abs((event.touches[0]?.clientY ?? 0) - touchStartRef.current.y);
            if (dx > 8 || dy > 8) {
              touchMovedRef.current = true;
            }
          }}
          onTouchEnd={(event) => {
            if (!isMobileLike || touchMovedRef.current) return;
            handleMobileTap(event);
          }}
        >
          <div className="flex flex-wrap items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px] gap-1">
            {multipleValues.map((value) => {
              const isNew = isNewValue(value);
              const displayLabel = getDisplayLabel(value);
              return (
                <span 
                  key={value} 
                  className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                    isNew ? 'bg-green-100 text-green-800' : 'bg-[var(--accent-100)] text-[var(--accent-800)]'
                  }`}
                >
                  {displayLabel}
                  <button 
                    type="button"
                    onClick={() => handleRemove(value)} 
                    className={`ml-1 focus:outline-none ${
                      isNew ? 'text-green-600 hover:text-green-900' : 'text-[var(--accent-600)] hover:text-[var(--accent-900)]'
                    }`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}

            <div className="flex-1 flex items-center min-w-[120px]">
              <input
                ref={inputRef}
                type="text"
                inputMode={allowTextInput ? 'text' : 'none'}
                readOnly={!allowTextInput}
                disabled={disabled}
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 placeholder-gray-500 p-0"
                placeholder={multipleValues.length === 0 ? placeholder : ''}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => {
                  if (isMobileLike && !allowTextInput) {
                    return;
                  }
                  setIsOpen(true);
                }}
                onBlur={() => {
                  setHasUserTyped(false);
                  if (menuInteractionRef.current) {
                    menuInteractionRef.current = false;
                    return;
                  }
                  setIsMobileEditingEnabled(false);
                  awaitingSecondTapRef.current = false;
                  setIsOpen(false);
                  setSearchQuery('');
                }}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (disabled) return;
                  if (handleMobileChevronTap()) return;
                  setIsOpen(!isOpen);
                  if (!isOpen) {
                    inputRef.current?.focus();
                  }
                }}
                className="ml-2"
              >
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative"
          onMouseDown={() => {
            if (disabled || isMobileLike) return;
            skipFocusOpenRef.current = true;
          }}
          onClick={() => {
            if (isMobileLike) return;
            toggleOpen();
          }}
          onTouchStart={(event) => {
            if (!isMobileLike) return;
            touchStartRef.current = { x: event.touches[0]?.clientX ?? 0, y: event.touches[0]?.clientY ?? 0 };
            touchMovedRef.current = false;
          }}
          onTouchMove={(event) => {
            if (!isMobileLike || !touchStartRef.current) return;
            const dx = Math.abs((event.touches[0]?.clientX ?? 0) - touchStartRef.current.x);
            const dy = Math.abs((event.touches[0]?.clientY ?? 0) - touchStartRef.current.y);
            if (dx > 8 || dy > 8) {
              touchMovedRef.current = true;
            }
          }}
          onTouchEnd={(event) => {
            if (!isMobileLike || touchMovedRef.current) return;
            handleMobileTap(event);
          }}
        >
          {singleIsNewValue && !isOpen && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-[5] pointer-events-none">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                new:
              </span>
            </div>
          )}
          <div className={`flex items-center w-full rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] px-3 py-2 min-h-[38px] ${
            singleIsNewValue && !isOpen ? 'pl-14' : ''
          }`}>
            <input
              ref={inputRef}
              type="text"
              inputMode={allowTextInput ? 'text' : 'none'}
              readOnly={!allowTextInput}
              disabled={disabled}
              className={`flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm pr-6 ${inputTextColor}`}
              placeholder={placeholder}
              value={displayValue}
              onChange={handleInputChange}
              onFocus={() => {
                if (isMobileLike && !allowTextInput) {
                  return;
                }
                handleFocus();
              }}
              onBlur={() => {
                setHasUserTyped(false);
                if (menuInteractionRef.current) {
                  menuInteractionRef.current = false;
                  return;
                }
                setIsMobileEditingEnabled(false);
                awaitingSecondTapRef.current = false;
                setIsOpen(false);
                setSearchQuery('');
              }}
            />
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              if (handleMobileChevronTap()) return;
              toggleOpen();
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}

      {isOpen && (
        <div
          data-combobox-menu
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-100 py-1 max-h-60 overflow-auto focus:outline-none sm:text-sm"
          onMouseDown={() => {
            menuInteractionRef.current = true;
          }}
          onTouchStart={() => {
            menuInteractionRef.current = true;
          }}
        >
          {filteredOptions.length === 0 && !showCreateNew ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchQuery ? 'No matching options' : 'Start typing to search...'}
            </div>
          ) : (
            <>
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent-50)] flex items-center justify-between ${
                    !isMultiple && singleValue === option.value ? 'bg-[var(--accent-50)] text-[var(--accent-600)]' : 'text-gray-900'
                  }`}
                >
                  <span>{option.label}</span>
                  {!isMultiple && singleValue === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}

              {showCreateNew && (
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-700 flex items-center border-t border-gray-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="font-medium">{createNewPrefix}</span>
                  <span className="ml-1 italic">{searchQuery}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};