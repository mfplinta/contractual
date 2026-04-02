import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobileWidth() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const update = () => {
      const touch = typeof window !== "undefined" && (
        "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0
      );
      setIsTouch(touch);
    };
    update();
    const onPointerDown = () => update();
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return !!isTouch;
}

export const useIsMobile = useIsMobileWidth;
