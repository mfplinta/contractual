import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/Button";
import { ComboboxSelect } from "@/components/shared/ComboboxSelect";
import { useSystemRetrieveQuery, useSettingsRetrieveQuery, useSettingsUpdateMutation } from "@/services/api";

type ExportFormat = "excel" | "pdf";

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "excel", label: "Excel (.xlsx)" },
  { value: "pdf", label: "PDF" },
];

export const ExportPopover = ({
  disabled,
  onExport,
}: {
  disabled: boolean;
  onExport: (format: ExportFormat, showLaborDetails: boolean, unifyGroups: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("excel");
  const [showLaborDetails, setShowLaborDetails] = useState(false);
  const [unifyGroups, setUnifyGroups] = useState(false);

  const { data: systemInfo } = useSystemRetrieveQuery();
  const { data: settings } = useSettingsRetrieveQuery();
  const [updateSettings] = useSettingsUpdateMutation();
  const hasLibreOffice = systemInfo?.hasLibreOffice ?? false;

  useEffect(() => {
    if (settings) {
      setSelectedFormat(settings.defaultExportFormat ?? "excel");
      setShowLaborDetails(settings.defaultExportShowLaborDetails ?? false);
      setUnifyGroups(settings.defaultExportUnifyGroups ?? false);
    }
  }, [settings]);

  const availableOptions = hasLibreOffice
    ? FORMAT_OPTIONS
    : FORMAT_OPTIONS.filter((o) => o.value !== "pdf");

  const handleExport = () => {
    if (selectedFormat.length === 0) return;
    onExport(selectedFormat as ExportFormat, showLaborDetails, unifyGroups);
    updateSettings({
      settings: {
        defaultExportFormat: selectedFormat as ExportFormat,
        defaultExportShowLaborDetails: showLaborDetails,
        defaultExportUnifyGroups: unifyGroups,
      },
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className="w-full" variant="outline" disabled={disabled}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4 space-y-4 bg-white">
        {/* Format selection */}
        <ComboboxSelect
          mode="single"
          label="Format"
          value={selectedFormat}
          options={availableOptions}
          onChange={setSelectedFormat}
          allowCreate={false}
          placeholder="Select format..."
          openOnFocus={false}
        />

        {/* Labor details checkbox */}
        <div className="border-t border-gray-100 pt-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <Checkbox
              checked={showLaborDetails}
              onCheckedChange={(checked) =>
                setShowLaborDetails(checked === true)
              }
            />
            Show labor details
          </label>
        </div>

        {/* Unify groups checkbox */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <Checkbox
              checked={unifyGroups}
              onCheckedChange={(checked) =>
                setUnifyGroups(checked === true)
              }
            />
            Unify groups
          </label>
        </div>

        {/* Export button */}
        <Button
          className="w-full"
          onClick={handleExport}
          disabled={selectedFormat.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PopoverContent>
    </Popover>
  );
};
