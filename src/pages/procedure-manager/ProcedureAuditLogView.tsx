import React, { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { ProcedureAuditLog } from '@/types/procedureManager';
import { mockProcedureAuditLogs } from '@/data/mockProcedureManagerData';

export const ProcedureAuditLogView: React.FC = () => {
  const [logs] = useState<ProcedureAuditLog[]>(mockProcedureAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      searchQuery.trim() === '' ||
      l.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-[-.02em] text-slate-950 sm:text-3xl">
          LỊCH SỬ CẬP NHẬT & KIỂM TOÁN HỆ THỐNG
        </h1>
      </div>

      {/* Filter */}
      <div className="flex admin-card p-3.5">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo người thực hiện, đối tượng, nội dung cập nhật..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="admin-card overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Thời gian</th>
              <th className="px-4 py-3.5">Người thực hiện</th>
              <th className="px-4 py-3.5">Đối tượng</th>
              <th className="px-4 py-3.5">Hành động</th>
              <th className="px-5 py-3.5">Nội dung cập nhật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <p className="font-bold text-slate-900">{log.performedBy}</p>
                  <p className="text-[11px] text-slate-400">{log.performerRole}</p>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-red-900">{log.targetId}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {log.targetName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{log.summary}</p>
                  {log.details && (
                    <p className="mt-0.5 text-[11px] text-slate-500">{log.details}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
