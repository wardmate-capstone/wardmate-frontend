import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Eye,
  ArrowSquareOut,
  CalendarBlank,
  X,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import type { Application, ApplicationStatus } from '@/types/application';
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatusBadge';

type FilterStatus = ApplicationStatus | 'ALL';

interface OfficerApplicationListProps {
  applications: Application[];
  onSelectApplication: (app: Application) => void;
  initialFilterStatus?: FilterStatus;
}

export const OfficerApplicationList: React.FC<OfficerApplicationListProps> = ({
  applications,
  onSelectApplication,
  initialFilterStatus = 'ALL',
}) => {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>(initialFilterStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [quickPreviewApp, setQuickPreviewApp] = useState<Application | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter tabs
  const statusTabs: Array<{ id: FilterStatus; label: string; count: number }> = [
    { id: 'ALL', label: 'Tất cả hồ sơ', count: applications.length },

    {
      id: 'SUBMITTED_FOR_REVIEW',
      label: 'Chờ kiểm tra',
      count: applications.filter((a) => a.status === 'SUBMITTED_FOR_REVIEW').length,
    },
    {
      id: 'UNDER_REVIEW',
      label: 'Đang tiền kiểm',
      count: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
    },
    {
      id: 'NEED_REVISION',
      label: 'Cần bổ sung',
      count: applications.filter((a) => a.status === 'NEED_REVISION').length,
    },
    {
      id: 'RESUBMITTED',
      label: 'Đã gửi bổ sung',
      count: applications.filter((a) => a.status === 'RESUBMITTED').length,
    },
    {
      id: 'APPROVED',
      label: 'Đã duyệt tiền kiểm',
      count: applications.filter((a) => a.status === 'APPROVED').length,
    },
    {
      id: 'READY_TO_SUBMIT',
      label: 'Sẵn sàng nộp',
      count: applications.filter((a) => a.status === 'READY_TO_SUBMIT').length,
    },
    {
      id: 'OFFICIALLY_RECEIVED',
      label: 'Đã tiếp nhận',
      count: applications.filter((a) => a.status === 'OFFICIALLY_RECEIVED').length,
    },
    {
      id: 'COMPLETED',
      label: 'Hoàn thành',
      count: applications.filter((a) => a.status === 'COMPLETED').length,
    },
  ];

  // Filtering
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchStatus =
        selectedStatus === 'ALL'
          ? true
          : app.status === selectedStatus;
      const matchCategory = selectedCategory === 'ALL' || app.procedureCategory === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        app.applicationNumber.toLowerCase().includes(query) ||
        app.citizen.fullName.toLowerCase().includes(query) ||
        app.citizen.citizenId.includes(query) ||
        app.procedureName.toLowerCase().includes(query);
      return matchStatus && matchCategory && matchQuery;
    });
  }, [applications, selectedStatus, selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / pageSize));
  const paginatedApps = filteredApps.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      {/* Search & Status Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1 min-w-[280px]">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo mã hồ sơ, tên người dân, số CCCD, thủ tục..."
              className="w-full h-11 pl-10 pr-10 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Status Dropdown List */}
            <div className="relative flex items-center min-w-[210px] flex-1 sm:flex-initial">
              <label htmlFor="status-filter-select" className="sr-only">Lọc theo trạng thái hồ sơ</label>
              <select
                id="status-filter-select"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as ApplicationStatus | 'ALL');
                  setCurrentPage(1);
                }}
                className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 cursor-pointer transition-colors shadow-xs"
              >
                {statusTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label} ({tab.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown List */}
            <div className="relative flex items-center min-w-[160px] flex-1 sm:flex-initial">
              <label htmlFor="category-filter-select" className="sr-only">Lọc theo lĩnh vực</label>
              <select
                id="category-filter-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 px-3.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 cursor-pointer transition-colors shadow-xs"
              >
                <option value="ALL">Tất cả lĩnh vực</option>
                <option value="Hộ tịch">Lĩnh vực Hộ tịch</option>
                <option value="Chứng thực">Lĩnh vực Chứng thực</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {(selectedStatus !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-red-800 hover:bg-red-50 hover:border-red-200 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                title="Đặt lại bộ lọc"
              >
                <X size={14} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Summary */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span>Đang hiển thị: <strong>{filteredApps.length}</strong> hồ sơ</span>
          {selectedStatus !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-900 border border-red-200 text-[11px] font-bold">
              Trạng thái: {statusTabs.find((t) => t.id === selectedStatus)?.label}
              <button
                type="button"
                onClick={() => setSelectedStatus('ALL')}
                className="hover:text-red-600 cursor-pointer ml-0.5"
                title="Xóa lọc trạng thái"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold">
              Lĩnh vực: {selectedCategory}
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className="hover:text-slate-600 cursor-pointer ml-0.5"
                title="Xóa lọc lĩnh vực"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Mã hồ sơ</th>
                <th className="p-4">Công dân nộp</th>
                <th className="p-4">Thủ tục hành chính</th>
                <th className="p-4">Thời gian gửi</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedApps.length > 0 ? (
                paginatedApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="font-mono font-bold text-red-900 group-hover:underline cursor-pointer" onClick={() => onSelectApplication(app)}>
                        {app.applicationNumber}
                      </div>
                      <span className="text-[10px] text-slate-400">Phiên bản v{app.currentVersion}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{app.citizen.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">CCCD: {app.citizen.citizenId}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate" title={app.procedureName}>
                        {app.procedureName}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 mt-0.5">
                        {app.procedureCategory}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CalendarBlank size={14} className="text-slate-400" />
                        <span>{app.submittedAt}</span>
                      </div>
                      {app.reviewedBy && (
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[150px]">
                          {app.reviewedBy}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <ApplicationStatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setQuickPreviewApp(app)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold text-xs shadow-xs cursor-pointer"
                        title="Xem nhanh tóm tắt"
                      >
                        <Eye size={14} />
                        <span>Xem nhanh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectApplication(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-900 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                      >
                        <span>Kiểm tra hồ sơ</span>
                        <ArrowSquareOut size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 text-sm">
                    Không tìm thấy hồ sơ nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <span>
            Hiển thị {paginatedApps.length} trên tổng số {filteredApps.length} hồ sơ
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <CaretLeft size={16} />
            </button>
            <span className="font-bold text-slate-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK PREVIEW DRAWER / MODAL */}
      {quickPreviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Xem nhanh hồ sơ</span>
                <h3 className="text-base font-bold text-slate-900">{quickPreviewApp.applicationNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickPreviewApp(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <p className="text-slate-500">Thủ tục:</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{quickPreviewApp.procedureName}</p>
                </div>
                <ApplicationStatusBadge status={quickPreviewApp.status} size="md" />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500">Họ và tên:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{quickPreviewApp.citizen.fullName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Số CCCD:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{quickPreviewApp.citizen.citizenId}</p>
                </div>
                <div>
                  <span className="text-slate-500">Điện thoại:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{quickPreviewApp.citizen.phoneNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Thời gian gửi:</span>
                  <p className="font-bold text-slate-900 mt-0.5">{quickPreviewApp.submittedAt}</p>
                </div>
              </div>

              {quickPreviewApp.revisionHistory.length > 0 && (
                <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200">
                  <div className="flex items-center justify-between font-bold text-indigo-950 mb-1">
                    <span>Lịch sử phiên bản (v{quickPreviewApp.currentVersion}):</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 font-mono">
                      {quickPreviewApp.revisionHistory.length} lần cập nhật
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    {quickPreviewApp.revisionHistory[quickPreviewApp.revisionHistory.length - 1]?.summary}
                  </p>
                  {quickPreviewApp.revisionHistory[quickPreviewApp.revisionHistory.length - 1]?.diffs.length > 0 && (
                    <div className="mt-2 text-[10px] text-indigo-800 font-semibold">
                      Thay đổi: {quickPreviewApp.revisionHistory[quickPreviewApp.revisionHistory.length - 1].diffs.map((d) => d.fieldName).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Thành phần hồ sơ kèm theo:</h4>
                <ul className="space-y-1.5 pl-4 list-disc text-slate-600">
                  {quickPreviewApp.checklist.map((c) => (
                    <li key={c.id}>
                      {c.name} - <span className="font-semibold text-slate-800">{c.status === 'ok' ? 'Đầy đủ' : 'Cần kiểm tra'}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Tài liệu tải lên ({quickPreviewApp.documents.length}):</h4>
                <div className="space-y-1.5">
                  {quickPreviewApp.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-medium text-slate-700 truncate max-w-[280px]">{d.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${d.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {d.status === 'valid' ? 'Hợp lệ' : 'Cần xem lại'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setQuickPreviewApp(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = quickPreviewApp;
                  setQuickPreviewApp(null);
                  onSelectApplication(target);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Mở Workspace tiền kiểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
