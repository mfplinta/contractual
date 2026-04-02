import { useCallback } from "react";
import type { Settings } from "@/services/generatedApi";
import {
  useSettingsRetrieveQuery,
  useSettingsUpdateMutation,
} from "@/services/api";

export const useSettings = () => {
  const { data: settings, isLoading: isSettingsLoading } =
    useSettingsRetrieveQuery();

  const [updateSettingsMutation] = useSettingsUpdateMutation();

  const updateSettings = useCallback(
    (newSettings: Settings) => {
      updateSettingsMutation({ settings: newSettings })
        .unwrap()
        .catch(() => undefined);
    },
    [updateSettingsMutation],
  );

  return {
    settings,
    isSettingsLoaded: !isSettingsLoading,
    updateSettings,
  };
};
