import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Plus, Check, X, Edit, Trash2, ArrowUpDown } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { TableRow, TableCell } from "@/components/ui/table";
import { CenteredSpinner } from "@/components/shared/Spinner";
import {
  useStoresListQuery,
  useStoresCreateMutation,
  useStoresUpdateMutation,
  useStoresDestroyMutation,
  useUnitsListQuery,
  useUnitsCreateMutation,
  useUnitsUpdateMutation,
  useUnitsDestroyMutation,
  useTagsListQuery,
  useTagsCreateMutation,
  useTagsUpdateMutation,
  useTagsDestroyMutation,
} from "@/services/api";
import { Helmet } from "react-helmet";

// -- Configuration types ----------------------------------------------------

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "url";
  placeholder?: string;
}

type ItemKind = "stores" | "units" | "tags";

interface ItemConfig {
  kind: ItemKind;
  title: string;
  fields: FieldConfig[];
  getId: (item: Record<string, unknown>) => string;
}

const CONFIGS: Record<ItemKind, ItemConfig> = {
  stores: {
    kind: "stores",
    title: "Stores",
    fields: [
      { key: "name", label: "Name", placeholder: "Store name" },
      {
        key: "storeUrl",
        label: "URL",
        type: "url",
        placeholder: "https://...",
      },
    ],
    getId: (item) => String(item.id),
  },
  units: {
    kind: "units",
    title: "Units",
    fields: [
      { key: "name", label: "Name", placeholder: "Unit name" },
      {
        key: "shorthand",
        label: "Shorthand",
        placeholder: "Optional export shorthand",
      },
    ],
    getId: (item) => String(item.id),
  },
  tags: {
    kind: "tags",
    title: "Tags",
    fields: [{ key: "name", label: "Name", placeholder: "Tag name" }],
    getId: (item) => String(item.id),
  },
};

const MISC_INFO: Record<ItemKind, string> = {
  stores:
    "If URL is set, %s will be replaced by the item's SKU in the store URL.",
  units: "",
  tags: "",
};

// -- Hooks wrapper ----------------------------------------------------------

function useItemCrud(kind: ItemKind) {
  const storesQuery = useStoresListQuery(undefined, {
    skip: kind !== "stores",
  });
  const unitsQuery = useUnitsListQuery(undefined, { skip: kind !== "units" });
  const tagsQuery = useTagsListQuery(undefined, { skip: kind !== "tags" });

  const [addStore] = useStoresCreateMutation();
  const [updateStore] = useStoresUpdateMutation();
  const [deleteStore] = useStoresDestroyMutation();

  const [addUnit] = useUnitsCreateMutation();
  const [updateUnit] = useUnitsUpdateMutation();
  const [deleteUnit] = useUnitsDestroyMutation();

  const [addTag] = useTagsCreateMutation();
  const [updateTag] = useTagsUpdateMutation();
  const [deleteTag] = useTagsDestroyMutation();

  const config = CONFIGS[kind];

  const rawItems: Record<string, unknown>[] = (() => {
    if (kind === "stores")
      return (storesQuery.data ?? []) as unknown as Record<string, unknown>[];
    if (kind === "units")
      return (unitsQuery.data ?? []) as unknown as Record<string, unknown>[];
    return (tagsQuery.data ?? []) as unknown as Record<string, unknown>[];
  })();

  const isLoading =
    kind === "stores"
      ? storesQuery.isLoading
      : kind === "units"
        ? unitsQuery.isLoading
        : tagsQuery.isLoading;

  const addItem = async (values: Record<string, string>) => {
    if (kind === "stores") {
      await addStore({
        store: { name: values.name, storeUrl: values.storeUrl || "" },
      } as any).unwrap();
    } else if (kind === "units") {
      await addUnit({
        unit: {
          name: values.name,
          shorthand: values.shorthand || null,
        },
      } as any).unwrap();
    } else {
      await addTag({ tag: { name: values.name } } as any).unwrap();
    }
  };

  const updateItem = async (id: string, values: Record<string, string>) => {
    if (kind === "stores") {
      await updateStore({
        id,
        store: { name: values.name, storeUrl: values.storeUrl || "" },
      } as any).unwrap();
    } else if (kind === "units") {
      await updateUnit({
        id,
        unit: {
          name: values.name,
          shorthand: values.shorthand || null,
        },
      } as any).unwrap();
    } else {
      await updateTag({ id, tag: { name: values.name } } as any).unwrap();
    }
  };

  const deleteItem = async (id: string) => {
    if (kind === "stores") {
      await deleteStore({ id } as any).unwrap();
    } else if (kind === "units") {
      await deleteUnit({ id } as any).unwrap();
    } else {
      await deleteTag({ id } as any).unwrap();
    }
  };

  return {
    items: rawItems,
    isLoading,
    config,
    addItem,
    updateItem,
    deleteItem,
  };
}

