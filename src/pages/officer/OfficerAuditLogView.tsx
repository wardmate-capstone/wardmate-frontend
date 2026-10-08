import React, { useState, useMemo } from 'react';
import {
  ClockCounterClockwise,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import type { OfficerAuditLog } from '@/types/officer';

interface OfficerAuditLogViewProps {
  logs: OfficerAuditLog[];
  onSelectApplication?: (appNumber: string) => void;
}

export const OfficerAuditLogView: React.FC<OfficerAuditLogViewProps> = ({
  logs,
  onSelectApplication,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterAction !== 'ALL' && !log.action.toLowerCase().includes(filterAction.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.applicationNumber.toLowerCase().includes(q) ||
          log.citizenName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filterAction, searchQuery]);

  return (
    <section aria-label="Nhật ký hoạt động của cán bộ" className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-800">
              <ClockCounterClockwise size={24} weight="bold" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-950">Lịch sử xử lý trong ca trực</h3>
              <p className="text-xs text-slate-500">Toàn bộ thao tác tiếp nhận, đánh giá, góp ý và phê duyệt của cán bộ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hồ sơ, tên công dân..."
                className="w-56 rounded-xl border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-red-600 focus:outline-none"
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-xl border border-slate-300 py-1.5 px-3 text-xs bg-white text-slate-800"
            >
              <option value="ALL">Mọi hành động</option>
              <option value="Nhận xử lý">Nhận xử lý</option>
              <option value="Ghi chú">Ghi chú / Comment</option>
              <option value="Yêu cầu">Yêu cầu bổ sung</option>
              <option value="Phê duyệt">Phê duyệt</option>
              <option value="Tiếp nhận">Tiếp nhận tại quầy</option>
            </select>
          </div>
        </div>
      </header>

      {/* Semantic Audit Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-4 py-3.5">Mã hồ sơ</th>
                <th className="px-4 py-3.5">Công dân</th>
                <th className="px-4 py-3.5">Hành động nghiệp vụ</th>
                <th className="px-4 py-3.5">Chi tiết thao tác</th>
                <th className="px-5 py-3.5 text-right">Cán bộ thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">Chưa có bản ghi lịch sử hoạt động.</p>
                    <p className="text-xs text-slate-400 mt-1 italic">⚠️ API nhật ký thao tác nghiệp vụ sẽ được tích hợp sau.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {log.time}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {onSelectApplication ? (
                        <button
                          type="button"
                          onClick={() => onSelectApplication(log.applicationNumber)}
                          className="hover:text-red-700 hover:underline"
                        >
                          {log.applicationNumber}
                        </button>
                      ) : (
                        log.applicationNumber
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {log.citizenName}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          log.badgeTone === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.badgeTone === 'warning'
                            ? 'bg-amber-100 text-amber-900'
                            : log.badgeTone === 'danger'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-sm">
                      {log.details}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                      {log.officerName}
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
