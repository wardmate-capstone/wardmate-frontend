import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CaretDown,
  SignOut,
  FolderUser,
} from '@phosphor-icons/react';
import { useLogout } from '@/hooks/useLogout';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';

const workspaces = [
  { path: '/citizen', label: 'Cổng dịch vụ công dân', roles: ['REGISTERED_CITIZEN'] },
  { path: '/officer', label: 'Cổng cán bộ', roles: ['FRONT_DESK_OFFICER'] },
  { path: '/manager', label: 'Quản lý điều hành', roles: ['MANAGER'] },
  { path: '/procedure-manager', label: 'Quản lý thủ tục', roles: ['PROCEDURE_MANAGER', 'IT_ADMIN'] },
  { path: '/admin', label: 'Quản trị hệ thống', roles: ['IT_ADMIN'] },
];

interface UserDropdownProps {
  className?: string;
  isMobileDrawer?: boolean;
  onItemClick?: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  className = '',
  isMobileDrawer = false,
  onItemClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { handleLogout, isLoggingOut } = useLogout();
  const { profile, loading, initials } = useUserProfile();
  const user = useAuthStore(state => state.user);
  const availableWorkspaces = workspaces.filter(workspace => user?.roles.some(role => workspace.roles.includes(role)));

  const displayName = profile?.fullName?.trim() || user?.username || 'Tài khoản';
  const displayContact = profile?.phoneNumber?.trim() || user?.email || '';

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLinkClick = () => {
    setIsOpen(false);
    onItemClick?.();
  };

  const onLogoutClick = async () => {
    setIsOpen(false);
    onItemClick?.();
    await handleLogout();
  };

  if (isMobileDrawer) {
    return (
      <div className={`border-t border-slate-200 pt-4 mt-6 ${className}`}>
        <div className="flex items-center gap-3 px-1 mb-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-800 text-xs font-bold text-white shadow-sm">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block text-sm font-bold text-slate-900 truncate">
              {loading ? 'Đang tải...' : displayName}
            </strong>
            <small className="block text-xs text-slate-500 truncate">
              {displayContact}
            </small>
          </div>
        </div>

        <div className="space-y-1">
          {availableWorkspaces.map(workspace => <Link
            key={workspace.path}
            to={workspace.path}
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-800 transition-colors"
          >
            <FolderUser size={18} className="text-red-700" />
            <span>{workspace.label}</span>
          </Link>)}
          <button
            type="button"
            onClick={onLogoutClick}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors disabled:opacity-60"
          >
            <SignOut size={18} />
            <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="flex min-h-11 items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1.5 pr-3 text-left transition-all hover:border-red-200 hover:bg-red-50/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600/20"
        aria-label="Menu tài khoản"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-red-800 text-xs font-bold text-white shadow-sm">
          {initials}
        </span>
        <div className="hidden sm:block">
          <strong className="block text-xs font-bold text-slate-900 leading-tight">
            {loading ? 'Đang tải...' : displayName}
          </strong>
          <small className="block text-[10px] text-slate-500 leading-tight">
            Tài khoản WardMate
          </small>
        </div>
        <CaretDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-800' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Tùy chọn người dùng"
          className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header user info */}
          <div className="border-b border-slate-100 px-3.5 py-3 mb-1.5">
            <strong className="block text-sm font-bold text-slate-900 leading-snug truncate">
              {loading ? 'Đang tải thông tin...' : displayName}
            </strong>
            <span className="block mt-0.5 text-xs text-slate-500 font-normal leading-normal truncate">
              {displayContact}
            </span>
          </div>

          {/* Menu links */}
          <div className="space-y-1">
            {availableWorkspaces.map(workspace => <Link
              key={workspace.path}
              to={workspace.path}
              role="menuitem"
              onClick={handleLinkClick}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 text-slate-800 hover:bg-red-50 hover:text-red-900 transition-colors"
            >
              <FolderUser size={20} className="text-red-700 shrink-0 mt-0.5" weight="duotone" />
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-tight text-slate-900">
                  {workspace.label}
                </span>
                <span className="block text-xs font-normal text-slate-500 leading-normal mt-1">
                  Mở không gian làm việc
                </span>
              </div>
            </Link>)}
          </div>

          <div className="my-1.5 border-t border-slate-100" />

          {/* Đăng xuất */}
          <button
            type="button"
            role="menuitem"
            onClick={onLogoutClick}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors disabled:opacity-60"
          >
            <SignOut size={18} className="shrink-0" weight="bold" />
            <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
