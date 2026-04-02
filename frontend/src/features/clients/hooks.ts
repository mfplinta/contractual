import { useCallback } from "react";
import type { Client, PatchedClient } from "@/services/generatedApi";
import {
  useClientsListQuery,
  useClientsCreateMutation,
  useClientsPartialUpdateMutation,
  useClientsDestroyMutation,
} from "@/services/api";
import { useAppToast } from "@/hooks/useAppToast";

export const useClients = () => {
  const { data: clients = [] } = useClientsListQuery();
    const { showToast } = useAppToast();

  const [addClientMutation] = useClientsCreateMutation();
  const [updateClientMutation] = useClientsPartialUpdateMutation();
  const [deleteClientMutation] = useClientsDestroyMutation();

  const addClient = useCallback(
    async (data: Client) => {
      return await addClientMutation({ client: data })
        .unwrap()
        .catch(() => undefined);
    },
    [addClientMutation],
  );

  const updateClient = useCallback(
    async (id: number, data: PatchedClient) => {
      return await updateClientMutation({ id, patchedClient: data })
        .unwrap();
    },
    [updateClientMutation],
  );

  const deleteClient = useCallback(
    (id: number) => {
      deleteClientMutation({ id })
        .unwrap()
        .catch((error: any) => {
          if (error?.status === 409) {
            showToast(
              "warning",
              "Cannot Delete Client",
              "This client is currently associated with one or more jobs and cannot be deleted.",
            );
          }
        });
    },
    [deleteClientMutation, showToast],
  );

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
  };
};
