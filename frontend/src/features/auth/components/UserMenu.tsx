import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout().unwrap();
    } catch {
      // Even if the call fails, redirect to login
    }
    navigate('/login');
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    navigate('/change-password');
  };

  const initials = user
    ? (user.firstName && user.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`
        : user.username.slice(0, 2)
      ).toUpperCase()
    : '??';

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-full transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-500)]"
        aria-label="User menu"
      >
        <Avatar className="h-8 w-8 bg-[var(--accent-600,#4f46e5)] text-white hover:bg-[var(--accent-700,#4338ca)]">
          <AvatarFallback className="bg-transparent text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-md bg-white shadow-lg ring-1 ring-black/5 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.username}
            </p>
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <KeyRound className="h-4 w-4 text-gray-400" />
            Change Password
          </button>
          <a
            href="/admin/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            Admin Panel
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};
