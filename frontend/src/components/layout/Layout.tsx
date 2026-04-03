import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, List, Users, Settings, Package } from 'lucide-react';
import { useCart } from '@/features/cart/hooks';
import { useSettings } from '@/features/settings/hooks';
import { cn } from '../../lib/utils';
import { useDragLayer, useDrop } from 'react-dnd';
import type { MaterialNestedRead } from '../../services/generatedApi';
import { useIsMobileWidth, useIsTouchDevice } from '../ui/use-mobile';
import { CartPreview } from '../../features/cart/components/CartPreview';
import { useAccentColor } from '../../hooks/useAccentColor';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { FullPageSpinner } from '@/components/shared/Spinner';

export const Layout = () => {
  const {
    currentMaterialItems: currentJob,
    removeFromCart,
    addToCart,
    currentGroups,
    itemCount,
    billTotal,
  } = useCart();
  const { settings, isSettingsLoaded } = useSettings();
  useAccentColor(isSettingsLoaded ? settings!.accentColor : null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDragNearCart, setIsDragNearCart] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [cartNode, setCartNode] = useState<HTMLDivElement | null>(null);
  const cartWrapperRef = useRef<HTMLDivElement | null>(null);
  const lastCartTapRef = useRef(0);
  const isCompactWidth = useIsMobileWidth();
  const isTouchDevice = useIsTouchDevice();
  const isCartPage = location.pathname === '/cart';

  const { isDragging, item, clientOffset } = useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
    item: monitor.getItem() as { material?: MaterialNestedRead; variantId?: number; storeId?: number } | null,
    clientOffset: monitor.getClientOffset()
  }));

  useEffect(() => {
    if (!isDragging || !clientOffset || !cartNode) {
      if (isDragNearCart) setIsDragNearCart(false);
      return;
    }

    const rect = cartNode.getBoundingClientRect();
    const cartCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const dx = clientOffset.x - cartCenter.x;
    const dy = clientOffset.y - cartCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const near = distance < 160;
    if (near !== isDragNearCart) {
      setIsDragNearCart(near);
    }
  }, [clientOffset, isDragging, isDragNearCart]);

  useEffect(() => {
    if (!isTouchDevice || !isCartOpen) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!cartWrapperRef.current) return;
      if (!cartWrapperRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isCartOpen, isTouchDevice]);

  useEffect(() => {
    if (isCartPage && isCartOpen) {
      setIsCartOpen(false);
    }
  }, [isCartPage, isCartOpen]);

  useEffect(() => {
    if (!isTouchDevice || !isDragging) return;
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const preventScroll = (event: TouchEvent) => {
      event.preventDefault();
    };

    document.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      document.removeEventListener('touchmove', preventScroll);
    };
  }, [isDragging, isTouchDevice]);

  const draggedPreviewText = useMemo(() => {
    if (!item?.material) return null;
    const variant = item.variantId
      ? item.material.variants.find(v => v.id === item.variantId)
      : item.material.variants[0];
    if (!variant) return item.material.description;
    if (!variant.name) return item.material.description;
    return `${variant.name} - ${item.material.description}`;
  }, [item]);

  const [{ isOverCart }, dropCart] = useDrop(() => ({
    accept: 'MATERIAL',
    drop: (dragItem: { material: MaterialNestedRead; variantId?: number; storeId?: number }) => {
      if (!dragItem.variantId) return;
      const variant = dragItem.material.variants.find((v) => v.id === dragItem.variantId);
      const fallbackStoreId = variant?.stores?.[0]?.store?.id;
      const resolvedStoreId = dragItem.storeId ?? fallbackStoreId;
      if (!resolvedStoreId) return;
      addToCart({
        variantId: dragItem.variantId,
        groupId: currentGroups[currentGroups.length - 1].id,
        storeId: resolvedStoreId,
        quantity: 1,
      });
      setIsDragNearCart(false);
      setIsCartOpen(true);
    },
    collect: monitor => ({
      isOverCart: monitor.isOver({ shallow: true })
    })
  }), [addToCart, currentGroups]);

  const cartCountLabel = itemCount > 0
    ? isCompactWidth
      ? `${itemCount}`
      : `${itemCount} ($${billTotal.toFixed(2)})`
    : `${itemCount}`;

  const isCartVisible = !isCartPage && (isCartOpen || isDragNearCart || isOverCart);

  if (!isSettingsLoaded) {
    return <FullPageSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                {settings!.companyLogoUrl ? (
                  <img src={settings!.companyLogoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                ) : (
                  <>
                    <Package className="h-8 w-8 text-[var(--accent-600)]" />
                    <span className="ml-2 text-xl font-bold text-gray-900">Contractual</span>
                  </>
                )}
              </Link>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                <Link
                  to="/"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    location.pathname === '/' 
                      ? "border-[var(--accent-500)] text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  Materials
                </Link>
                <Link
                  to="/lists"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    location.pathname === '/lists'
                      ? "border-[var(--accent-500)] text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  Saved Jobs
                </Link>
                <Link
                  to="/clients"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    location.pathname === '/clients'
                      ? "border-[var(--accent-500)] text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  Clients
                </Link>
              </div>
            </div>
            <div className="flex items-stretch space-x-4">
              {isCompactWidth && (
                <div className="flex items-stretch space-x-3">
                  <Link
                    to="/lists"
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      location.pathname === '/lists'
                        ? "border-[var(--accent-500)] text-gray-900"
                        : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-500"
                    )}
                  >
                    <List className="h-6 w-6" />
                  </Link>
                  <Link
                    to="/clients"
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      location.pathname === '/clients'
                        ? "border-[var(--accent-500)] text-gray-900"
                        : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-500"
                    )}
                  >
                    <Users className="h-6 w-6" />
                  </Link>
                </div>
              )}
              <Link 
                to="/settings" 
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  location.pathname === '/settings'
                    ? "border-[var(--accent-500)] text-gray-900"
                    : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-500"
                )}
              >
                <Settings className="h-6 w-6" />
              </Link>

              {/* Cart Dropdown */}
              <div 
                ref={(node) => {
                  if (node && node !== cartNode) {
                    setCartNode(node);
                  }
                  dropCart(node);
                  cartWrapperRef.current = node;
                }}
                className={cn(
                  "relative flex",
                  (isDragNearCart || isOverCart) && "ring-2 ring-[var(--accent-400)] rounded-md"
                )}
                onMouseEnter={() => {
                  if (!isTouchDevice && !isCartPage) {
                    setIsCartOpen(true);
                  }
                }}
                onMouseLeave={() => {
                  if (!isTouchDevice && !isCartPage) {
                    setIsCartOpen(false);
                  }
                }}
              >
                {isTouchDevice ? (
                  <button
                    type="button"
                    onClick={() => {
                      const now = Date.now();
                      if (now - lastCartTapRef.current < 300) {
                        navigate('/cart');
                      }
                      lastCartTapRef.current = now;
                      setIsCartOpen(prev => !prev);
                    }}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      location.pathname === '/cart'
                        ? "border-[var(--accent-500)]"
                        : "border-transparent hover:border-gray-300"
                    )}
                  >
                    <ShoppingCart className={cn(
                      "flex-shrink-0 h-6 w-6",
                      location.pathname === '/cart'
                        ? "text-gray-900"
                        : "text-gray-400 group-hover:text-gray-500"
                    )} />
                    <span className={cn(
                      "ml-2 text-sm font-medium",
                      location.pathname === '/cart'
                        ? "text-gray-900"
                        : "text-gray-700 group-hover:text-gray-800"
                    )}>{cartCountLabel}</span>
                  </button>
                ) : (
                  <Link 
                    to="/cart" 
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                      location.pathname === '/cart'
                        ? "border-[var(--accent-500)]"
                        : "border-transparent hover:border-gray-300"
                    )}
                  >
                    <ShoppingCart className={cn(
                      "flex-shrink-0 h-6 w-6",
                      location.pathname === '/cart'
                        ? "text-gray-900"
                        : "text-gray-400 group-hover:text-gray-500"
                    )} />
                    <span className={cn(
                      "ml-2 text-sm font-medium",
                      location.pathname === '/cart'
                        ? "text-gray-900"
                        : "text-gray-700 group-hover:text-gray-800"
                    )}>{cartCountLabel}</span>
                  </Link>
                )}

                {isCartVisible && (
                  <CartPreview
                    items={currentJob}
                    isDragHover={isDragNearCart || isOverCart}
                    draggedPreviewText={draggedPreviewText}
                    onRemove={removeFromCart}
                    onClose={() => setIsCartOpen(false)}
                  />
                )}
              </div>

              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};