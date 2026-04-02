
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useBlocker } from 'react-router';
import { useSettings } from '../hooks';
import { Button } from '@/components/ui/Button';
import { NumberInput } from '@/components/ui/NumberInput';
import { ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useSettingsCompanyLogoUpdateMutation, useSettingsCompanyLogoDestroyMutation } from '@/services/api';

export const SettingsPage = () => {
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const [taxRate, setTaxRate] = useState(settings?.taxRate ? settings.taxRate * 100 : 0);
  const [accentColor, setAccentColor] = useState(settings?.accentColor ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDeleted, setLogoDeleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadLogo] = useSettingsCompanyLogoUpdateMutation();
  const [deleteLogo] = useSettingsCompanyLogoDestroyMutation();

  const currentLogoUrl = settings?.companyLogoUrl ?? null;

  // Sync local state when settings load from the API (e.g. on hard refresh)
  useEffect(() => {
    if (!settings) return;
    setTaxRate(settings.taxRate * 100);
    setAccentColor(settings.accentColor);
  }, [settings?.taxRate, settings?.accentColor]);

  const isDirty = useMemo(() => {
    if (!settings) return false;
    if (taxRate !== settings.taxRate * 100) return true;
    if (accentColor !== (settings.accentColor)) return true;
    if (logoFile !== null) return true;
    if (logoDeleted) return true;
    return false;
  }, [taxRate, accentColor, logoFile, logoDeleted, settings?.taxRate, settings?.accentColor]);

  // Warn on browser/tab close
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Warn on in-app navigation via react-router
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const shouldLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be discarded.'
      );
      if (shouldLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  const handleSave = useCallback(async () => {
    updateSettings({
      taxRate: taxRate / 100,
      accentColor,
    });

    if (logoFile) {
      const formData = new FormData();
      formData.append('logo', logoFile);
      await uploadLogo({ body: formData } as any).unwrap();
      setLogoFile(null);
      setLogoPreview(null);
    }

    if (logoDeleted) {
      await deleteLogo().unwrap();
      setLogoDeleted(false);
    }
  }, [taxRate, accentColor, logoFile, logoDeleted, settings?.materialsViewMode, updateSettings, uploadLogo, deleteLogo]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoDeleted(false);
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
  };

  const handleLogoDelete = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoDeleted(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoRestore = () => {
    setLogoDeleted(false);
    setLogoFile(null);
    setLogoPreview(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Helmet>
        <title>Settings | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div />
      </div>
      
      <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
         <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Financial</h3>
         
         <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="tax-rate" className="block text-sm font-medium text-gray-700">Default Tax Rate</label>
              <div className="mt-1 relative rounded-md">
                  <NumberInput
                    name="tax-rate"
                    id="tax-rate"
                className="focus:ring-[var(--accent-500)] focus:border-[var(--accent-500)] block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    value={taxRate}
                    onValueChange={(value) => {
                      if (value !== null) setTaxRate(value);
                    }}
                    formatOnBlur={(value) => value.toFixed(2)}
                    min={0}
                    step={0.01}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
               </div>
               <p className="mt-2 text-xs text-gray-500">This tax rate will be applied to all new jobs by default.</p>
            </div>
         </div>

        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 mt-8">Theme</h3>

        <div className="space-y-6">
          {/* Accent Color */}
          <div>
            <label htmlFor="accent-color" className="block text-sm font-medium text-gray-700">Accent Color</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                id="accent-color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-14 rounded border border-gray-300 cursor-pointer p-0.5"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">This color is used as the accent throughout the app.</p>
          </div>

          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {!logoDeleted && (logoPreview || currentLogoUrl) ? (
                  <img
                    src={logoPreview || currentLogoUrl!}
                    alt="Company logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {logoDeleted && currentLogoUrl ? (
                    <button
                      type="button"
                      onClick={handleLogoRestore}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {currentLogoUrl || logoPreview ? 'Change' : 'Upload'}
                      </Button>
                      {(currentLogoUrl || logoPreview) && (
                        <button
                          type="button"
                          onClick={handleLogoDelete}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                          aria-label="Delete logo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  {logoDeleted
                    ? 'Logo will be removed on save.'
                    : 'Replaces the default icon in the navigation bar.'}
                </p>
              </div>
            </div>
          </div>
        </div>

         <div className="mt-8 flex justify-end border-t border-gray-200 pt-4">
            <Button onClick={handleSave} disabled={!isDirty}>Save</Button>
         </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Data Management</h3>
        <div className="space-y-2">
          {[
            { label: 'Units', kind: 'units' as const },
            { label: 'Tags', kind: 'tags' as const },
            { label: 'Stores', kind: 'stores' as const },
          ].map(({ label, kind }) => (
            <button
              key={kind}
              type="button"
              onClick={() => navigate(`/settings/manage/${kind}`)}
              className="w-full flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <span>{label}</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
