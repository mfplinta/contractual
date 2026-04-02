import { useState } from 'react';
import {
  useAuthUserRetrieveQuery,
  useAuthLoginCreateMutation,
  useAuthLogoutCreateMutation,
  useAuthPasswordChangeCreateMutation,
} from '@/services/api';

export const useAuth = () => {
  const { data: user, isLoading, error } = useAuthUserRetrieveQuery();
  const [login] = useAuthLoginCreateMutation();
  const [logout] = useAuthLogoutCreateMutation();
  const [changePassword] = useAuthPasswordChangeCreateMutation();

  const isAuthenticated = !!user && !error;

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    changePassword,
  };
};
