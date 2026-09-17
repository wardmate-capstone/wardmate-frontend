import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  CaretDown,
  IdentificationBadge,
  ChartLineUp,
  Gear,
  House,
  Check,
} from '@phosphor-icons/react';

export type RoleType = 'officer' | 'manager' | 'admin' | 'citizen';

interface RoleSwitcherProps {
  currentRole: RoleType;
  className?: string;
}

interface RoleOption {
  id: RoleType;
  label: string;
  roleTitle: string;
  unit: string;
  path: string;
  icon: typeof UserCircle;
  tone: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'officer',
    label: 'Cán bộ Một cửa',
    roleTitle: 'Front-desk Officer',
    unit: 'Bộ phận Tiếp nhận & Trả kết quả',
    path: '/officer',
    icon: IdentificationBadge,
    tone: 'text-red-700 bg-red-50 border-red-200',
  },
  {
    id: 'manager',
    label: 'Lãnh đạo / Quản lý',
    roleTitle: 'Manager / Supervisor',
    unit: 'UBND Phường An Khánh',
    path: '/manager',
    icon: ChartLineUp,
    tone: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
  {
    id: 'admin',
    label: 'Quản trị hệ thống',
    roleTitle: 'System Administrator',
    unit: 'Trung tâm Vận hành CNTT',
    path: '/admin',
    icon: Gear,
    tone: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  {
    id: 'citizen',
    label: 'Cổng thông tin Công dân',
    roleTitle: 'Citizen Portal',
    unit: 'WardMate Public',
    path: '/',
    icon: House,
    tone: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
];

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeOption = ROLE_OPTIONS.find((r) => r.id === currentRole) || ROLE_OPTIONS[0];
  const Icon = activeOption.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: RoleOption) => {
    setIsOpen(false);
    navigate(option.path);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs text-left"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`grid size-8 place-items-center rounded-lg border ${activeOption.tone}`}>
          <Icon size={18} weight="bold" />
        </span>
        <div className="hidden sm:block min-w-0 pr-1">
          <p className="text-xs font-bold text-slate-900 leading-none truncate">{activeOption.label}</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-none truncate">{activeOption.roleTitle}</p>
        </div>
        <CaretDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
          role="listbox"
        >
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chuyển đổi vai trò làm việc</p>
            <p className="text-xs text-slate-600 mt-0.5">Trải nghiệm các giao diện phân quyền</p>
          </div>
          <div className="space-y-1">
            {ROLE_OPTIONS.map((option) => {
              const OptionIcon = option.icon;
              const isSelected = option.id === currentRole;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected ? 'bg-red-50/70 text-red-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg border ${option.tone}`}>
                    <OptionIcon size={18} weight="bold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold ${isSelected ? 'text-red-900' : 'text-slate-900'}`}>{option.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{option.unit}</p>
                  </div>
                  {isSelected && <Check size={16} weight="bold" className="text-red-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
