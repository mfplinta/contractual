import { useCallback } from "react";
import type { Store } from "@/services/generatedApi";
import {
  useStoresListQuery,
  useStoresCreateMutation,
} from "@/services/api";

export const useStores = () => {
  const { data: stores = [] } = useStoresListQuery();

  const [addStoreMutation] = useStoresCreateMutation();

  const addStore = useCallback(
    async (data: Store) => {
      return addStoreMutation({ store: data }).unwrap();
    },
    [addStoreMutation],
  );

  return { stores, addStore };
};
