import { cn } from '@/lib/utils';

export const Spinner = ({ className }: { className?: string }) => (
  <div className={cn('h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600', className)} />
);

export const FullPageSpinner = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Spinner />
  </div>
);

export const CenteredSpinner = ({ className }: { className?: string }) => (
  <div className={cn('flex items-center justify-center', className)}>
    <Spinner />
  </div>
);
