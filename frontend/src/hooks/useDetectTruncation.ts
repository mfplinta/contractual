import { useRef, useEffect, useState } from "react";

export const useDetectTruncation = <T extends HTMLElement = HTMLElement>() => {
  const [isTruncated, setIsTruncated] = useState(false);
  const elementRef = useRef<T | null>(null);

  const checkTruncation = () => {
    const el = elementRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
    }
  };

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    checkTruncation();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref: elementRef, isTruncated };
};

export default useDetectTruncation;