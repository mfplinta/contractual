import { useMemo, useRef, useState } from "react";
import { Plus, Check, X, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NumberInput } from "@/components/ui/NumberInput";
import { clamp } from "@/lib/utils";
import { TableRow, TableCell } from "@/components/ui/table";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import type { JobLaborRead, PatchedJobLabor } from "@/services/generatedApi";

function formatTime(totalHours: number) {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  return `${h}h ${m}m`;
}

export const LaborSection = ({
  groupId,
  laborItems,
  canEdit,
  expanded,
  onAdd,
  onUpdate,
  onDelete,
}: {
  groupId: number;
  laborItems: JobLaborRead[];
  canEdit: boolean;
  expanded: boolean;
  onAdd: (groupId: number, item: { description: string; time: number; cost: number }) => void;
  onUpdate: (groupId: number, laborId: number, updates: PatchedJobLabor) => void;
  onDelete: (groupId: number, laborId: number) => void;
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ description: string; hours: number; minutes: number; cost: number }>({
    description: "", hours: 0, minutes: 0, cost: 0,
  });
  const editValuesRef = useRef(editValues);
  editValuesRef.current = editValues;
  const [addingNew, setAddingNew] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newHours, setNewHours] = useState(0);
  const [newMinutes, setNewMinutes] = useState(0);
  const [newValue, setNewValue] = useState(0);

  const startEdit = (item: JobLaborRead) => {
    const totalHours = item.time || 0;
    setEditingId(item.id);
    setEditValues({
      description: item.description,
      hours: Math.floor(totalHours),
      minutes: Math.round((totalHours - Math.floor(totalHours)) * 60),
      cost: item.cost ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const vals = editValuesRef.current;
    const totalHrs = parseFloat((vals.hours + vals.minutes / 60).toFixed(2));
    onUpdate(groupId, editingId, {
      description: vals.description,
      time: totalHrs,
      cost: vals.cost,
    });
    setEditingId(null);
  };

  const startAdd = () => {
    setAddingNew(true);
    setNewDescription("");
    setNewHours(0);
    setNewMinutes(0);
    setNewValue(0);
  };

  const cancelAdd = () => {
    setAddingNew(false);
  };

  const saveAdd = async () => {
    const totalHrs = parseFloat((newHours + newMinutes / 60).toFixed(2));
    await onAdd(groupId, { description: newDescription, time: totalHrs, cost: newValue });
    cancelAdd();
  };

  const columns: ColumnDef<JobLaborRead>[] = useMemo(() => {
    const cols: ColumnDef<JobLaborRead>[] = [
      {
        accessorKey: "description",
        header: () => "Description",
        cell: ({ row }) => {
          const item = row.original;
          if (editingId === item.id) {
            return (
              <input
                type="text"
                autoFocus
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
                placeholder="Labor description..."
                value={editValuesRef.current.description}
                onChange={(e) => setEditValues((prev) => ({ ...prev, description: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
            );
          }
          return (
            <span className="text-sm text-gray-900 truncate block">
              {item.description || "—"}
            </span>
          );
        },
      },
      {
        id: "time",
        accessorFn: (row) => row.time ?? 0,
        header: () => <span className="block text-right">Time</span>,
        size: 120,
        cell: ({ row }) => {
          const item = row.original;
          if (editingId === item.id) {
            return (
              <div className="flex items-center gap-1 justify-end">
                <NumberInput
                  className="w-11 rounded border-gray-300 text-xs text-right min-h-0 h-7 py-1 px-1"
                  value={editValuesRef.current.hours}
                  onValueChange={(v) => setEditValues((prev) => ({ ...prev, hours: v ?? 0 }))}
                  min={0}
                  step={1}
                  leadingLabel="h"
                  leadingLabelClassName="left-1"
                  leadingLabelPaddingClassName="pl-4"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <NumberInput
                  className="w-11 rounded border-gray-300 text-xs text-right min-h-0 h-7 py-1 px-1"
                  value={editValuesRef.current.minutes}
                  onValueChange={(v) => setEditValues((prev) => ({ ...prev, minutes: v ?? 0 }))}
                  min={0}
                  max={59}
                  step={1}
                  leadingLabel="m"
                  leadingLabelClassName="left-1"
                  leadingLabelPaddingClassName="pl-5"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              </div>
            );
          }
          return (
            <span className="text-sm text-gray-900 block text-right">
              {formatTime(item.time || 0)}
            </span>
          );
        },
      },
      {
        id: "cost",
        accessorFn: (row) => row.cost ?? 0,
        header: () => <span className="block text-right">Value</span>,
        minSize: 75,
        cell: ({ row }) => {
          const item = row.original;
          if (editingId === item.id) {
            return (
              <NumberInput
                className="w-full rounded border-gray-300 text-xs text-right min-h-0 h-7 py-1 px-1"
                value={editValuesRef.current.cost}
                onValueChange={(v) => setEditValues((prev) => ({ ...prev, cost: v ?? 0 }))}
                formatOnBlur={(v) => v.toFixed(2)}
                step={0.01}
                min={0}
                leadingLabel="$"
                leadingLabelClassName="left-1"
                leadingLabelPaddingClassName="pl-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
            );
          }
          return (
            <span className="text-sm text-gray-900 block text-right">
              ${(item.cost ?? 0).toFixed(2)}
            </span>
          );
        },
      },
    ];

    if (canEdit) {
      cols.push({
        id: "actions",
        header: () => null,
        size: 80,
        cell: ({ row }) => {
          const item = row.original;
          const isEditing = editingId === item.id;
          return (
            <div className="flex justify-end gap-1">
              {isEditing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={saveEdit} aria-label="Save">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit} aria-label="Cancel">
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" tooltip="Edit" onClick={() => startEdit(item)} aria-label="Edit">
                    <Edit className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button size="sm" variant="ghost" tooltip="Delete" onClick={() => onDelete(groupId, item.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      });
    }

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, editingId, groupId]);

  const addRow = addingNew ? (
    <TableRow className="bg-[var(--accent-50)]">
      <TableCell className="px-2 py-2">
        <input
          type="text"
          autoFocus
          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
          placeholder="Labor description..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveAdd();
            if (e.key === "Escape") cancelAdd();
          }}
        />
      </TableCell>
      <TableCell className="px-2 py-2">
        <div className="flex items-center gap-1 justify-end">
          <NumberInput
            className="w-12 rounded border-gray-300 text-xs text-right min-h-0 h-7 py-1 px-1"
            value={newHours}
            onValueChange={(v) => setNewHours(v ?? 0)}
            min={0}
            step={1}
            leadingLabel="h"
            leadingLabelClassName="left-1"
            leadingLabelPaddingClassName="pl-4"
          />
          <NumberInput
            className="w-12 rounded border-gray-300 text-xs text-right min-h-0 h-7 py-1 px-1"
            value={newMinutes}
            onValueChange={(v) => setNewMinutes(v ?? 0)}
            min={0}
            max={59}
            step={1}
            leadingLabel="m"
            leadingLabelClassName="left-1"
            leadingLabelPaddingClassName="pl-5"
          />
        </div>
      </TableCell>
      <TableCell className="px-2 py-2">
        <NumberInput
          className="w-full rounded border-gray-300 text-xs text-right min-h-0 h-7 py-1 px-1"
          value={newValue}
          onValueChange={(v) => setNewValue(v ?? 0)}
          formatOnBlur={(v) => v.toFixed(2)}
          step={0.01}
          min={0}
          leadingLabel="$"
          leadingLabelClassName="left-1"
          leadingLabelPaddingClassName="pl-4"
        />
      </TableCell>
      <TableCell className="px-2 py-2">
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={saveAdd} aria-label="Save">
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelAdd} aria-label="Cancel">
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ) : null;

  if (!expanded) return null;

  return (
    <div className="mt-1">
      <DataTable
        columns={columns}
        data={laborItems}
        containerClassName="shadow-none border border-gray-200"
        tableClassName="table-auto"
        topRows={addRow}
        noResultsMessage={`No labor items.${canEdit ? ' Click + to add one.' : ''}`}
      />

      {/* Add button */}
      {canEdit && !addingNew && (
        <div className="mt-1.5 flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={startAdd}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Labor
          </Button>
        </div>
      )}
    </div>
  );
};
