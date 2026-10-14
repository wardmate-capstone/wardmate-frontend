import { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  MagnifyingGlass,
  ArrowsClockwise,
  UploadSimple,
  DownloadSimple,
  CheckCircle,
  WarningCircle,
  XCircle,
  Eye,
} from '@phosphor-icons/react';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  getFormTemplates,
  getFormTemplateById,
  createFormTemplate,
  uploadFormTemplateDocx,
  downloadFormTemplateDocx,
  triggerFileDownload,
  formTemplateErrorMessage,
  type FormTemplateDto,
  type FormTemplateDetailDto,
} from '@/lib/api/formTemplates';

export function FormsView() {
  const [items, setItems] = useState<FormTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchCode, setSearchCode] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [uploadTarget, setUploadTarget] = useState<FormTemplateDto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  const [detailTarget, setDetailTarget] = useState<FormTemplateDetailDto | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFormTemplates({
        page,
        pageSize,
        searchCode: searchCode.trim() || undefined,
        isActive: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
      });
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (error) {
      toast.error(formTemplateErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchCode, activeFilter]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void loadTemplates();
  };

  // Handle Create Template
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCode.trim() || !createTitle.trim()) {
      toast.error('Vui lòng nhập đầy đủ Mã biểu mẫu và Tên biểu mẫu.');
      return;
    }
    setCreateSubmitting(true);
    try {
      const newTemplate = await createFormTemplate({
        code: createCode,
        title: createTitle,
      });
      toast.success(`Đã tạo biểu mẫu "${newTemplate.code}" thành công.`);
      setIsCreateOpen(false);
      setCreateCode('');
      setCreateTitle('');
      void loadTemplates();
      // Open upload modal immediately for convenience
      setUploadTarget(newTemplate);
    } catch (error) {
      toast.error(formTemplateErrorMessage(error));
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Upload DOCX
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTarget || !selectedFile) {
      toast.error('Vui lòng chọn tệp Word (.docx) cần tải lên.');
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
      toast.error('Chỉ chấp nhận tệp định dạng Word (.docx).');
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error('Kích thước tệp không được vượt quá 20MB.');
      return;
    }

    setUploadSubmitting(true);
    try {
      await uploadFormTemplateDocx(uploadTarget.id, selectedFile);
      toast.success(`Đã tải lên tệp phôi Word cho biểu mẫu "${uploadTarget.code}" thành công.`);
      setUploadTarget(null);
      setSelectedFile(null);
      void loadTemplates();
    } catch (error) {
      toast.error(formTemplateErrorMessage(error));
    } finally {
      setUploadSubmitting(false);
    }
  };

  // Handle Download DOCX
  const handleDownload = async (item: FormTemplateDto) => {
    if (!item.fileDocxUrl) {
      toast.warning('Biểu mẫu này chưa có tệp Word đính kèm.');
      return;
    }
    setDownloadingId(item.id);
    try {
      const { blob, fileName } = await downloadFormTemplateDocx(item.id);
      triggerFileDownload(blob, fileName || `${item.code}.docx`);
      toast.success(`Đã tải tệp "${fileName || item.code + '.docx'}" thành công.`);
    } catch (error) {
      toast.error(formTemplateErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle View Detail
  const handleViewDetail = async (id: string) => {
    try {
      const detail = await getFormTemplateById(id);
      setDetailTarget(detail);
    } catch (error) {
      toast.error(formTemplateErrorMessage(error));
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header and Action Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText size={24} weight="duotone" />
            </span>
            Kho Phôi Biểu Mẫu Điện Tử
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý phôi mẫu Word (.docx), tạo mới và cung cấp mẫu tờ khai trực tuyến cho người dân.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadTemplates()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <ArrowsClockwise size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} weight="bold" />
            Tạo phôi mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Tìm theo mã biểu mẫu (ví dụ: DON_01)..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </form>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase text-slate-400">Trạng thái:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-medium">
            <button
              type="button"
              onClick={() => { setActiveFilter('ALL'); setPage(1); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilter('ACTIVE'); setPage(1); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đang hoạt động
            </button>
            <button
              type="button"
              onClick={() => { setActiveFilter('INACTIVE'); setPage(1); }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeFilter === 'INACTIVE' ? 'bg-white text-rose-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ngừng hoạt động
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">Mã biểu mẫu</th>
                <th scope="col" className="px-6 py-3.5">Tên biểu mẫu</th>
                <th scope="col" className="px-6 py-3.5">Tệp phôi (.docx)</th>
                <th scope="col" className="px-6 py-3.5">Trạng thái</th>
                <th scope="col" className="px-6 py-3.5">Ngày tạo</th>
                <th scope="col" className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <ArrowsClockwise size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách biểu mẫu...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                    Không tìm thấy biểu mẫu nào phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 max-w-xs truncate" title={item.title}>
                      {item.title}
                    </td>
                    <td className="px-6 py-4">
                      {item.fileDocxUrl ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle size={14} weight="fill" />
                          <span>Đã có tệp DOCX</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <WarningCircle size={14} weight="fill" />
                          <span>Chưa có tệp</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.isActive ? (
                        <Badge variant="success">Hoạt động</Badge>
                      ) : (
                        <Badge variant="neutral">Tạm dừng</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.createdAtUtc).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(item.id)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadTarget(item)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Tải lên / Thay thế file DOCX"
                        >
                          <UploadSimple size={18} />
                        </button>
                        {item.fileDocxUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            disabled={downloadingId === item.id}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Tải về file DOCX"
                          >
                            <DownloadSimple size={18} className={downloadingId === item.id ? 'animate-bounce' : ''} />
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

        {/* Pagination Footer */}
        {!loading && totalCount > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <div>
              Hiển thị <strong>{items.length}</strong> trên tổng số <strong>{totalCount}</strong> biểu mẫu
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Trang trước
              </button>
              <span className="font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Tạo mới biểu mẫu */}
      <Modal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Tạo mới phôi biểu mẫu"
        description="Khởi tạo mã và tên phôi biểu mẫu hành chính trước khi tải file Word lên."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã biểu mẫu (Code) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value)}
              placeholder="VD: DON_XAC_NHAN_CU_TRU"
              className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              Mã duy nhất, tối đa 50 ký tự, viết hoa không dấu.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên biểu mẫu (Title) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="VD: Đơn xin xác nhận thông tin về cư trú"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {createSubmitting ? <ArrowsClockwise size={16} className="animate-spin" /> : <Plus size={16} />}
              Tạo biểu mẫu
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Upload File Word DOCX */}
      <Modal
        open={!!uploadTarget}
        onOpenChange={(open) => { if (!open) { setUploadTarget(null); setSelectedFile(null); } }}
        title={`Tải lên tệp Word cho [${uploadTarget?.code || ''}]`}
        description="Tải lên tệp Word mẫu gốc (.docx). Hệ thống sẽ lưu trữ và cung cấp cho người dân tải về điền trực tuyến."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
            <p className="font-semibold text-slate-700">Tiêu đề: {uploadTarget?.title}</p>
            <p className="text-slate-500">
              Trạng thái hiện tại:{' '}
              {uploadTarget?.fileDocxUrl ? (
                <span className="text-emerald-700 font-medium">Đã có tệp (tải lên tệp mới sẽ ghi đè)</span>
              ) : (
                <span className="text-amber-700 font-medium">Chưa có tệp</span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Chọn tệp Word (.docx) <span className="text-rose-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 text-center transition-colors">
              <UploadSimple size={32} className="mx-auto text-slate-400 mb-2" />
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className="inline-block px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors"
              >
                Chọn tệp từ máy tính
              </label>
              {selectedFile ? (
                <div className="mt-3 text-xs text-slate-700 font-medium flex items-center justify-center gap-1.5">
                  <FileText size={16} className="text-indigo-600" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Định dạng hỗ trợ: .docx (Tối đa 20MB, không chứa Macro)</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setUploadTarget(null); setSelectedFile(null); }}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={uploadSubmitting || !selectedFile}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {uploadSubmitting ? <ArrowsClockwise size={16} className="animate-spin" /> : <UploadSimple size={16} />}
              Tải lên ngay
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Xem chi tiết biểu mẫu */}
      <Modal
        open={!!detailTarget}
        onOpenChange={(open) => { if (!open) setDetailTarget(null); }}
        title={`Chi tiết biểu mẫu: ${detailTarget?.code || ''}`}
      >
        {detailTarget && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 block">Mã biểu mẫu:</span>
                <strong className="font-mono text-slate-800">{detailTarget.code}</strong>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Sẵn sàng điền trực tuyến:</span>
                {detailTarget.onlineReady ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" /> Online Ready
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <XCircle size={16} weight="fill" /> Chưa sẵn sàng
                  </span>
                )}
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400 block">Tên biểu mẫu:</span>
                <span className="font-medium text-slate-800">{detailTarget.title}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400 block">Đường dẫn tệp Azure Blob:</span>
                {detailTarget.fileDocxUrl ? (
                  <span className="text-xs font-mono text-indigo-600 break-all">{detailTarget.fileDocxUrl}</span>
                ) : (
                  <span className="text-xs italic text-slate-400">Chưa có tệp</span>
                )}
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Ngày tạo:</span>
                <span className="text-slate-700 text-xs">{new Date(detailTarget.createdAtUtc).toLocaleString('vi-VN')}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Cập nhật lần cuối:</span>
                <span className="text-slate-700 text-xs">
                  {detailTarget.updatedAtUtc ? new Date(detailTarget.updatedAtUtc).toLocaleString('vi-VN') : '—'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {detailTarget.fileDocxUrl && (
                <button
                  type="button"
                  onClick={() => handleDownload(detailTarget)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <DownloadSimple size={16} /> Tải file Word
                </button>
              )}
              <button
                type="button"
                onClick={() => setDetailTarget(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
