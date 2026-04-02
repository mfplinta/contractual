import { RefObject, useEffect, useRef } from "react";

export const useNonPassiveWheelListener = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  onWheel: (event: WheelEvent) => void,
  enabled = true,
) => {
  const handlerRef = useRef(onWheel);

  useEffect(() => {
    handlerRef.current = onWheel;
  }, [onWheel]);

  useEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      handlerRef.current(event);
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [enabled, ref]);
};

export default useNonPassiveWheelListener;
