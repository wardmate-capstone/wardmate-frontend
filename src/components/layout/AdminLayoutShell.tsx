import React, { useState } from 'react';
import {
  List,
  X,
  Bell,
  SidebarSimple,
  CaretRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import type { RoleType } from '@/components/common/RoleSwitcher';
import { toast } from 'sonner';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface AdminLayoutShellProps {
  currentRole: RoleType;
  roleTitle: string;
  userName: string;
  userAvatar: string;
  userEmail: string;
  navGroups: NavGroup[];
  activeNavId: string;
  onSelectNav: (id: string) => void;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string; onClick?: () => void }>;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminLayoutShell: React.FC<AdminLayoutShellProps> = ({
  roleTitle,
  userName,
  userAvatar,
  userEmail,
  navGroups,
  activeNavId,
  onSelectNav,
  title,
  subtitle,
  breadcrumbs,
  headerActions,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="admin-layout min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${sidebarCollapsed ? 'w-20' : 'w-72'}`}
        aria-label="Thanh điều hướng chính"
      >
        {/* Brand */}
        <div className="flex h-18 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark className="size-10 shrink-0 drop-shadow-sm" size={40} />
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <BrandWordmark subtitle={roleTitle} compact />
              </div>
            )}
          </div>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectNav(item.id);
                      setSidebarOpen(false);
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-red-50 text-red-900 font-bold border-l-4 border-red-700 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon size={20} weight={isActive ? 'duotone' : 'regular'} className={isActive ? 'text-red-700 shrink-0' : 'text-slate-500 shrink-0'} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                              item.badgeColor || (isActive ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-600')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-3 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <span className="grid size-9 place-items-center rounded-full bg-red-800 text-xs font-bold text-white shrink-0 shadow-xs">
              {userAvatar}
            </span>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở danh mục điều hướng"
            >
              <List size={20} />
            </button>
            <button
              type="button"
              className="hidden lg:grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-transform"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              <SidebarSimple size={20} className={sidebarCollapsed ? 'rotate-180' : ''} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Hệ thống Tiền kiểm Hồ sơ Hành chính Xã/Phường</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => toast.info('Không có cảnh báo mới trong ca làm việc.')}
              className="relative grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Thông báo"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-red-600 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {/* Breadcrumbs & Page Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-200">
            <div>
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.label}>
                      {idx > 0 && <CaretRight size={12} className="text-slate-400" />}
                      {crumb.onClick ? (
                        <button
                          type="button"
                          onClick={crumb.onClick}
                          className="hover:text-red-700 hover:underline cursor-pointer"
                        >
                          {crumb.label}
                        </button>
                      ) : (
                        <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-800' : ''}>
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {headerActions && <div className="flex items-center gap-3 shrink-0">{headerActions}</div>}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
};
