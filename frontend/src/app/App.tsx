import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { DndProvider } from "react-dnd";
import {
  MultiBackend,
  TouchTransition,
  MouseTransition,
} from "react-dnd-multi-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { Layout } from "@/components/layout/Layout";
import { MaterialsPage } from "@/features/materials/pages/MaterialsPage";
import { CartPage } from "@/features/cart/pages/CartPage";
import { SavedJobsPage } from "@/features/jobs/pages/SavedJobsPage";
import { ClientsPage } from "../features/clients/pages/ClientsPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { AddMaterialPage } from "../features/materials/pages/AddMaterialPage";
import { AddClientPage } from "../features/clients/pages/AddClientPage";
import { EditItemPage } from "../features/settings/pages/EditItemPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ChangePasswordPage } from "../features/auth/pages/ChangePasswordPage";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import { AppToastProvider } from "@/hooks/useAppToast";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <MaterialsPage /> },
          { path: "cart", element: <CartPage /> },
          { path: "lists", element: <SavedJobsPage /> },
          { path: "clients", element: <ClientsPage /> },
          { path: "clients/new", element: <AddClientPage /> },
          { path: "clients/:id/edit", element: <AddClientPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "settings/manage/:kind", element: <EditItemPage /> },
          { path: "materials/new", element: <AddMaterialPage /> },
          { path: "materials/:id/edit", element: <AddMaterialPage /> },
          { path: "change-password", element: <ChangePasswordPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

function App() {
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0);

  useEffect(() => {
    if (!isTouchDevice) return;
    const options = { capture: true } as const;
    const handleContextMenu = (event: MouseEvent) => {
      const sourceCapabilities = (
        event as MouseEvent & {
          sourceCapabilities?: { firesTouchEvents?: boolean };
        }
      ).sourceCapabilities;
      if (sourceCapabilities?.firesTouchEvents) {
        event.preventDefault();
      }
    };
    document.addEventListener("contextmenu", handleContextMenu, options);
    return () =>
      document.removeEventListener("contextmenu", handleContextMenu, options);
  }, [isTouchDevice]);

  return (
    <AppToastProvider>
      <DndProvider
        backend={MultiBackend}
        options={{
          backends: [
            {
              id: 'html5',
              backend: HTML5Backend,
              transition: MouseTransition,
            },
            {
              id: 'touch',
              backend: TouchBackend,
              transition: TouchTransition,
              options: {
                enableMouseEvents: true,
                delayTouchStart: 450,
                touchSlop: 8,
                ignoreContextMenu: true,
              },
            },
          ],
        }}
      >
        <RouterProvider router={router} />
      </DndProvider>
    </AppToastProvider>
  );
}

export default App;
