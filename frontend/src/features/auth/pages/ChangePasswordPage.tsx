import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/Button';
import { useAppToast } from '@/hooks/useAppToast';

export const ChangePasswordPage = () => {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useAppToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      await changePassword({
        passwordChange: { oldPassword, newPassword1, newPassword2 },
      }).unwrap();
      showToast('info', 'Password changed', 'Your password has been updated successfully.');
      navigate(-1);
    } catch (err: any) {
      const data = err?.data;
      if (data && typeof data === 'object') {
        const fieldErrors: Record<string, string[]> = {};
        for (const [key, value] of Object.entries(data)) {
          fieldErrors[key] = Array.isArray(value) ? value : [String(value)];
        }
        setErrors(fieldErrors);
      } else {
        setErrors({ general: ['Something went wrong. Please try again.'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const allErrors = Object.entries(errors);

  return (
    <div className="max-w-md mx-auto">
      <Helmet>
        <title>Change Password | Contractual</title>
      </Helmet>
      <div className="flex items-center justify-between h-12 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
        {allErrors.length > 0 && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
            {allErrors.map(([field, messages]) =>
              messages.map((msg, i) => (
                <p key={`${field}-${i}`} className="text-sm text-red-700">{msg}</p>
              ))
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="old-password" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              id="old-password"
              type="password"
              required
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-password1" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="new-password1"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="new-password2" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              id="new-password2"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--accent-500)] focus:ring-1 focus:ring-[var(--accent-500)] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 mt-6">
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
