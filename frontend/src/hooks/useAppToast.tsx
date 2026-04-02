import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type ToastType = "info" | "warning" | "error";

type AppToastContextValue = {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
};

const AppToastContext = createContext<AppToastContextValue | null>(null);

export const AppToastProvider = ({ children }: { children: ReactNode }) => {
  const showToast = useCallback(
    (type: ToastType, title: string, message: string, duration = 5000) => {
      const description = <span className="whitespace-pre-line">{message}</span>;
      toast[type](title, {
        description,
        duration,
        closeButton: true,
      });
    },
    [],
  );

  const value = useMemo<AppToastContextValue>(
    () => ({ showToast }),
    [showToast],
  );

  return (
    <AppToastContext.Provider value={value}>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        expand
        visibleToasts={5}
      />
    </AppToastContext.Provider>
  );
};

export const useAppToast = () => {
  const context = useContext(AppToastContext);
  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }
  return context;
};