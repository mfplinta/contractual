import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { Package } from 'lucide-react';
import { Helmet } from 'react-helmet';

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ login: { username, password } }).unwrap();
      navigate('/', { replace: true });
    } catch (err: any) {
      const data = err?.data;
      if (data?.nonFieldErrors) {
        setError(data.nonFieldErrors.join(' '));
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError('Unable to log in. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Helmet>
        <title>Login | Contractual</title>
      </Helmet>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <Package className="h-10 w-10 text-[var(--accent-600,#4f46e5)]" />
            <span className="ml-3 text-2xl font-bold text-gray-900">Contractual</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--accent-500,#6366f1)] focus:ring-1 focus:ring-[var(--accent-500,#6366f1)] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--accent-500,#6366f1)] focus:ring-1 focus:ring-[var(--accent-500,#6366f1)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-[var(--accent-600,#4f46e5)] hover:bg-[var(--accent-700,#4338ca)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-500,#6366f1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
