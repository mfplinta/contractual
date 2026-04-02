import { Navigate, Outlet } from 'react-router-dom';
import { useAuthUserRetrieveQuery } from '@/services/api';

export const RequireAuth = () => {
  const { data: user, isLoading, error } = useAuthUserRetrieveQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (error || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
