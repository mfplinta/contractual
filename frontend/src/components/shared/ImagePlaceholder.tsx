import React from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  src?: string | null;
  alt?: string;
  size?: string;
  iconSize?: string;
  className?: string;
  imgClassName?: string;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  src,
  alt = '',
  size = 'h-10 w-10',
  iconSize = 'h-5 w-5',
  className,
  imgClassName,
}) => (
  <div
    className={cn(
      'rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-none',
      size,
      className,
    )}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        className={cn('h-full w-full object-cover', imgClassName)}
        draggable={false}
      />
    ) : (
      <Package className={cn('text-gray-400', iconSize)} />
    )}
  </div>
);
