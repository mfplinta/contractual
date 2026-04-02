import React, { useEffect, useMemo, useState } from 'react';
import { ImagePlaceholder } from '@/components/shared/ImagePlaceholder';
import { cn } from '@/lib/utils';
import { useIsTouchDevice } from '@/components/ui/use-mobile';
import { useNonPassiveWheelListener } from '@/hooks/useNonPassiveWheelListener';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from '@/components/ui/carousel';
import type { MaterialImageRead } from '@/services/generatedApi';

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const resolveMediaUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  if (typeof window === 'undefined') return value;

  try {
    const parsed = new URL(value, window.location.origin);
    if (LOCALHOST_HOSTS.has(parsed.hostname) && parsed.pathname.startsWith('/media/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return parsed.toString();
  } catch {
    return value;
  }
};

interface MaterialImageCarouselProps {
  images: MaterialImageRead[];
  alt: string;
  className?: string;
  imageClassName?: string;
  showDotsOnHover?: boolean;
  showFallback?: boolean;
  initialImageId?: number | null;
}

export const MaterialImageCarousel: React.FC<MaterialImageCarouselProps> = ({
  images,
  alt,
  className,
  imageClassName,
  showDotsOnHover = true,
  showFallback = true,
  initialImageId,
}) => {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const isTouchDevice = useIsTouchDevice();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const imagesKey = useMemo(
    () => images.map((img) => img.id ?? img.image).join('|'),
    [images]
  );

  const initialIndex = useMemo(() => {
    if (initialImageId == null) return 0;
    const index = images.findIndex((img) => String(img.id) === String(initialImageId));
    return index >= 0 ? index : 0;
  }, [images, initialImageId]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };
    setScrollSnaps(api.scrollSnapList());
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    // Jump instantly to the requested initial image without transition.
    api.scrollTo(initialIndex, true);
    setSelectedIndex(initialIndex);
  }, [api, imagesKey, initialIndex]);

  useNonPassiveWheelListener(
    containerRef,
    (event) => {
      event.preventDefault();
      if (!api) return;
      if (event.deltaY > 0) {
        api.scrollNext();
      } else if (event.deltaY < 0) {
        api.scrollPrev();
      }
    },
    images.length > 1,
  );

  if (images.length === 0) {
    if (!showFallback) return null;
    return (
      <ImagePlaceholder size="w-full h-full" iconSize="h-12 w-12" className={className} />
    );
  }

  if (images.length === 1) {
    return (
      <img
        src={resolveMediaUrl(images[0].image)}
        alt={alt}
        className={cn('w-full h-full object-cover', imageClassName)}
        draggable={false}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative group w-full h-full', className)}
    >
      <Carousel
        key={imagesKey}
        setApi={setApi}
        opts={{ loop: true }}
        className="w-full h-full"
      >
        <CarouselContent className="ml-0 h-full">
          {images.map((image) => (
            <CarouselItem key={image.id ?? image.image} className="pl-0 h-full">
              <img
                src={resolveMediaUrl(image.image)}
                alt={alt}
                className={cn('w-full h-full object-cover', imageClassName)}
                draggable={false}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {scrollSnaps.length > 1 && (
        <div
          className={cn(
            'absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 transition-opacity',
            showDotsOnHover && !isTouchDevice ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          )}
        >
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 w-2 rounded-full bg-white shadow-sm ring-1 ring-black/20',
                selectedIndex === index ? 'opacity-100 scale-110' : 'opacity-60'
              )}
              style={{ boxShadow: '0 0 0 2px rgba(0,0,0,0.12)' }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
