import React, { useEffect, useRef, useState } from 'react';
import { cn, clamp } from '@/lib/utils';
import { useNonPassiveWheelListener } from '@/hooks/useNonPassiveWheelListener';

export type NumberInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  formatOnBlur?: (value: number) => string;
  parseOnBlur?: (raw: string) => number | null;
  invalid?: boolean;
  setInvalid?: (invalid: boolean) => void;
  leadingLabel?: string;
  leadingLabelClassName?: string;
  leadingLabelPaddingClassName?: string;
};

const defaultParse = (raw: string) => {
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

export const parseExpression = (raw: string): number | null => {
  const expression = raw.trim();
  if (expression === '') return null;
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) return null;
  try {
    const result = new Function(`return (${expression})`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) return null;
    return Number(result.toFixed(4));
  } catch {
    return null;
  }
};

export const NumberInput = ({
  value,
  onValueChange,
  formatOnBlur,
  parseOnBlur = defaultParse,
  invalid,
  setInvalid,
  leadingLabel,
  leadingLabelClassName,
  leadingLabelPaddingClassName,
  className,
  onBlur,
  onFocus,
  onWheel,
  ...props
}: NumberInputProps) => {
  const [inputValue, setInputValue] = useState(value === null ? '' : String(value));
  const [localInvalid, setLocalInvalid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const originalValueRef = useRef<string>('');

  useEffect(() => {
    const formatted = value === null ? '' : formatOnBlur ? formatOnBlur(value) : String(value);
    if (isFocused) {
      if (!hasTyped) {
        setInputValue(formatted);
        originalValueRef.current = formatted;
      }
      return;
    }
    setInputValue(formatted);
  }, [value, formatOnBlur, isFocused, hasTyped]);

  const resolvedInvalid = invalid ?? localInvalid;
  const updateInvalid = setInvalid ?? setLocalInvalid;

  const stepValue = typeof props.step === 'number'
    ? props.step
    : typeof props.step === 'string'
      ? Number(props.step)
      : 1;
  const minValue = typeof props.min === 'number'
    ? props.min
    : typeof props.min === 'string'
      ? Number(props.min)
      : undefined;
  const maxValue = typeof props.max === 'number'
    ? props.max
    : typeof props.max === 'string'
      ? Number(props.max)
      : undefined;
  const precision = Number.isFinite(stepValue) && !Number.isInteger(stepValue)
    ? `${stepValue}`.split('.')[1]?.length ?? 0
    : 0;
  const roundToStep = (nextValue: number) => {
    if (!Number.isFinite(stepValue) || stepValue <= 0) return nextValue;
    const rounded = Math.round(nextValue / stepValue) * stepValue;
    return precision > 0 ? Number(rounded.toFixed(precision)) : rounded;
  };
  const applyValue = (nextValue: number) => {
    const bounded = clamp(nextValue, minValue, maxValue);
    const rounded = roundToStep(bounded);
    onValueChange(rounded);
    if (formatOnBlur) {
      setInputValue(formatOnBlur(rounded));
    } else {
      setInputValue(String(rounded));
    }
    updateInvalid(false);
  };

  const applyValueRef = useRef(applyValue);
  applyValueRef.current = applyValue;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const isFocusedRef = useRef(false);

  useNonPassiveWheelListener(
    inputRef,
    (event) => {
      if (props.disabled) return;
      if (!isFocusedRef.current) return;
      if (event.deltaY === 0) return;
      event.preventDefault();
      event.stopPropagation();
      setHasTyped(true);
      const direction = event.deltaY < 0 ? 1 : -1;
      const currentParsed = Number(inputValue);
      const baseValue = Number.isFinite(currentParsed) ? currentParsed : (value ?? 0);
      applyValueRef.current(baseValue + direction * stepValue);
    },
    !props.disabled,
  );

  const baseInputClass = 'rounded-md border border-gray-200 bg-white px-3 py-2 min-h-[38px] text-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none';
  const inputElement = (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={inputValue}
      ref={inputRef}
      className={cn(
        baseInputClass,
        className,
        resolvedInvalid ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500' : null,
        isFocused && !hasTyped ? 'text-gray-400' : null
      )}
      onChange={(event) => {
        if (!hasTyped) {
          setHasTyped(true);
        }
        setInputValue(event.target.value);
        if (resolvedInvalid) {
          updateInvalid(false);
        }
      }}
      onMouseDown={(event) => {
        if (isFocused && !hasTyped) {
          event.preventDefault();
          const input = inputRef.current;
          if (input) {
            input.setSelectionRange(0, 0);
            requestAnimationFrame(() => {
              input.setSelectionRange(0, 0);
            });
          }
        }
        props.onMouseDown?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        isFocusedRef.current = true;
        setHasTyped(false);
        originalValueRef.current = inputValue;
        const input = inputRef.current;
        if (input) {
          input.setSelectionRange(0, 0);
          requestAnimationFrame(() => {
            input.setSelectionRange(0, 0);
          });
        }
        onFocus?.(event);
      }}
      onKeyDown={(event) => {
        if (!hasTyped) {
          if (event.key.length === 1) {
            setHasTyped(true);
            setInputValue('');
          } else if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            setHasTyped(true);
            setInputValue('');
          }
        }
        props.onKeyDown?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        isFocusedRef.current = false;
        const currentRaw = event.currentTarget.value;
        const hasEdited = hasTyped || currentRaw !== originalValueRef.current;
        if (!hasEdited) {
          setInputValue(originalValueRef.current);
          updateInvalid(false);
          setHasTyped(false);
          onBlur?.(event);
          return;
        }
        setInputValue(currentRaw);
        const parsed = parseOnBlur(currentRaw);
        if (parsed === null) {
          setInputValue(originalValueRef.current);
          updateInvalid(true);
        } else {
          const clamped = clamp(parsed, minValue, maxValue);
          updateInvalid(false);
          onValueChange(clamped);
          if (formatOnBlur) {
            setInputValue(formatOnBlur(clamped));
          }
        }
        setHasTyped(false);
        onBlur?.(event);
      }}
      onWheel={onWheel}
    />
  );

  if (!leadingLabel) {
    return inputElement;
  }

  return (
    <div className="relative">
      <span className={cn('pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500', leadingLabelClassName)}>
        {leadingLabel}
      </span>
      {React.cloneElement(inputElement, {
        className: cn(inputElement.props.className, leadingLabelPaddingClassName ?? 'pl-9')
      })}
    </div>
  );
};
