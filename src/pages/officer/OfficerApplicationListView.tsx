import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Funnel,
  X,
  Eye,
  CheckCircle,
  Hourglass,
  ClockCounterClockwise,
  WarningCircle,
  ArrowCounterClockwise,
  FileText,
  FilePdf,
  CaretDown,
} from '@phosphor-icons/react';
import type { OfficerApplication, ApplicationStatus, OfficerSection } from '@/types/officer';

interface OfficerApplicationListViewProps {
  applications: OfficerApplication[];
  activeSection: OfficerSection;
  onSelectSection: (section: OfficerSection) => void;
  onOpenReviewWorkspace: (app: OfficerApplication) => void;
  onTakeApplication: (appId: string) => void;
  onQuickPreview: (app: OfficerApplication) => void;
}

export const OfficerApplicationListView: React.FC<OfficerApplicationListViewProps> = ({
  applications,
  activeSection,
  onOpenReviewWorkspace,
  onTakeApplication,
  onQuickPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState('ALL');
  const [selectedOfficer, setSelectedOfficer] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Map active section to status filter
  const statusFilter: ApplicationStatus | 'ALL' = useMemo(() => {
    switch (activeSection) {
      case 'apps-pending':
        return 'SUBMITTED_FOR_REVIEW';
      case 'apps-reviewing':
        return 'UNDER_REVIEW';
      case 'apps-need-revision':
        return 'NEED_REVISION';
      case 'apps-resubmitted':
        return 'RESUBMITTED';
      case 'apps-approved':
        return 'APPROVED';
      case 'apps-ready-submit':
        return 'READY_TO_SUBMIT';
      default:
        return 'ALL';
    }
  }, [activeSection]);

  // Unique procedures list
  const procedureOptions = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => set.add(a.procedureName));
    return Array.from(set);
  }, [applications]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        // Status filter
        if (statusFilter !== 'ALL' && app.status !== statusFilter) {
          return false;
        }
        // Search query (Mã HS, Họ tên, CCCD, SĐT)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = app.applicationNumber.toLowerCase().includes(q);
          const matchName = app.citizen.fullName.toLowerCase().includes(q);
          const matchId = app.citizen.citizenId.includes(q);
          const matchPhone = app.citizen.phoneNumber.includes(q);
          if (!matchCode && !matchName && !matchId && !matchPhone) return false;
        }
        // Procedure filter
        if (selectedProcedure !== 'ALL' && app.procedureName !== selectedProcedure) {
          return false;
        }
        // Officer filter
        if (selectedOfficer !== 'ALL' && app.assignedOfficer !== selectedOfficer) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return b.id.localeCompare(a.id);
        }
        return a.id.localeCompare(b.id);
      });
  }, [applications, statusFilter, searchQuery, selectedProcedure, selectedOfficer, sortOrder]);


  function renderStatusBadge(status: ApplicationStatus, priorityBadge?: string) {
    switch (status) {
      case 'SUBMITTED_FOR_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Hourglass size={14} />
            <span>Chờ tiền kiểm</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <ClockCounterClockwise size={14} />
            <span>Đang kiểm tra</span>
          </span>
        );
      case 'NEED_REVISION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <WarningCircle size={14} />
            <span>Cần bổ sung</span>
          </span>
        );
      case 'RESUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-300 ring-1 ring-purple-300">
            <ArrowCounterClockwise size={14} weight="bold" />
            <span>{priorityBadge || 'Đã gửi lại'}</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle size={14} />
            <span>Đã duyệt tiền kiểm</span>
          </span>
        );
      case 'READY_TO_SUBMIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <FileText size={14} />
            <span>Chờ tiếp nhận</span>
          </span>
        );
      case 'OFFICIALLY_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <FilePdf size={14} />
            <span>Đã tiếp nhận tại UBND</span>
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <section aria-label="Quản lý danh sách hồ sơ" className="space-y-5">

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-5">
            <label htmlFor="search-app-input" className="sr-only">
              Tìm kiếm hồ sơ
            </label>
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="search-app-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã hồ sơ, họ tên người dân, CCCD, SĐT..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-950 placeholder:text-slate-400 focus:border-red-600 focus:bg-white focus:outline-none focus:ring-3 focus:ring-red-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Procedure Filter */}
          <div className="md:col-span-3">
            <label htmlFor="filter-proc-select" className="sr-only">
              Lọc theo thủ tục
            </label>
            <div className="relative">
              <select
                id="filter-proc-select"
                value={selectedProcedure}
                onChange={(e) => setSelectedProcedure(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100"
              >
                <option value="ALL">Tất cả thủ tục ({procedureOptions.length})</option>
                {procedureOptions.map((proc) => (
                  <option key={proc} value={proc}>
                    {proc}
                  </option>
                ))}
              </select>
              <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Officer in charge */}
          <div className="md:col-span-2">
            <label htmlFor="filter-officer-select" className="sr-only">
              Cán bộ phụ trách
            </label>
            <div className="relative">
              <select
                id="filter-officer-select"
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100"
              >
                <option value="ALL">Mọi cán bộ</option>
                <option value="Lê Thu Hà">Cán bộ Lê Thu Hà</option>
                <option value="Chưa phân công">Chưa phân công</option>
              </select>
              <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {/* Sort order */}
          <div className="md:col-span-2">
            <label htmlFor="filter-sort-select" className="sr-only">
              Sắp xếp
            </label>
            <div className="relative">
              <select
                id="filter-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-3 pr-8 text-xs sm:text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100"
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
              </select>
              <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Results summary & clear */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Tìm thấy <strong className="font-bold text-slate-900">{filteredApps.length}</strong> hồ sơ phù hợp
          </span>
          {(searchQuery || selectedProcedure !== 'ALL' || selectedOfficer !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedProcedure('ALL');
                setSelectedOfficer('ALL');
              }}
              className="text-red-700 font-semibold hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Semantic Application Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left" aria-label="Bảng danh sách hồ sơ hành chính">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-5 py-3.5">Mã hồ sơ</th>
                <th scope="col" className="px-4 py-3.5">Người dân</th>
                <th scope="col" className="px-4 py-3.5">Thủ tục</th>
                <th scope="col" className="px-4 py-3.5">Ngày gửi</th>
                <th scope="col" className="px-4 py-3.5">Cán bộ</th>
                <th scope="col" className="px-4 py-3.5">Trạng thái</th>
                <th scope="col" className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Funnel size={32} className="mx-auto text-slate-300 mb-2" aria-hidden="true" />
                    <p className="font-semibold text-slate-700">Chưa có hồ sơ nào.</p>
                    <p className="text-xs text-slate-400 mt-1 italic">⚠️ API danh sách hồ sơ cán bộ Một cửa sẽ được tích hợp sau.</p>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Mã HS */}
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-950">
                      <div className="flex items-center gap-1.5">
                        <span>{app.applicationNumber}</span>
                        {app.currentVersion > 1 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800">
                            V{app.currentVersion}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Người dân */}
                    <td className="px-4 py-3.5">
                      <strong className="block font-bold text-slate-900">{app.citizen.fullName}</strong>
                      <span className="block text-[11px] text-slate-500 font-mono">{app.citizen.citizenId}</span>
                    </td>

                    {/* Thủ tục */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <span className="block font-medium text-slate-900 truncate" title={app.procedureName}>
                        {app.procedureName}
                      </span>
                      <span className="block text-[11px] text-slate-400">{app.procedureCategory}</span>
                    </td>

                    {/* Ngày gửi */}
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {app.submittedAt}
                    </td>

                    {/* Cán bộ */}
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                      {app.assignedOfficer === 'Chưa phân công' ? (
                        <span className="text-slate-400 italic">—</span>
                      ) : (
                        <span className="font-semibold text-slate-800">{app.assignedOfficer}</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {renderStatusBadge(app.status, app.priorityBadge)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Preview button */}
                        <button
                          type="button"
                          onClick={() => onQuickPreview(app)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          title="Xem trước thông tin tóm tắt"
                        >
                          <Eye size={14} aria-hidden="true" />
                          <span>Xem</span>
                        </button>

                        {/* Primary Contextual Action */}
                        {app.status === 'SUBMITTED_FOR_REVIEW' && (
                          <button
                            type="button"
                            onClick={() => onTakeApplication(app.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-800 font-bold text-white hover:bg-red-900 shadow-2xs transition-colors"
                          >
                            <span>Nhận xử lý</span>
                          </button>
                        )}

                        {app.status === 'UNDER_REVIEW' && (
                          <button
                            type="button"
                            onClick={() => onOpenReviewWorkspace(app)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-700 font-bold text-white hover:bg-blue-800 shadow-2xs transition-colors"
                          >
                            <span>Tiếp tục</span>
                          </button>
                        )}

                        {app.status === 'RESUBMITTED' && (
                          <button
                            type="button"
                            onClick={() => onOpenReviewWorkspace(app)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-700 font-bold text-white hover:bg-purple-800 shadow-2xs transition-colors"
                          >
                            <span>Review lại</span>
                          </button>
                        )}

                        {(app.status === 'APPROVED' || app.status === 'READY_TO_SUBMIT' || app.status === 'NEED_REVISION') && (
                          <button
                            type="button"
                            onClick={() => onOpenReviewWorkspace(app)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                          >
                            <span>Chi tiết</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
