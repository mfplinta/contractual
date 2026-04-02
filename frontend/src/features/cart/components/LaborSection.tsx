import { useState } from "react";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NumberInput } from "@/components/ui/NumberInput";
import { clamp } from "@/lib/utils";
import { ResponsiveTable, ResponsiveTableColumn, ResponsiveTableCell } from "@/components/shared/ResponsiveTable";
import { TableRow } from "@/components/ui/table";
import type { JobLaborRead, PatchedJobLabor } from "@/services/generatedApi";

const LABOR_COLUMNS: ResponsiveTableColumn[] = [
  { key: "description", label: "Description", expand: true, minWidth: "120px" },
  { key: "time", label: "Time", minWidth: "140px", align: "right" },
  { key: "value", label: "Value", minWidth: "110px", align: "right" },
  { key: "actions", label: "", keepRight: true, width: 90, align: "right" },
];

const LABOR_COLUMNS_READONLY: ResponsiveTableColumn[] = LABOR_COLUMNS.filter(
  (c) => c.key !== "actions",
);

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
  const [addingNew, setAddingNew] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newHours, setNewHours] = useState(0);
  const [newMinutes, setNewMinutes] = useState(0);
  const [newValue, setNewValue] = useState(0);

  if (!expanded) return null;

  const columns = canEdit ? LABOR_COLUMNS : LABOR_COLUMNS_READONLY;

  const startAdd = () => {
    setAddingNew(true);
    setNewDescription("");
    setNewHours(0);
    setNewMinutes(0);
    setNewValue(0);
  };

  const cancelAdd = () => {
    setAddingNew(false);
    setNewDescription("");
    setNewHours(0);
    setNewMinutes(0);
    setNewValue(0);
  };

  const saveAdd = async () => {
    const totalHrs = parseFloat((newHours + newMinutes / 60).toFixed(2));
    await onAdd(groupId, { description: newDescription, time: totalHrs, cost: newValue });
    cancelAdd();
  };

  return (
    <div className="mt-1">
      <ResponsiveTable
        columns={columns}
        containerClassName="shadow-none border border-gray-200 rounded-lg"
        headerRowClassName="bg-gray-50"
      >
        {/* New item row */}
        {addingNew && (
          <TableRow className="bg-[var(--accent-50)]">
            <ResponsiveTableCell columnKey="description" className="px-3 py-2">
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
            </ResponsiveTableCell>
            <ResponsiveTableCell columnKey="time" className="px-3 py-2">
              <div className="flex items-center gap-1 justify-end">
                <NumberInput
                  className="w-14 rounded border-gray-300 text-xs text-right h-7"
                  value={newHours}
                  onValueChange={(v) => setNewHours(v ?? 0)}
                  min={0}
                  step={1}
                />
                <span className="text-xs text-gray-400">h</span>
                <NumberInput
                  className="w-14 rounded border-gray-300 text-xs text-right h-7"
                  value={newMinutes}
                  onValueChange={(v) => setNewMinutes(v ?? 0)}
                  min={0}
                  max={59}
                  step={1}
                />
                <span className="text-xs text-gray-400">m</span>
              </div>
            </ResponsiveTableCell>
            <ResponsiveTableCell columnKey="value" className="px-3 py-2">
              <NumberInput
                className="w-full rounded border-gray-300 text-xs text-right h-7"
                value={newValue}
                onValueChange={(v) => setNewValue(v ?? 0)}
                formatOnBlur={(v) => v.toFixed(2)}
                step={0.01}
                min={0}
                leadingLabel="$"
                leadingLabelClassName="left-1"
                leadingLabelPaddingClassName="pl-4"
              />
            </ResponsiveTableCell>
            <ResponsiveTableCell columnKey="actions" className="px-3 py-2">
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={saveAdd} aria-label="Save">
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelAdd} aria-label="Cancel">
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </ResponsiveTableCell>
          </TableRow>
        )}

        {/* Existing items */}
        {laborItems.map((item) => (
          <LaborRow
            key={item.id}
            item={item}
            groupId={groupId}
            canEdit={canEdit}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}

        {/* Empty state */}
        {laborItems.length === 0 && !addingNew && (
          <TableRow>
            <ResponsiveTableCell
              className="px-4 py-6 text-center text-sm text-gray-400"
              colSpan={columns.length}
            >
              No labor items. {canEdit && "Click + to add one."}
            </ResponsiveTableCell>
          </TableRow>
        )}
      </ResponsiveTable>

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

const LaborRow = ({
  item,
  groupId,
  canEdit,
  onUpdate,
  onDelete,
}: {
  item: JobLaborRead;
  groupId: number;
  canEdit: boolean;
  onUpdate: (groupId: number, laborId: number, updates: PatchedJobLabor) => void;
  onDelete: (groupId: number, laborId: number) => void;
}) => {
  const totalHours = item.time || 0;
  const wholeHours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - wholeHours) * 60);

  const handleHoursChange = (newHours: number | null) => {
    if (newHours === null) return;
    const h = clamp(newHours, 0);
    const newTotal = h + minutes / 60;
    onUpdate(groupId, item.id, { time: parseFloat(newTotal.toFixed(2)) });
  };

  const handleMinutesChange = (newMinutes: number | null) => {
    if (newMinutes === null) return;
    const m = clamp(Math.round(newMinutes), 0, 59);
    const newTotal = wholeHours + m / 60;
    onUpdate(groupId, item.id, { time: parseFloat(newTotal.toFixed(2)) });
  };

  return (
    <TableRow className="hover:bg-gray-50">
      <ResponsiveTableCell columnKey="description" className="px-3 py-2">
        {canEdit ? (
          <input
            type="text"
            value={item.description}
            onChange={(e) =>
              onUpdate(groupId, item.id, { description: e.target.value })
            }
            className="w-full text-sm border-0 bg-transparent p-0 focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400"
            placeholder="Labor description..."
          />
        ) : (
          <span className="text-sm text-gray-900">
            {item.description || "—"}
          </span>
        )}
      </ResponsiveTableCell>
      <ResponsiveTableCell columnKey="time" className="px-3 py-2">
        <div className="flex items-center gap-1 justify-end">
          <NumberInput
            className="w-14 rounded border-gray-200 text-xs text-right h-7"
            disabled={!canEdit}
            value={wholeHours}
            onValueChange={handleHoursChange}
            min={0}
            step={1}
          />
          <span className="text-xs text-gray-400">h</span>
          <NumberInput
            className="w-14 rounded border-gray-200 text-xs text-right h-7"
            disabled={!canEdit}
            value={minutes}
            onValueChange={handleMinutesChange}
            min={0}
            max={59}
            step={1}
          />
          <span className="text-xs text-gray-400">m</span>
        </div>
      </ResponsiveTableCell>
      <ResponsiveTableCell columnKey="value" className="px-3 py-2">
        <NumberInput
          className="w-full rounded border-gray-200 text-xs text-right h-7"
          disabled={!canEdit}
          value={item.cost ?? null}
          onValueChange={(v) => {
            if (v !== null) onUpdate(groupId, item.id, { cost: v });
          }}
          formatOnBlur={(v) => v.toFixed(2)}
          step={0.01}
          min={0}
          leadingLabel="$"
          leadingLabelClassName="left-1"
          leadingLabelPaddingClassName="pl-4"
        />
      </ResponsiveTableCell>
      {canEdit && (
        <ResponsiveTableCell columnKey="actions" className="px-3 py-2">
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              tooltip="Delete"
              className="p-1 text-red-400 hover:text-red-600"
              onClick={() => onDelete(groupId, item.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </ResponsiveTableCell>
      )}
    </TableRow>
  );
};
