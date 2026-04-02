import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';

export type ResponsiveTableColumn = {
  key: string;
  label?: React.ReactNode;
  headerClassName?: string;
  minWidth?: string;
  width?: number;
  resizable?: boolean;
  expand?: boolean;
  keepRight?: boolean;
  shrinkMinWidth?: string;
  align?: 'left' | 'center' | 'right';
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
};

type ResponsiveTableProps = {
  columns: ResponsiveTableColumn[];
  children: React.ReactNode;
  containerClassName?: string;
  tableClassName?: string;
  headerRowClassName?: string;
};

type ResponsiveTableContextValue = {
  widths: Record<string, number | undefined>;
  columnsByKey: Record<string, ResponsiveTableColumn>;
  expandKey?: string;
};

const ResponsiveTableContext = createContext<ResponsiveTableContextValue | null>(null);

export const useResponsiveTable = () => {
  const context = useContext(ResponsiveTableContext);
  if (!context) {
    throw new Error('useResponsiveTable must be used within ResponsiveTable');
  }
  return context;
};

const getAlignClass = (align?: ResponsiveTableColumn['align']) => {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
};

const parsePx = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getMinWidth = (column: ResponsiveTableColumn) => parsePx(column.minWidth) ?? 0;
const getShrinkMinWidth = (column: ResponsiveTableColumn) =>
  parsePx(column.shrinkMinWidth) ?? getMinWidth(column);
const getBaseWidths = (columns: ResponsiveTableColumn[], widths: Record<string, number | undefined>) =>
  columns.reduce<Record<string, number>>((acc, column) => {
    const minWidth = getMinWidth(column);
    acc[column.key] = widths[column.key] ?? column.width ?? minWidth;
    return acc;
  }, {});

export const ResponsiveTable = ({
  columns,
  children,
  containerClassName,
  tableClassName,
  headerRowClassName
}: ResponsiveTableProps) => {
  const initialWidths = useMemo(() => {
    const map: Record<string, number | undefined> = {};
    columns.forEach((column) => {
      if (typeof column.width === 'number') {
        map[column.key] = column.width;
      }
    });
    return map;
  }, [columns]);

  const [widths, setWidths] = useState<Record<string, number | undefined>>(initialWidths);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const columnsByKey = useMemo(() => {
    return columns.reduce<Record<string, ResponsiveTableColumn>>((acc, column) => {
      acc[column.key] = column;
      return acc;
    }, {});
  }, [columns]);
  const expandKey = useMemo(() => columns.find((column) => column.expand)?.key, [columns]);

  const computedWidths = useMemo(() => {
    const baseWidths = getBaseWidths(columns, widths);
    if (containerWidth <= 0) {
      return baseWidths;
    }

    const expandColumn = expandKey ? columnsByKey[expandKey] : undefined;
    const keepRightColumn = columns.find((column) => column.keepRight);

    const fixedKeys = columns.filter((column) => column.key !== expandKey).map((column) => column.key);
    const fixedWidth = fixedKeys.reduce((sum, key) => sum + (baseWidths[key] || 0), 0);
    const expandMin = expandColumn ? getMinWidth(expandColumn) : 0;
    let available = containerWidth - fixedWidth;

    if (expandColumn) {
      if (available < expandMin && keepRightColumn) {
        const keepKey = keepRightColumn.key;
        const shrinkMin = getShrinkMinWidth(keepRightColumn);
        const deficit = expandMin - available;
        const nextKeepWidth = Math.max(shrinkMin, baseWidths[keepKey] - deficit);
        available = containerWidth - (fixedWidth - baseWidths[keepKey] + nextKeepWidth);
        baseWidths[keepKey] = nextKeepWidth;
      }
      baseWidths[expandColumn.key] = Math.max(expandMin, available);
    }

    return baseWidths;
  }, [columns, containerWidth, expandKey, widths, columnsByKey]);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const updateWidth = () => setContainerWidth(element.getBoundingClientRect().width);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const startResize = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, column: ResponsiveTableColumn) => {
      if (!column.resizable) return;
      const startX = event.clientX;
      const key = column.key;
      const startWidth = computedWidths[key] ?? column.width ?? 0;
      const minWidth = Math.max(getShrinkMinWidth(column), 60);

      const handleMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        let nextWidth = Math.max(minWidth, startWidth + delta);
        setWidths((prev) => ({ ...prev, [key]: nextWidth }));
      };
      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [computedWidths]
  );

  const contextValue = useMemo(
    () => ({ widths: computedWidths, columnsByKey, expandKey }),
    [computedWidths, columnsByKey, expandKey]
  );

  return (
    <ResponsiveTableContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn('bg-white shadow overflow-hidden rounded-lg', containerClassName)}>
        <Table className={cn('sm:min-w-[760px] table-fixed w-full', tableClassName)}>
          <TableHeader>
            <TableRow className={cn('bg-gray-50 border-b border-gray-200', headerRowClassName)}>
              {columns.map((column) => {
                const width = computedWidths[column.key] ?? column.width;
                const isExpand = column.key === expandKey;
                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      'px-3 py-2 relative sm:text-xs font-medium text-gray-500 uppercase tracking-wider',
                      getAlignClass(column.align),
                      column.keepRight ? 'text-right' : null,
                      column.headerClassName
                    )}
                    style={{
                      minWidth: column.minWidth,
                      width: width ? `${width}px` : isExpand ? '100%' : undefined
                    }}
                  >
                    {column.onSort ? (
                      <button
                        onClick={column.onSort}
                        className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
                      >
                        {column.label}
                        {column.sortDirection && (
                          <span>{column.sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                    {column.resizable && (
                      <div
                        onMouseDown={(event) => startResize(event, column)}
                        className="absolute top-0 right-0 h-full w-2 cursor-col-resize"
                      >
                        <div className="absolute right-0 top-1/2 h-4 w-px -translate-y-1/2 bg-gray-200" />
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </div>
    </ResponsiveTableContext.Provider>
  );
};

type ResponsiveTableCellProps = React.ComponentProps<typeof TableCell> & {
  columnKey?: string;
};

export const ResponsiveTableCell = ({ columnKey, style, className, ...props }: ResponsiveTableCellProps) => {
  const { widths, columnsByKey, expandKey } = useResponsiveTable();
  const column = columnKey ? columnsByKey[columnKey] : undefined;
  const width = columnKey ? widths[columnKey] : undefined;
  const isExpand = columnKey ? columnKey === expandKey : false;
  return (
    <TableCell
      {...props}
      className={cn(className, column?.keepRight ? 'text-right' : null)}
      style={{
        ...(style || {}),
        minWidth: (column?.shrinkMinWidth ?? column?.minWidth) ?? style?.minWidth,
        width: width ? `${width}px` : isExpand ? '100%' : style?.width
      }}
    />
  );
};