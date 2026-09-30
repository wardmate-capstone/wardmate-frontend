import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Plus,
  DotsThreeVertical,
  Eye,
  PencilSimple,
  ListChecks,
  FileText,
  Scales,
  UploadSimple,
  Prohibit,
  Archive
} from '@phosphor-icons/react';
import { ProcedureItem, ProcedureStatus } from '@/types/procedureManager';
import { mockProcedures, mockProcedureCategories } from '@/data/mockProcedureManagerData';

interface ProcedureListViewProps {
  onSelectProcedure: (procedure: ProcedureItem) => void;
  onOpenCreateWizard: () => void;
  onEditProcedure: (procedure: ProcedureItem) => void;
}

export const ProcedureListView: React.FC<ProcedureListViewProps> = ({
  onSelectProcedure,
  onOpenCreateWizard,
  onEditProcedure
}) => {
  const [procedures, setProcedures] = useState<ProcedureItem[]>(mockProcedures);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter logic
  const filteredProcedures = useMemo(() => {
    return procedures.filter((p) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      const matchStatus =
        selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [procedures, searchQuery, selectedCategory, selectedStatus]);

  // Action handlers
  const handleTogglePublish = (id: string, currentStatus: ProcedureStatus) => {
    setProcedures(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newStatus: ProcedureStatus = currentStatus === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
          return { ...p, status: newStatus, updatedAt: 'Hôm nay' };
        }
        return p;
      })
    );
    setActiveMenuId(null);
  };

  const handleArchive = (id: string) => {
    if (window.confirm('Bạn có chắc muốn lưu trữ thủ tục này? Thủ tục sẽ không còn xuất hiện trong danh sách phục vụ người dân.')) {
      setProcedures(prev =>
        prev.map(p => (p.id === id ? { ...p, status: 'ARCHIVED', updatedAt: 'Hôm nay' } : p))
      );
    }
    setActiveMenuId(null);
  };

  const getStatusBadge = (status: ProcedureStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            Đang công khai
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            <span className="size-1.5 rounded-full bg-amber-600" />
            Bản nháp
          </span>
        );
      case 'UNPUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
            <span className="size-1.5 rounded-full bg-rose-600" />
            Ngừng công khai
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <span className="size-1.5 rounded-full bg-slate-500" />
            Đã lưu trữ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-[-.02em] text-slate-950 sm:text-3xl">
            QUẢN LÝ THỦ TỤC HÀNH CHÍNH
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenCreateWizard}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-transform hover:shadow hover:brightness-105"
        >
          <Plus size={18} weight="bold" />
          <span>+ Thêm thủ tục</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 admin-card p-4 lg:flex-row lg:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên hoặc mã thủ tục..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 sm:text-sm"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Danh mục:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
            >
              <option value="ALL">Tất cả danh mục</option>
              {mockProcedureCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-red-500 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đang công khai</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="UNPUBLISHED">Ngừng công khai</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-card overflow-hidden">
        <div className="admin-table-wrap">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3.5 sm:px-6">Mã thủ tục</th>
                <th className="px-4 py-3.5">Tên thủ tục</th>
                <th className="px-4 py-3.5">Danh mục</th>
                <th className="px-4 py-3.5 text-center">Phiên bản</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Cập nhật</th>
                <th className="px-4 py-3.5 text-right sm:px-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProcedures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy thủ tục nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredProcedures.map((proc) => (
                  <tr
                    key={proc.id}
                    className="group transition-colors hover:bg-red-50/40"
                  >
                    {/* Mã */}
                    <td className="px-4 py-4 font-mono font-bold text-red-900 sm:px-6">
                      {proc.code}
                    </td>

                    {/* Tên */}
                    <td className="px-4 py-4 max-w-xs sm:max-w-md">
                      <button
                        type="button"
                        onClick={() => onSelectProcedure(proc)}
                        className="text-left font-bold text-slate-950 hover:text-red-800 hover:underline"
                      >
                        {proc.title}
                      </button>
                    </td>

                    {/* Danh mục */}
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-700">
                      {proc.categoryName}
                    </td>

                    {/* Phiên bản */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800">
                        {proc.version}
                      </span>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(proc.status)}
                    </td>

                    {/* Cập nhật */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      {proc.updatedAt}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-4 text-right whitespace-nowrap sm:px-6">
                      <div className="relative inline-flex items-center gap-1.5">
                        {/* Quick View Button */}
                        <button
                          type="button"
                          onClick={() => onSelectProcedure(proc)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-red-100 hover:text-red-900"
                          title="Xem chi tiết thủ tục"
                        >
                          <Eye size={16} />
                          <span className="hidden md:inline">Chi tiết</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onEditProcedure(proc)}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-red-100 hover:text-red-900"
                          title="Chỉnh sửa thủ tục"
                        >
                          <PencilSimple size={16} />
                        </button>

                        {/* More Action Popover Toggle */}
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === proc.id ? null : proc.id)}
                          className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-200"
                          aria-label="Thao tác khác"
                        >
                          <DotsThreeVertical size={18} weight="bold" />
                        </button>

                        {/* Context Menu Dropdown */}
                        {activeMenuId === proc.id && (
                          <div
                            className="absolute right-0 top-10 z-20 w-52 admin-card p-2 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProcedure(proc);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-900"
                            >
                              <Eye size={16} />
                              <span>Xem chi tiết</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onEditProcedure(proc);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-900"
                            >
                              <PencilSimple size={16} />
                              <span>Chỉnh sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProcedure(proc);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-900"
                            >
                              <ListChecks size={16} />
                              <span>Quản lý Checklist</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProcedure(proc);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-900"
                            >
                              <FileText size={16} />
                              <span>Quản lý biểu mẫu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectProcedure(proc);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-red-50 hover:text-red-900"
                            >
                              <Scales size={16} />
                              <span>Quản lý văn bản pháp lý</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            {/* Publish / Unpublish */}
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(proc.id, proc.status)}
                              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                                proc.status === 'PUBLISHED'
                                  ? 'text-rose-700 hover:bg-rose-50'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {proc.status === 'PUBLISHED' ? (
                                <>
                                  <Prohibit size={16} />
                                  <span>Ngừng công khai</span>
                                </>
                              ) : (
                                <>
                                  <UploadSimple size={16} />
                                  <span>Xuất bản công khai</span>
                                </>
                              )}
                            </button>

                            {/* Archive */}
                            {proc.status !== 'ARCHIVED' && (
                              <button
                                type="button"
                                onClick={() => handleArchive(proc.id)}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-100"
                              >
                                <Archive size={16} />
                                <span>Lưu trữ thủ tục</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:px-6">
          <p>
            Hiển thị <strong className="text-slate-900">{filteredProcedures.length}</strong> / {procedures.length} thủ tục
          </p>
        </div>
      </div>
    </div>
  );
};
