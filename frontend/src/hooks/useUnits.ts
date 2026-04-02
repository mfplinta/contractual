import { useCallback } from "react";
import type { Unit, UnitRead } from "@/services/generatedApi";
import {
  useUnitsListQuery,
  useUnitsCreateMutation,
} from "@/services/api";

export const useUnits = () => {
  const { data: units = [] } = useUnitsListQuery();

  const [addUnitMutation] = useUnitsCreateMutation();

  const addUnit = useCallback(
    async (data: Unit) => {
      const existing = units.find(
        (u: UnitRead) => u.name.toLowerCase() === data.name.toLowerCase(),
      );
      if (existing) return existing;
      return await addUnitMutation({ unit: data }).unwrap();
    },
    [addUnitMutation, units],
  );

  return { units, addUnit };
};
