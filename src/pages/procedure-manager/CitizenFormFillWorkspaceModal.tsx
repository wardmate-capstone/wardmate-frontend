import React, { useState } from 'react';
import {
  X,
  FileDoc,
  FilePdf,
  DownloadSimple,
  UploadSimple,
  PencilSimple,
  FloppyDisk,
  CheckCircle,
  Sparkle
} from '@phosphor-icons/react';
import { ProcedureForm } from '@/types/procedureManager';

interface CitizenFormFillWorkspaceModalProps {
  isOpen?: boolean;
  onClose: () => void;
  form: ProcedureForm;
  procedureTitle?: string;
}

export const CitizenFormFillWorkspaceModal: React.FC<CitizenFormFillWorkspaceModalProps> = ({
  isOpen = true,
  onClose,
  form,
  procedureTitle
}) => {
  if (!isOpen) return null;

  const [isEditingOnline, setIsEditingOnline] = useState(true);
  const [isSavedDraft, setIsSavedDraft] = useState(false);
  const [isExportedPdf, setIsExportedPdf] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Editable document state (representing Word content)
  const [maleName, setMaleName] = useState('NGUYỄN VĂN AN');
  const [maleDob, setMaleDob] = useState('15/08/1998');
  const [maleCccd, setMaleCccd] = useState('079098001234');
  const [maleAddress, setMaleAddress] = useState('Số 12 Đường Trần Não, Phường An Khánh, TP. Thủ Đức, TP. Hồ Chí Minh');
  const [femaleName, setFemaleName] = useState('TRẦN THỊ MAI');
  const [femaleDob, setFemaleDob] = useState('20/10/2000');
  const [femaleCccd, setFemaleCccd] = useState('079100005678');
  const [femaleAddress, setFemaleAddress] = useState('Số 45 Đường Lương Định Của, Phường An Khánh, TP. Thủ Đức, TP. Hồ Chí Minh');

  if (!isOpen) return null;

  const handleSaveDraft = () => {
    setIsSavedDraft(true);
    setTimeout(() => setIsSavedDraft(false), 3000);
  };

  const handleExportPdf = () => {
    setIsExportedPdf(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFileName(e.target.files[0].name);
      alert(`Đã nạp file Word chỉnh sửa bên ngoài: ${e.target.files[0].name}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header Bar */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-800">
              <FileDoc size={24} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-950">{form.name}</h3>
                <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-800">
                  {form.currentVersion}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                  Chuẩn tiếp nhận Một cửa
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Thủ tục áp dụng: <strong>{procedureTitle || form.procedureName}</strong> · File gốc: {form.wordFileName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ soạn thảo"
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mở để chỉnh sửa */}
            <button
              type="button"
              onClick={() => setIsEditingOnline(!isEditingOnline)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isEditingOnline
                  ? 'bg-blue-800 text-white shadow-sm'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PencilSimple size={16} />
              <span>{isEditingOnline ? 'Đang mở chỉnh sửa trực tiếp' : 'Mở để chỉnh sửa'}</span>
            </button>

            {/* Lưu bản nháp */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <FloppyDisk size={16} />
              <span>Lưu bản nháp</span>
            </button>

            {/* Tải Word */}
            <button
              type="button"
              onClick={() => {
                alert(`Đang tải xuống tệp ${form.wordFileName}... Bạn có thể chỉnh sửa bằng Microsoft Word hoặc LibreOffice.`);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-blue-900 hover:bg-blue-50"
            >
              <DownloadSimple size={16} />
              <span>Tải file Word (.docx)</span>
            </button>

            {/* Upload lại file đã chỉnh sửa */}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50">
              <UploadSimple size={16} />
              <span>Upload lại file đã sửa</span>
              <input type="file" accept=".doc,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Xuất PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-800 to-red-900 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:from-red-900 hover:to-red-950"
          >
            <FilePdf size={18} weight="fill" className="text-gold-300" />
            <span>Xuất PDF nộp tiền kiểm</span>
          </button>
        </div>

        {/* Feedback banners */}
        {isSavedDraft && (
          <div className="flex items-center gap-2 bg-emerald-50 px-6 py-2 text-xs font-bold text-emerald-800 border-b border-emerald-200">
            <CheckCircle size={16} weight="fill" />
            <span>Đã lưu bản nháp chỉnh sửa thành công vào bộ nhớ tạm của hồ sơ!</span>
          </div>
        )}
        {uploadedFileName && (
          <div className="flex items-center gap-2 bg-blue-50 px-6 py-2 text-xs font-bold text-blue-800 border-b border-blue-200">
            <CheckCircle size={16} weight="fill" />
            <span>Đã nạp file từ máy tính: {uploadedFileName}</span>
          </div>
        )}
        {isExportedPdf && (
          <div className="flex items-center justify-between bg-red-900 px-6 py-2.5 text-xs font-bold text-white">
            <div className="flex items-center gap-2">
              <Sparkle size={18} weight="fill" className="text-gold-300" />
              <span>Đã xuất thành tệp PDF hoàn chỉnh ({form.code}_Banchinh.pdf) sẵn sàng gửi Cán bộ Một cửa tiền kiểm!</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExportedPdf(false)}
              className="text-white/80 hover:text-white"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Modal Body: Word-like Document Canvas (A4 Standard) */}
        <div className="flex-1 overflow-y-auto bg-slate-200/70 p-4 sm:p-8 flex justify-center">
          <div className="w-full max-w-[800px] min-h-[960px] bg-white p-8 sm:p-14 shadow-2xl rounded-sm font-sans text-slate-900 space-y-6">
            {/* National Header */}
            <div className="text-center space-y-1 border-b border-slate-200 pb-5">
              <p className="text-xs font-extrabold tracking-wider uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="text-xs font-bold tracking-widest text-slate-700">Độc lập - Tự do - Hạnh phúc</p>
              <div className="mx-auto w-24 h-0.5 bg-slate-900 mt-1" />
            </div>

            {/* Document Title */}
            <div className="text-center pt-2">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-950">
                {form.name}
              </h2>
              <p className="text-xs font-semibold text-slate-600 italic">
                Kính gửi: Ủy ban nhân dân Phường An Khánh, TP. Thủ Đức, TP. Hồ Chí Minh
              </p>
            </div>

            {/* Editable Form Content */}
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="font-extrabold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  I. THÔNG TIN BÊN NAM
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Họ, chữ đệm, tên:</label>
                    <input
                      type="text"
                      value={maleName}
                      disabled={!isEditingOnline}
                      onChange={(e) => setMaleName(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 font-bold uppercase text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Ngày, tháng, năm sinh:</label>
                    <input
                      type="text"
                      value={maleDob}
                      disabled={!isEditingOnline}
                      onChange={(e) => setMaleDob(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Số Căn cước / CCCD:</label>
                    <input
                      type="text"
                      value={maleCccd}
                      disabled={!isEditingOnline}
                      onChange={(e) => setMaleCccd(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 font-mono text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nơi cư trú thường trú:</label>
                    <input
                      type="text"
                      value={maleAddress}
                      disabled={!isEditingOnline}
                      onChange={(e) => setMaleAddress(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <p className="font-extrabold uppercase text-slate-900 border-b border-slate-200 pb-1">
                  II. THÔNG TIN BÊN NỮ
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Họ, chữ đệm, tên:</label>
                    <input
                      type="text"
                      value={femaleName}
                      disabled={!isEditingOnline}
                      onChange={(e) => setFemaleName(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 font-bold uppercase text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Ngày, tháng, năm sinh:</label>
                    <input
                      type="text"
                      value={femaleDob}
                      disabled={!isEditingOnline}
                      onChange={(e) => setFemaleDob(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Số Căn cước / CCCD:</label>
                    <input
                      type="text"
                      value={femaleCccd}
                      disabled={!isEditingOnline}
                      onChange={(e) => setFemaleCccd(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 font-mono text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Nơi cư trú thường trú:</label>
                    <input
                      type="text"
                      value={femaleAddress}
                      disabled={!isEditingOnline}
                      onChange={(e) => setFemaleAddress(e.target.value)}
                      className="h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-slate-950 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="italic text-slate-600">
                  Chúng tôi cam đoan những lời khai trên đây là hoàn toàn đúng sự thật, việc kết hôn là hoàn toàn tự nguyện, không bị ép buộc, lừa dối và không vi phạm quy định của Luật Hôn nhân và gia đình.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-8 text-center">
                <div>
                  <p className="font-bold uppercase text-slate-900">Bên nam</p>
                  <p className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold text-slate-800 text-sm">
                    {maleName}
                  </div>
                </div>
                <div>
                  <p className="font-bold uppercase text-slate-900">Bên nữ</p>
                  <p className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-center justify-center font-bold text-slate-800 text-sm">
                    {femaleName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex h-14 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 text-xs text-slate-500">
          <span>* Hệ thống hỗ trợ biên tập nội dung Word trực tuyến hoặc tải về chỉnh sửa rồi upload lại.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-700 hover:bg-slate-100"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