// -- Component --------------------------------------------------------------

export const EditItemPage = () => {
  const navigate = useNavigate();
  const { kind: kindParam } = useParams<{ kind: ItemKind }>();
  const kind: ItemKind =
    kindParam && kindParam in CONFIGS ? (kindParam as ItemKind) : "stores";
  const { items, isLoading, config, addItem, updateItem, deleteItem } =
    useItemCrud(kind);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  // Reset state when kind changes
  useEffect(() => {
    setEditingId(null);
    setAddingNew(false);
    setNewValues({});
    setEditValues({});
  }, [kind]);

  const tableColumns: ColumnDef<Record<string, unknown>>[] = useMemo(
    () => [
      ...config.fields.map((field) => ({
        accessorKey: field.key,
        header: ({ column }: any) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-left hover:text-gray-700 flex items-center gap-1 w-full uppercase text-[12px]"
          >
            {field.label}
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }: any) => {
          const item = row.original;
          const id = config.getId(item);
          const isEditing = editingId === id;
          if (isEditing) {
            return (
              <input
                type={field.type || "text"}
                autoFocus={config.fields.indexOf(field) === 0}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
                value={editValues[field.key] ?? ""}
                onChange={(e) =>
                  setEditValues((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
              />
            );
          }
          return (
            <span className="text-sm text-gray-900 truncate block">
              {String(item[field.key] ?? "")}
            </span>
          );
        },
      })),
      {
        id: "actions",
        header: () => null,
        size: 100,
        cell: ({ row }: any) => {
          const item = row.original;
          const id = config.getId(item);
          const isEditing = editingId === id;
          return (
            <div className="flex justify-end gap-1">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={saveEdit}
                    aria-label="Save"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    tooltip="Edit"
                    onClick={() => startEdit(item)}
                    aria-label="Edit"
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    tooltip="Delete"
                    onClick={() => handleDelete(id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [config, editingId, editValues],
  );

  const startEdit = (item: Record<string, unknown>) => {
    const id = config.getId(item);
    setEditingId(id);
    const values: Record<string, string> = {};
    for (const field of config.fields) {
      values[field.key] = String(item[field.key] ?? "");
    }
    setEditValues(values);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateItem(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    } catch {
      // Error handled by RTK Query
    }
  };

  const startAdd = () => {
    setAddingNew(true);
    const values: Record<string, string> = {};
    for (const field of config.fields) {
      values[field.key] = "";
    }
    setNewValues(values);
  };

  const cancelAdd = () => {
    setAddingNew(false);
    setNewValues({});
  };

  const saveAdd = async () => {
    const hasValue = config.fields.some((f) => newValues[f.key]?.trim());
    if (!hasValue) return;
    try {
      await addItem(newValues);
      setAddingNew(false);
      setNewValues({});
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${config.title.replace(/s$/, "").toLowerCase()}? This action cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      await deleteItem(id);
    } catch {
      // Error handled by RTK Query
    }
  };

  const addRow = addingNew ? (
    <TableRow className="bg-[var(--accent-50)]">
      {config.fields.map((field) => (
        <TableCell key={field.key} className="px-4 py-2">
          <input
            type={field.type || "text"}
            autoFocus={config.fields.indexOf(field) === 0}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
            placeholder={field.placeholder}
            value={newValues[field.key] ?? ""}
            onChange={(e) =>
              setNewValues((prev) => ({
                ...prev,
                [field.key]: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") saveAdd();
              if (e.key === "Escape") cancelAdd();
            }}
          />
        </TableCell>
      ))}
      <TableCell className="px-4 py-2">
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={saveAdd}
            aria-label="Save"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelAdd}
            aria-label="Cancel"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ) : null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Helmet>
        <title>Manage {kind} | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12 mb-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage {config.title}
          </h1>
        </div>
        <Button type="button" size="sm" onClick={startAdd} disabled={addingNew}>
          <Plus className="h-4 w-4 mr-1" /> Add {config.title.replace(/s$/, "")}
        </Button>
      </div>

      {MISC_INFO[kind] && (
        <section className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mt-1 text-sm text-gray-600">{MISC_INFO[kind]}</p>
        </section>
      )}

      {isLoading ? (
        <CenteredSpinner className="h-64" />
      ) : (
        <DataTable
          columns={tableColumns}
          data={items}
          topRows={addRow}
          noResultsMessage={`No ${config.title.toLowerCase()} found. Click "Add" to create one.`}
        />
      )}
    </div>
  );
};
