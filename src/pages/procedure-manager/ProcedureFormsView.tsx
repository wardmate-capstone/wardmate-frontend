import React, { useState, useEffect } from 'react';
import {
  ClockCounterClockwise,
  Plus,
  DownloadSimple,
  CheckCircle,
  FilePdf,
  FileDoc,
  Archive,
  Prohibit,
  Eye,
  MagnifyingGlass
} from '@phosphor-icons/react';
import { ProcedureForm, FormStatus } from '@/types/procedureManager';
import { mockForms, mockProcedures } from '@/data/mockProcedureManagerData';
import { CitizenFormFillWorkspaceModal } from './CitizenFormFillWorkspaceModal';

interface ProcedureFormsViewProps {
  initialMode?: 'list' | 'upload' | 'versions' | 'attach';
}

export const ProcedureFormsView: React.FC<ProcedureFormsViewProps> = ({
  initialMode = 'list'
}) => {
  const [forms, setForms] = useState<ProcedureForm[]>(mockForms);
  const [viewMode, setViewMode] = useState<'list' | 'upload' | 'versions' | 'attach'>(initialMode);

  useEffect(() => {
    setViewMode(initialMode);
  }, [initialMode]);
  const [selectedForm, setSelectedForm] = useState<ProcedureForm>(mockForms[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Citizen modal preview
  const [isCitizenModalOpen, setIsCitizenModalOpen] = useState(false);
  const [citizenPreviewForm, setCitizenPreviewForm] = useState<ProcedureForm>(mockForms[0]);

  // Upload / Create Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadCode, setUploadCode] = useState('');
  const [uploadProcedureId, setUploadProcedureId] = useState(mockProcedures[0].id);
  const [uploadVersion, setUploadVersion] = useState('V1');
  const [uploadEffectiveDate, setUploadEffectiveDate] = useState('01/10/2026');
  const [uploadExpirationDate, setUploadExpirationDate] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadWordFile, setUploadWordFile] = useState<string | null>(null);
  const [uploadPdfFile, setUploadPdfFile] = useState<string | null>(null);
  const [uploadSampleFile, setUploadSampleFile] = useState<string | null>(null);

  // Filtered forms for list
  const filteredForms = forms.filter((f) => {
    return (
      searchQuery.trim() === '' ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.procedureName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateForm = (publishDirectly: boolean) => {
    if (!uploadName.trim() || !uploadCode.trim()) {
      alert('Vui lòng nhập tên và mã biểu mẫu.');
      return;
    }

    const matchedProc = mockProcedures.find(p => p.id === uploadProcedureId);

    const newForm: ProcedureForm = {
      id: `form_${Date.now()}`,
      code: uploadCode.trim().toUpperCase(),
      name: uploadName.trim(),
      procedureId: uploadProcedureId,
      procedureName: matchedProc?.title || 'Thủ tục hành chính',
      currentVersion: uploadVersion.trim() || 'V1',
      fileType: uploadPdfFile ? 'BOTH' : 'WORD',
      effectiveDate: uploadEffectiveDate,
      expirationDate: uploadExpirationDate,
      status: publishDirectly ? 'PUBLISHED' : 'DRAFT',
      updatedAt: 'Hôm nay',
      description: uploadDescription,
      wordFileName: uploadWordFile || `${uploadCode.trim()}_Mau.docx`,
      pdfFileName: uploadPdfFile || undefined,
      sampleFilledFileName: uploadSampleFile || undefined,
      fileSize: '150 KB',
      versions: [
        {
          version: uploadVersion.trim() || 'V1',
          status: publishDirectly ? 'PUBLISHED' : 'DRAFT',
          effectiveDate: uploadEffectiveDate,
          createdBy: 'Lê Hoàng Nam',
          createdAt: 'Hôm nay',
          changeLog: 'Tải lên biểu mẫu phiên bản ban đầu.',
          wordFileName: uploadWordFile || `${uploadCode.trim()}_Mau.docx`,
          pdfFileName: uploadPdfFile || undefined,
          sampleFilledFileName: uploadSampleFile || undefined,
          fileSize: '150 KB'
        }
      ]
    };

    setForms([newForm, ...forms]);
    setSelectedForm(newForm);
    setViewMode('list');
    alert(`Đã lưu biểu mẫu ${newForm.code} (${publishDirectly ? 'Đang công khai' : 'Bản nháp'}).`);
  };

  const handleToggleStatus = (formId: string, currentStatus: FormStatus) => {
    const nextStatus: FormStatus = currentStatus === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    setForms(prev =>
      prev.map(f => (f.id === formId ? { ...f, status: nextStatus, updatedAt: 'Hôm nay' } : f))
    );
    if (selectedForm.id === formId) {
      setSelectedForm(prev => ({ ...prev, status: nextStatus, updatedAt: 'Hôm nay' }));
    }
  };

  const handleArchive = (formId: string) => {
    if (window.confirm('Bạn có chắc muốn lưu trữ biểu mẫu này? Biểu mẫu sẽ chuyển sang ARCHIVED và không bị xóa cứng để bảo đảm lịch sử hồ sơ.')) {
      setForms(prev =>
        prev.map(f => (f.id === formId ? { ...f, status: 'ARCHIVED', updatedAt: 'Hôm nay' } : f))
      );
    }
  };

  const handleSetCurrentVersion = (ver: string) => {
    const updatedVersions = selectedForm.versions.map(v => ({
      ...v,
      status: (v.version === ver ? 'PUBLISHED' : 'ARCHIVED') as FormStatus
    }));

    const updated = {
      ...selectedForm,
      currentVersion: ver,
      versions: updatedVersions,
      updatedAt: 'Hôm nay'
    };

    setForms(forms.map(f => f.id === selectedForm.id ? updated : f));
    setSelectedForm(updated);
    alert(`Đã đặt phiên bản ${ver} làm phiên bản hiện hành.`);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-[-.02em] text-slate-950 sm:text-3xl">
            QUẢN LÝ BIỂU MẪU CHUẨN (FORM MANAGEMENT)
          </h1>
        </div>

        {/* 4-Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Danh sách biểu mẫu
          </button>
          <button
            type="button"
            onClick={() => setViewMode('upload')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'upload' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            + Upload biểu mẫu
          </button>
          <button
            type="button"
            onClick={() => setViewMode('versions')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'versions' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Phiên bản biểu mẫu
          </button>
          <button
            type="button"
            onClick={() => setViewMode('attach')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === 'attach' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Gắn vào thủ tục
          </button>
        </div>
      </div>

      {/* VIEW 1: DANH SÁCH BIỂU MẪU */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="flex admin-card p-3.5">
            <div className="relative flex-1">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã, tên biểu mẫu hoặc thủ tục..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Forms Table */}
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrap">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3.5">Mã biểu mẫu</th>
                    <th className="px-4 py-3.5">Tên biểu mẫu</th>
                    <th className="px-4 py-3.5">Thủ tục áp dụng</th>
                    <th className="px-4 py-3.5 text-center">Phiên bản</th>
                    <th className="px-4 py-3.5">Loại file</th>
                    <th className="px-4 py-3.5">Ngày hiệu lực</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5">Cập nhật gần nhất</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredForms.map((form) => (
                    <tr key={form.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-mono font-bold text-red-900 whitespace-nowrap">
                        {form.code}
                      </td>
                      <td className="px-4 py-4 max-w-xs sm:max-w-sm">
                        <p className="font-bold text-slate-950">{form.name}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{form.wordFileName}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-700">
                        {form.procedureName}
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-800">
                          {form.currentVersion}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                            <FileDoc size={14} weight="fill" /> Word
                          </span>
                          {form.pdfFileName && (
                            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                              <FilePdf size={14} weight="fill" /> PDF
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                        {form.effectiveDate}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {form.status === 'PUBLISHED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-600" />
                            Đang sử dụng
                          </span>
                        )}
                        {form.status === 'DRAFT' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                            <span className="size-1.5 rounded-full bg-amber-600" />
                            Bản nháp
                          </span>
                        )}
                        {form.status === 'UNPUBLISHED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                            <span className="size-1.5 rounded-full bg-rose-600" />
                            Ngừng sử dụng
                          </span>
                        )}
                        {form.status === 'ARCHIVED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            Đã lưu trữ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                        {form.updatedAt}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Xem / Mở Editor Công dân */}
                          <button
                            type="button"
                            onClick={() => {
                              setCitizenPreviewForm(form);
                              setIsCitizenModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-800 hover:bg-blue-100"
                            title="Mở xem trước & biên tập trực tiếp"
                          >
                            <Eye size={15} />
                            <span>Mở soạn thảo (Citizen Editor)</span>
                          </button>

                          {/* Tải file */}
                          <button
                            type="button"
                            onClick={() => alert(`Đang tải file ${form.wordFileName}...`)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title="Tải file Word"
                          >
                            <DownloadSimple size={16} />
                          </button>

                          {/* Chi tiết phiên bản */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedForm(form);
                              setViewMode('versions');
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title="Lịch sử phiên bản"
                          >
                            <ClockCounterClockwise size={16} />
                          </button>

                          {/* Ngừng sử dụng / Kích hoạt */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(form.id, form.status)}
                            className={`p-1.5 rounded-lg ${
                              form.status === 'PUBLISHED'
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={form.status === 'PUBLISHED' ? 'Ngừng sử dụng' : 'Xuất bản sử dụng'}
                          >
                            {form.status === 'PUBLISHED' ? <Prohibit size={16} /> : <CheckCircle size={16} />}
                          </button>

                          {/* Lưu trữ */}
                          <button
                            type="button"
                            onClick={() => handleArchive(form.id)}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg"
                            title="Lưu trữ biểu mẫu"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: UPLOAD / TẠO MỚI BIỂU MẪU */}
      {viewMode === 'upload' && (
        <div className="admin-card p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-950">
              UPLOAD / TẠO MỚI BIỂU MẪU CHUẨN
            </h3>
            <p className="text-xs text-slate-500">
              Chọn tệp Word (.doc/.docx) hoặc PDF để gắn vào thủ tục.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Tên biểu mẫu *</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="VD: Tờ khai đăng ký khai sinh"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Mã biểu mẫu *</label>
                <input
                  type="text"
                  required
                  value={uploadCode}
                  onChange={(e) => setUploadCode(e.target.value)}
                  placeholder="VD: BM-HT-03"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Thủ tục áp dụng *</label>
                <select
                  value={uploadProcedureId}
                  onChange={(e) => setUploadProcedureId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  {mockProcedures.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Phiên bản *</label>
                <input
                  type="text"
                  required
                  value={uploadVersion}
                  onChange={(e) => setUploadVersion(e.target.value)}
                  placeholder="V1, V2, V3..."
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Ngày hiệu lực *</label>
                <input
                  type="text"
                  required
                  value={uploadEffectiveDate}
                  onChange={(e) => setUploadEffectiveDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Ngày hết hiệu lực (nếu có)</label>
                <input
                  type="text"
                  value={uploadExpirationDate}
                  onChange={(e) => setUploadExpirationDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Mô tả biểu mẫu</label>
              <textarea
                rows={2}
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Mô tả phạm vi sử dụng, thông tư hướng dẫn ban hành..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            {/* File Upload Dropzones */}
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              {/* File Word */}
              <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5 text-center space-y-2">
                <FileDoc size={32} className="mx-auto text-blue-700" weight="fill" />
                <p className="text-xs font-bold text-slate-900">File Word (.doc/.docx) *</p>
                <p className="text-[11px] text-slate-500">Mẫu chuẩn để công dân biên tập</p>
                <label className="inline-flex cursor-pointer rounded-xl bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800">
                  <span>{uploadWordFile || 'Chọn tệp Word'}</span>
                  <input
                    type="file"
                    accept=".doc,.docx"
                    onChange={(e) => e.target.files?.[0] && setUploadWordFile(e.target.files[0].name)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* File PDF */}
              <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/40 p-5 text-center space-y-2">
                <FilePdf size={32} className="mx-auto text-red-700" weight="fill" />
                <p className="text-xs font-bold text-slate-900">File PDF mẫu (nếu có)</p>
                <p className="text-[11px] text-slate-500">Bản in mẫu trống chuẩn</p>
                <label className="inline-flex cursor-pointer rounded-xl bg-red-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-900">
                  <span>{uploadPdfFile || 'Chọn tệp PDF'}</span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && setUploadPdfFile(e.target.files[0].name)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* File Mẫu minh họa */}
              <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center space-y-2">
                <CheckCircle size={32} className="mx-auto text-emerald-700" weight="fill" />
                <p className="text-xs font-bold text-slate-900">Mẫu điền minh họa (nếu có)</p>
                <p className="text-[11px] text-slate-500">Hướng dẫn công dân điền chữ</p>
                <label className="inline-flex cursor-pointer rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800">
                  <span>{uploadSampleFile || 'Chọn mẫu điền'}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.jpg,.png"
                    onChange={(e) => e.target.files?.[0] && setUploadSampleFile(e.target.files[0].name)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleCreateForm(false)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                Lưu bản nháp
              </button>
              <button
                type="button"
                onClick={() => handleCreateForm(true)}
                className="rounded-xl bg-red-800 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-900"
              >
                Xuất bản sử dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CHI TIẾT BIỂU MẪU & LỊCH SỬ PHIÊN BẢN */}
      {viewMode === 'versions' && (
        <div className="admin-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-900">{selectedForm.code}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                  {selectedForm.currentVersion}
                </span>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  {selectedForm.status === 'PUBLISHED' ? 'Đang áp dụng' : 'Bản nháp'}
                </span>
              </div>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">{selectedForm.name}</h3>
              <p className="text-xs text-slate-500">
                Thủ tục áp dụng: <strong>{selectedForm.procedureName}</strong> · Ngày hiệu lực: {selectedForm.effectiveDate}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCitizenPreviewForm(selectedForm);
                  setIsCitizenModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-900"
              >
                <Eye size={16} />
                <span>Xem giao diện điền</span>
              </button>
              <button
                type="button"
                onClick={() => alert(`Tải về ${selectedForm.wordFileName}`)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <DownloadSimple size={16} />
                <span>Tải Word</span>
              </button>
            </div>
          </div>

          {/* Files Card */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">File Word chuẩn (.docx)</p>
              <p className="mt-1 text-sm font-bold text-slate-900 truncate">{selectedForm.wordFileName}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">File PDF mẫu</p>
              <p className="mt-1 text-sm font-bold text-slate-900 truncate">{selectedForm.pdfFileName || 'Không có'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">File mẫu minh họa</p>
              <p className="mt-1 text-sm font-bold text-slate-900 truncate">{selectedForm.sampleFilledFileName || 'Không có'}</p>
            </div>
          </div>

          {/* Version History List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-base font-bold text-slate-950">
              Lịch sử các phiên bản biểu mẫu (Không xóa cứng phiên bản cũ)
            </h4>

            <div className="space-y-3">
              {selectedForm.versions.map((ver) => {
                const isCurrent = ver.version === selectedForm.currentVersion;
                return (
                  <div
                    key={ver.version}
                    className={`rounded-xl border p-5 transition-all ${
                      isCurrent
                        ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-bold text-slate-950">{ver.version}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isCurrent ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isCurrent ? '● Phiên bản hiện hành' : 'Đã lưu trữ'}
                        </span>
                        <span className="text-xs text-slate-500">
                          Hiệu lực: {ver.effectiveDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSetCurrentVersion(ver.version)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            Đặt làm hiện hành
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => alert(`Tải xuống phiên bản lịch sử ${ver.version}`)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          Tải file {ver.version}
                        </button>
                      </div>
                    </div>

                    <p className="mt-2 text-xs font-semibold text-slate-800">
                      Ghi chú: {ver.changeLog}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Người tạo: {ver.createdBy} · Ngày tạo: {ver.createdAt}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: GẮN BIỂU MẪU VÀO THỦ TỤC */}
      {viewMode === 'attach' && (
        <div className="admin-card p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-950">
              GẮN BIỂU MẪU VÀO THỦ TỤC HÀNH CHÍNH
            </h3>
            <p className="text-xs text-slate-500">
              Thiết lập liên kết biểu mẫu bắt buộc áp dụng cho từng thủ tục. Khi công dân chọn thủ tục, hệ thống sẽ tự động hiển thị các biểu mẫu này.
            </p>
          </div>

          <div className="space-y-4">
            {mockProcedures.map((proc) => (
              <div key={proc.id} className="rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-900">{proc.code}</span>
                    <h4 className="text-sm font-bold text-slate-950">{proc.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Lĩnh vực: <strong>{proc.categoryName}</strong>
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-700">Biểu mẫu gắn kèm hiện tại:</p>
                  {forms.filter(f => f.procedureId === proc.id).length === 0 ? (
                    <p className="text-xs text-amber-700 italic">Chưa gắn biểu mẫu nào vào thủ tục này.</p>
                  ) : (
                    forms.filter(f => f.procedureId === proc.id).map(f => (
                      <div key={f.id} className="flex items-center justify-between text-xs bg-white rounded-lg p-2 border border-slate-200">
                        <span className="font-semibold text-slate-900">
                          {f.code} - {f.name} ({f.currentVersion})
                        </span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          {f.wordFileName}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadProcedureId(proc.id);
                      setViewMode('upload');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 hover:underline"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Upload & Gắn biểu mẫu mới cho thủ tục này</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citizen Form Workspace Interactive Modal */}
      <CitizenFormFillWorkspaceModal
        isOpen={isCitizenModalOpen}
        onClose={() => setIsCitizenModalOpen(false)}
        form={citizenPreviewForm}
      />
    </div>
  );
};
