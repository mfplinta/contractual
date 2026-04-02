
import {
  Trash2,
  RotateCcw,
  GripVertical,
  CircleOff,
  CircleCheckBig,
} from "lucide-react";
import { MaterialImageCarousel } from "../../materials/components/MaterialImageCarousel";
import { NumberInput, parseExpression } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { useDrag, useDrop } from "react-dnd";
import type { JobMaterialRead, MaterialImageRead } from "@/services/generatedApi";
import { GroupSplitDivider } from "./CartGroups"
import { useRef } from "react";

export const CART_ITEM_DND_TYPE = "CART_ITEM";

export interface CartItemDragObject {
  itemId: number;
  sourceGroupId: number;
  sourceIndex: number;
}

export const DropIndicator = ({ visible }: { visible: boolean }) =>
  visible ? (
    <div className="h-0.5 bg-[var(--accent-500)] rounded-full mx-2 my-0" />
  ) : null;

export const CartItemRow = ({
  item,
  idx,
  groupId,
  images,
  lineSubtotal,
  lineTotal,
  canEditCart,
  showIndicatorBefore,
  onSplit,
  onRevertPrice,
  onDelete,
  onUnitPriceChange,
  onQuantityChange,
  onTaxChange,
  onTotalChange,
  onToggleIgnored,
  onOpenDetails,
}: {
  item: JobMaterialRead;
  idx: number;
  groupId: number;
  images: MaterialImageRead[];
  lineSubtotal: number;
  lineTotal: number;
  canEditCart: boolean;
  showIndicatorBefore: boolean;
  onSplit?: () => void;
  onRevertPrice: () => void;
  onDelete: () => void;
  onUnitPriceChange: (v: number | null) => void;
  onQuantityChange: (v: number | null) => void;
  onTaxChange: (v: number | null) => void;
  onTotalChange: (v: number | null) => void;
  onToggleIgnored: () => void;
  onOpenDetails: () => void;
}) => {
  const ref = useRef<HTMLLIElement>(null);

  const parseQuantityExpression = parseExpression;

  const formatQuantity = (value: number) => {
    const rounded = Number(value.toFixed(4));
    return `${rounded}`;
  };

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: CART_ITEM_DND_TYPE,
      item: {
        itemId: item.id!,
        sourceGroupId: groupId,
        sourceIndex: idx,
      } satisfies CartItemDragObject,
      canDrag: canEditCart,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [item.id, groupId, idx, canEditCart],
  );

  const [, drop] = useDrop(
    () => ({
      accept: CART_ITEM_DND_TYPE,
      hover: (dragItem: CartItemDragObject, monitor) => {
        if (!ref.current || !monitor.isOver({ shallow: true })) return;
        const hoverRect = ref.current.getBoundingClientRect();
        const clientY = monitor.getClientOffset()?.y ?? 0;
        const hoverMiddleY = hoverRect.top + hoverRect.height / 2;
        const insertIndex = clientY < hoverMiddleY ? idx : idx + 1;
        if (
          dragItem.sourceGroupId === groupId &&
          (insertIndex === dragItem.sourceIndex ||
            insertIndex === dragItem.sourceIndex + 1)
        )
          return;
        ref.current.dispatchEvent(
          new CustomEvent("cart-item-hover", {
            bubbles: true,
            detail: { groupId, index: insertIndex },
          }),
        );
      },
      drop: (dragItem: CartItemDragObject, monitor) => {
        if (monitor.didDrop()) return;
        const hoverRect = ref.current?.getBoundingClientRect();
        if (!hoverRect) return;
        const clientY = monitor.getClientOffset()?.y ?? 0;
        const hoverMiddleY = hoverRect.top + hoverRect.height / 2;
        const insertIndex = clientY < hoverMiddleY ? idx : idx + 1;
        ref.current?.dispatchEvent(
          new CustomEvent("cart-item-drop", {
            bubbles: true,
            detail: { dragItem, groupId, index: insertIndex },
          }),
        );
      },
    }),
    [idx, groupId],
  );

  preview(drop(ref));

  return (
    <li
      ref={ref}
      className={`relative transition-opacity ${isDragging ? "opacity-30" : ""}`}
    >
      <DropIndicator visible={showIndicatorBefore} />
      {onSplit && (
        <GroupSplitDivider onSplit={onSplit} disabled={!canEditCart} />
      )}
      <div className="px-2.5 py-2 sm:px-3 sm:py-2.5 flex gap-1">
        {canEditCart && (
          <div
            ref={drag as unknown as React.Ref<HTMLDivElement>}
            className="flex items-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 -ml-1 pr-1 self-start mt-1"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-1.5">
            <div
              role="button"
              tabIndex={0}
              onClick={onOpenDetails}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenDetails();
                }
              }}
              className="flex items-start gap-3 min-w-0 flex-1 text-left rounded-sm cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-400)]"
              aria-label={`Open details for ${item.description || "material item"}`}
            >
              <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 flex-none mt-0.5">
                <MaterialImageCarousel
                  images={images}
                  alt={item.description || "Material Item"}
                  className="h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  showDotsOnHover={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 leading-tight">
                  {item.description}
                </h3>
                <p
                  className={`text-xs mt-0.5 ${
                    item.wasPriceEdited ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {item.unit}
                  {item.priceInfo?.store?.name
                    ? ` • ${item.priceInfo.store.name}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-none">
              {item.wasPriceEdited && (
                <Button
                  variant="ghost"
                  tooltip="Revert price"
                  onClick={onRevertPrice}
                  disabled={!canEditCart}
                  className={`min-h-9 min-w-9 p-2 text-gray-400 ${
                    !canEditCart
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:text-gray-600"
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                tooltip={item.ignored ? "Include" : "Exclude"}
                onClick={onToggleIgnored}
                disabled={!canEditCart}
                className={`min-h-9 min-w-9 p-2 ${
                  item.ignored
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-gray-400 hover:text-gray-600"
                } ${
                  !canEditCart ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {item.ignored ? <CircleOff className="h-4 w-4" /> : <CircleCheckBig className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                tooltip="Delete"
                onClick={onDelete}
                disabled={!canEditCart}
                className={`text-red-400 min-h-9 min-w-9 p-2 ${
                  !canEditCart
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:text-red-600"
                }`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-1.5">
            <NumberInput
              className="block w-full rounded border-gray-200 text-xs sm:text-sm text-right min-h-0 h-7 py-1"
              disabled={!canEditCart}
              value={item.quantity ?? null}
              onValueChange={onQuantityChange}
              parseOnBlur={parseQuantityExpression}
              formatOnBlur={formatQuantity}
              min={0.01}
              step={1}
              leadingLabel="Qty"
              leadingLabelClassName="left-1"
              leadingLabelPaddingClassName="pl-7 sm:pl-8"
            />
            <NumberInput
              className="block w-full rounded border-gray-200 text-xs sm:text-sm text-right min-h-0 h-7 py-1"
              disabled={!canEditCart || item.ignored}
              value={!item.ignored ? item.unitPrice : 0}
              onValueChange={onUnitPriceChange}
              formatOnBlur={(v) => v.toFixed(2)}
              step={0.01}
              leadingLabel="Price"
              leadingLabelClassName="left-1"
              leadingLabelPaddingClassName="pl-9 sm:pl-10"
            />
            <NumberInput
              className="block w-full rounded border-gray-200 text-xs sm:text-sm text-right min-h-0 h-7 py-1"
              disabled
              value={!item.ignored ? lineSubtotal : 0}
              onValueChange={() => undefined}
              formatOnBlur={(v) => v.toFixed(2)}
              step={0.01}
              leadingLabel="Subt"
              leadingLabelClassName="left-1"
              leadingLabelPaddingClassName="pl-8 sm:pl-9"
            />
            <NumberInput
              className="block w-full rounded border-gray-200 text-xs sm:text-sm text-right min-h-0 h-7 py-1"
              disabled={!canEditCart || item.ignored}
              value={!item.ignored ? (item.tax ?? null) : 0}
              onValueChange={onTaxChange}
              formatOnBlur={(v) => v.toFixed(2)}
              step={0.01}
              leadingLabel="Tax"
              leadingLabelClassName="left-1"
              leadingLabelPaddingClassName="pl-7 sm:pl-8"
            />
            <NumberInput
              className={`block w-full rounded border-gray-200 text-xs sm:text-sm text-right min-h-0 h-7 py-1 font-medium ${
                item.wasPriceEdited ? "text-green-600" : "text-gray-900"
              }`}
              disabled={!canEditCart || item.ignored}
              value={!item.ignored ? lineTotal : 0}
              onValueChange={onTotalChange}
              formatOnBlur={(v) => v.toFixed(2)}
              step={0.01}
              leadingLabel="Total"
              leadingLabelClassName="left-1"
              leadingLabelPaddingClassName="pl-8 sm:pl-10"
            />
          </div>
        </div>
      </div>
    </li>
  );
};