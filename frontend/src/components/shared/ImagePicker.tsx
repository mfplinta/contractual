import React, { useEffect, useId, useRef, useState } from 'react';
import { Link2, RotateCcw, Trash2, Upload } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Input } from '../ui/input';

interface ImagePickerProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onDelete?: () => void;
  accept?: string;
  initialUrl?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  file,
  onFileChange,
  onDelete,
  accept = 'image/*',
  initialUrl
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [source, setSource] = useState<'file' | 'url'>('file');
  const fileId = useId();
  const urlId = useId();
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const isHandlingUrl = useRef(false);
  const initialUrlApplied = useRef(false);

  useEffect(() => {
    if (initialUrl && !initialUrlApplied.current) {
      initialUrlApplied.current = true;
      setSource('url');
      setUrlValue(initialUrl);
      setUrlPreview(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (source === 'url') {
      setPreviewUrl(urlPreview);
      return;
    }

    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, source, urlPreview]);

  const handleUrlChange = (nextUrl: string) => {
    setUrlValue(nextUrl);
    setUrlPreview(null);
    if (source === 'url' && !isHandlingUrl.current) {
      onFileChange(null);
    }
  };

  const loadImage = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image failed to load'));
      image.src = src;
    });

  const fetchUrlAsFile = async (value: string) => {
    const isCrossOrigin = new URL(value, window.location.origin).origin !== window.location.origin;
    const fetchUrl = isCrossOrigin
      ? `/api/proxy-image?url=${encodeURIComponent(value)}`
      : value;
    const response = await fetch(fetchUrl);
    const blob = await response.blob();
    const resolved = new URL(value, window.location.origin);
    const name = resolved.pathname.split('/').pop() || 'image';
    const fileType = blob.type || 'image/jpeg';
    return new File([blob], name, { type: fileType });
  };

  const hasImage = Boolean(file || previewUrl);
  const isDirty = initialUrl
    ? (source === 'file' && file !== null) ||
      (source === 'url' && urlValue !== initialUrl) ||
      (!file && !previewUrl)
    : false;

  const handleDelete = () => {
    setSource('file');
    setUrlValue('');
    setUrlPreview(null);
    setPreviewUrl(null);
    onFileChange(null);
    onDelete?.();
  };

  const handleRevert = () => {
    if (!initialUrl) return;
    initialUrlApplied.current = true;
    setSource('url');
    setUrlValue(initialUrl);
    setUrlPreview(initialUrl);
    fetchUrlAsFile(initialUrl)
      .then((f) => onFileChange(f))
      .catch(() => onFileChange(null));
  };

  const handleUrlBlur = async () => {
    if (source !== 'url') return;
    const nextUrl = urlValue.trim();
    if (!nextUrl) {
      setUrlPreview(null);
      onFileChange(null);
      return;
    }

    try {
      isHandlingUrl.current = true;
      await loadImage(nextUrl);
      setUrlPreview(nextUrl);
      try {
        const fileFromUrl = await fetchUrlAsFile(nextUrl);
        onFileChange(fileFromUrl);
      } catch {
        onFileChange(null);
      }
    } catch {
      setUrlPreview(null);
      onFileChange(null);
    } finally {
      isHandlingUrl.current = false;
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>

      <div className="flex items-stretch gap-1.5">
        <div className="relative flex flex-1 items-stretch min-w-0 rounded-md border border-gray-200 bg-white focus-within:ring-1 focus-within:ring-[var(--accent-500)] focus-within:border-[var(--accent-500)] min-h-[38px]">
          <RadioGroup
            value={source}
            onValueChange={(value) => {
              const nextSource = value === 'url' ? 'url' : 'file';
              setSource(nextSource);
              if (nextSource === 'url') {
                onFileChange(null);
                return;
              }
              handleUrlChange('');
            }}
            className="flex items-center px-1"
          >
            <label
              htmlFor={fileId}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                source === 'file' ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <RadioGroupItem id={fileId} value="file" className="sr-only" />
              <Upload className="h-4 w-4" />
            </label>
            <label
              htmlFor={urlId}
              className={`ml-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                source === 'url' ? 'bg-gray-200 text-gray-600' : 'bg-gray-100 text-gray-400'
              }`}
            >
              <RadioGroupItem id={urlId} value="url" className="sr-only" />
              <Link2 className="h-4 w-4" />
            </label>
          </RadioGroup>

          {source === 'file' ? (
            <div className="relative flex flex-1 items-center min-w-0">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-8 w-8 rounded object-contain ml-2" />
              ) : null}
              <div className="flex-1 min-w-0 px-3 py-1.5">
                <span className={`block text-sm truncate ${file ? 'text-gray-900' : 'text-gray-500'}`}>
                  {file ? file.name : 'Click to pick a file'}
                </span>
              </div>
              <input
                type="file"
                accept={accept}
                className="absolute inset-0 opacity-0 cursor-pointer z-0"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center min-w-0">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-8 w-8 rounded object-contain ml-2" />
              ) : null}
              <Input
                type="text"
                value={urlValue}
                onChange={(event) => handleUrlChange(event.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com/image.jpg"
                className="border-0 bg-transparent px-0 h-8 pl-3 shadow-none focus-visible:ring-0"
              />
            </div>
          )}
        </div>

        {/* Action buttons: delete & revert */}
        <div className="flex items-center gap-0.5">
          {hasImage && (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
              onClick={handleDelete}
              aria-label="Delete image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {initialUrl && isDirty && (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              onClick={handleRevert}
              aria-label="Revert to original image"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
