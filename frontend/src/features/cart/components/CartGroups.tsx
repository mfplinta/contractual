import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CART_ITEM_DND_TYPE, CartItemDragObject } from "./CartItemRow";
import { useDrop } from "react-dnd";

export const GroupNameHeader = ({
  name,
  onRename,
  disabled,
}: {
  name: string | null;
  onRename: (name: string) => void;
  disabled: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = value.trim();
    onRename(trimmed);
  };

  if (editing && !disabled) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(name ?? "");
            setEditing(false);
          }
        }}
        className="text-sm font-semibold bg-transparent border-b border-[var(--accent-400)] focus:outline-none px-0 py-0 w-full max-w-xs text-[var(--accent-700)]"
        placeholder="Group name..."
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {
          setValue(name ?? "");
          setEditing(true);
        }
      }}
      disabled={disabled}
      className={`text-sm font-semibold text-left truncate ${
        name ? "text-[var(--accent-700)]" : "text-gray-400 italic"
      } ${!disabled ? "hover:text-[var(--accent-600)] cursor-pointer" : "cursor-default"}`}
    >
      {name || "Untitled"}
    </button>
  );
};


export const GroupSplitDivider = ({
  onSplit,
  disabled,
}: {
  onSplit: () => void;
  disabled: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  if (disabled) return null;
  return (
    <div
      className="relative h-0 group/divider"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity z-10 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex-1 h-px bg-[var(--accent-300)]" />
        <button
          type="button"
          onClick={onSplit}
          className="mx-2 flex items-center gap-1 text-xs text-[var(--accent-600)] bg-white border border-[var(--accent-300)] rounded-full px-2 py-0.5 hover:bg-[var(--accent-50)] whitespace-nowrap"
        >
          <Plus className="h-3 w-3" />
          New Group
        </button>
        <div className="flex-1 h-px bg-[var(--accent-300)]" />
      </div>
    </div>
  );
};

export const GroupDropZone = ({
  groupId,
  itemCount,
  canDrop: canDropProp,
  onDrop,
  onHover,
  onLeave,
  children,
}: {
  groupId: number;
  itemCount: number;
  canDrop: boolean;
  onDrop: (item: CartItemDragObject, targetIndex: number) => void;
  onHover: (index: number) => void;
  onLeave: () => void;
  children: React.ReactNode;
}) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: CART_ITEM_DND_TYPE,
      canDrop: () => canDropProp,
      hover: (_dragItem: CartItemDragObject, monitor) => {
        if (!monitor.isOver({ shallow: true })) return;
        onHover(itemCount);
      },
      drop: (dragItem: CartItemDragObject, monitor) => {
        if (monitor.didDrop()) return; // handled by a child
        onDrop(dragItem, itemCount);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [groupId, itemCount, canDropProp, onDrop, onHover],
  );


  const prevIsOver = useRef(isOver);
  useEffect(() => {
    if (prevIsOver.current && !isOver) onLeave();
    prevIsOver.current = isOver;
  }, [isOver, onLeave]);

  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleHover = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.groupId === groupId) onHover(detail.index);
    };
    const handleDrop = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.groupId === groupId) onDrop(detail.dragItem, detail.index);
    };
    el.addEventListener("cart-item-hover", handleHover);
    el.addEventListener("cart-item-drop", handleDrop);
    return () => {
      el.removeEventListener("cart-item-hover", handleHover);
      el.removeEventListener("cart-item-drop", handleDrop);
    };
  }, [groupId, onDrop, onHover]);

  return (
    <div
      ref={(node) => {
        dropRef(node);
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={`bg-white shadow rounded-lg border-2 transition-colors ${
        isOver && canDrop
          ? "border-[var(--accent-400)] ring-1 ring-[var(--accent-300)]"
          : "border-gray-200"
      }`}
    >
      {children}
    </div>
  );
};