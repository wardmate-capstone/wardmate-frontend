import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  FileText,
  ChatText,
  QrCode,
  DownloadSimple,
  Printer,
  Eye,
  Check,
  X,
  Clock,
  User,
  ShieldCheck,
  ListChecks,
  Files,
  FileCode,
  ArrowsCounterClockwise,
  Sparkle,
  Trash,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import type { Application, ApplicationStatus } from '@/types/application';
import { ApplicationStatusBadge } from '@/components/common/ApplicationStatusBadge';
import { toast } from 'sonner';

interface OfficerReviewWorkspaceProps {
  application: Application;
  onBack: () => void;
  onUpdateStatus: (
    applicationId: string,
    newStatus: ApplicationStatus,
    options?: {
      revisionNote?: string;
      internalNote?: string;
      generatedQr?: string;
    }
  ) => void;
}

type WorkspaceTab =
  | 'citizen'
  | 'eligibility'
  | 'checklist'
  | 'documents'
  | 'eform'
  | 'pdf'
  | 'history';

export const OfficerReviewWorkspace: React.FC<OfficerReviewWorkspaceProps> = ({
  application: initialApp,
  onBack,
  onUpdateStatus,
}) => {
  const [app, setApp] = useState<Application>(initialApp);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('citizen');
  const [activeDocPreview, setActiveDocPreview] = useState<string | null>(null);

  // Modals
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [generalRevisionNote, setGeneralRevisionNote] = useState('');

  // Field Commenting State
  const [editingFieldComment, setEditingFieldComment] = useState<string | null>(null);
  const [fieldCommentInput, setFieldCommentInput] = useState('');

  // Document Commenting State
  const [editingDocComment, setEditingDocComment] = useState<string | null>(null);
  const [docCommentInput, setDocCommentInput] = useState('');

  // Toggle field comment
  const handleSaveFieldComment = (fieldKey: string) => {
    setApp((prev) => ({
      ...prev,
      eformFields: prev.eformFields.map((f) =>
        f.key === fieldKey
          ? {
              ...f,
              officerComment: fieldCommentInput.trim() || undefined,
              status: fieldCommentInput.trim() ? 'error' : 'valid',
            }
          : f
      ),
    }));
    setEditingFieldComment(null);
    setFieldCommentInput('');
    toast.success('Đã lưu nhận xét cho trường dữ liệu.');
  };

  // Delete field comment (FE-16)
  const handleDeleteFieldComment = (fieldKey: string) => {
    setApp((prev) => ({
      ...prev,
      eformFields: prev.eformFields.map((f) =>
        f.key === fieldKey
          ? {
              ...f,
              officerComment: undefined,
              status: 'valid',
            }
          : f
      ),
    }));
    if (editingFieldComment === fieldKey) {
      setEditingFieldComment(null);
      setFieldCommentInput('');
    }
    toast.success('Đã xóa nhận xét của trường dữ liệu.');
  };

  // Toggle checklist item status
  const handleToggleChecklist = (id: string, newStatus: 'ok' | 'warning' | 'missing') => {
    setApp((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
    }));
  };

  // Toggle document valid/invalid
  const handleToggleDocStatus = (docId: string, status: 'valid' | 'invalid') => {
    setApp((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === docId ? { ...d, status } : d)),
    }));
  };

  // Save document comment
  const handleSaveDocComment = (docId: string) => {
    setApp((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              officerComment: docCommentInput.trim() || undefined,
              status: docCommentInput.trim() ? 'invalid' : 'valid',
            }
          : d
      ),
    }));
    setEditingDocComment(null);
    setDocCommentInput('');
    toast.success('Đã lưu nhận xét cho tài liệu.');
  };

  // Delete document comment (FE-16)
  const handleDeleteDocComment = (docId: string) => {
    setApp((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              officerComment: undefined,
              status: 'valid',
            }
          : d
      ),
    }));
    if (editingDocComment === docId) {
      setEditingDocComment(null);
      setDocCommentInput('');
    }
    toast.success('Đã xóa nhận xét của tài liệu.');
  };

  // Collect all comments
  const collectedComments = [
    ...app.eformFields
      .filter((f) => f.officerComment)
      .map((f) => ({ type: 'Trường biểu mẫu', label: f.label, comment: f.officerComment! })),
    ...app.documents
      .filter((d) => d.officerComment)
      .map((d) => ({ type: 'Tài liệu đính kèm', label: d.name, comment: d.officerComment! })),
    ...app.checklist
      .filter((c) => c.status === 'warning' || c.status === 'missing')
      .map((c) => ({
        type: 'Thành phần hồ sơ',
        label: c.name,
        comment: c.status === 'missing' ? 'Chưa nộp đủ giấy tờ' : c.officerNote || 'Cần kiểm tra lại bản gốc',
      })),
  ];

  // Request Revision Action
  const handleConfirmRevision = () => {
    onUpdateStatus(app.id, 'NEED_REVISION', {
      revisionNote: generalRevisionNote,
    });
    setApp((prev) => ({
      ...prev,
      status: 'NEED_REVISION',
    }));
    setIsRevisionModalOpen(false);
    toast.success(`Đã chuyển hồ sơ ${app.applicationNumber} sang trạng thái Cần bổ sung và gửi thông báo tới công dân.`);
  };

  // Approve Action -> Lock and Generate QR
  const handleConfirmApprove = () => {
    const generatedQr = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=WARDMATE-APPROVED-${app.applicationNumber}`;
    onUpdateStatus(app.id, 'APPROVED', {
      generatedQr,
    });
    setApp((prev) => ({
      ...prev,
      status: 'APPROVED',
      qrCodeUrl: generatedQr,
      reviewedAt: new Date().toLocaleString('vi-VN'),
      reviewedBy: 'Lê Thu Hà (Cán bộ Một cửa)',
    }));
    setIsApproveModalOpen(false);
    toast.success(`Đã duyệt tiền kiểm hồ sơ ${app.applicationNumber}. Mã QR đã được tự động kích hoạt!`);
  };

  const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.ElementType; badge?: number }> = [
    { id: 'citizen', label: 'Thông tin công dân', icon: User },
    { id: 'eligibility', label: 'Điều kiện thủ tục', icon: ShieldCheck },
    {
      id: 'checklist',
      label: 'Smart Checklist',
      icon: ListChecks,
      badge: app.checklist.filter((c) => c.status !== 'ok').length || undefined,
    },
    {
      id: 'documents',
      label: 'Tài liệu đính kèm',
      icon: Files,
      badge: app.documents.filter((d) => d.status === 'invalid').length || undefined,
    },
    { id: 'eform', label: 'Kiểm tra E-form', icon: FileCode },
    { id: 'pdf', label: 'Xem trước PDF', icon: FileText },
    {
      id: 'history',
      label: 'Lịch sử & Phiên bản',
      icon: ArrowsCounterClockwise,
      badge: app.revisionHistory.length > 1 ? app.revisionHistory.length : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Workspace Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-base font-extrabold text-red-900 tracking-tight">
                  {app.applicationNumber}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-sm font-bold text-slate-900">{app.procedureName}</span>
                <ApplicationStatusBadge status={app.status} size="md" />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                <span>Công dân: <strong className="text-slate-800">{app.citizen.fullName}</strong> ({app.citizen.citizenId})</span>
                <span>•</span>
                <span>Nộp lúc: <strong>{app.submittedAt}</strong></span>
                {app.reviewStartedAt && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
                      <Clock size={13} /> Bắt đầu tiền kiểm: {app.reviewStartedAt}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsRevisionModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer border border-amber-300 shadow-xs"
            >
              <WarningCircle size={16} weight="bold" />
              <span>Yêu cầu bổ sung ({collectedComments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle size={16} weight="bold" />
              <span>{app.status === 'APPROVED' ? 'Duyệt lại & Cập nhật QR' : 'Duyệt tiền kiểm & Sinh mã QR'}</span>
            </button>

            {app.qrCodeUrl && (
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <QrCode size={16} />
                <span>Xem mã QR</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-red-800 text-red-900 bg-red-50/40 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon size={16} weight={isActive ? 'duotone' : 'regular'} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RESUBMITTED BANNER (FE-17: Kiểm tra lại hồ sơ đã được người dân gửi lại) */}
      {app.status === 'RESUBMITTED' && (
        <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-800 shrink-0 mt-0.5">
              <ArrowsCounterClockwise size={22} weight="bold" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 font-mono">
                  Phiên bản v{app.currentVersion}
                </span>
                <span className="text-xs text-indigo-900 font-bold">
                  Hồ sơ đã được người dân bổ sung và gửi lại
                </span>
              </div>
              <p className="text-xs text-indigo-900/85 mt-1">
                Công dân đã tiếp thu góp ý của cán bộ và cập nhật lại thông tin/tài liệu. Cán bộ vui lòng kiểm tra lại các mục thay đổi trước khi phê duyệt.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-800 hover:bg-indigo-900 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <ArrowsLeftRight size={15} weight="bold" />
            <span>So sánh phiên bản (What changed?)</span>
          </button>
        </div>
      )}

      {/* APPROVED QR PROMINENT BANNER (If Approved) */}
      {app.status === 'APPROVED' && app.qrCodeUrl && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="p-3 bg-white rounded-xl shadow-xs border border-emerald-200 shrink-0 text-center">
            <img src={app.qrCodeUrl} alt="Mã QR hồ sơ đã duyệt" className="size-36 object-contain mx-auto" />
            <span className="text-[10px] font-mono font-bold text-slate-700 mt-1 block">{app.applicationNumber}</span>
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-200/70 text-emerald-900">
              <CheckCircle size={15} weight="fill" /> Đã Duyệt Tiền Kiểm Thành Công
            </div>
            <h3 className="text-lg font-bold text-emerald-950">Mã QR Tiếp Nhận Tại UBND Đã Sẵn Sàng</h3>
            <p className="text-xs text-emerald-900/80 leading-relaxed max-w-2xl">
              Hệ thống đã cấp mã QR định danh cho phiên bản hồ sơ đạt yêu cầu tiền kiểm. Người dân nhận được thông báo mang hồ sơ giấy và xuất trình mã QR này tại bộ phận Một cửa để cán bộ đối chiếu và tiếp nhận chính thức.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
              <a
                href={app.qrCodeUrl}
                download={`QR_${app.applicationNumber}.png`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded-xl hover:bg-emerald-100 shadow-xs transition-colors"
              >
                <DownloadSimple size={15} /> Tải mã QR
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-white border border-emerald-300 rounded-xl hover:bg-emerald-100 shadow-xs transition-colors"
              >
                <Printer size={15} /> In phiếu hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: Citizen Information */}
      {activeTab === 'citizen' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Thông tin nhân thân công dân</h3>
                  <p className="text-xs text-slate-500">Đối chiếu dữ liệu OCR trích xuất từ CCCD và CSDL dân cư</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Khớp CSDL Dân cư 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Họ và tên', value: app.citizen.fullName, key: 'fullName' },
                  { label: 'Ngày tháng năm sinh', value: app.citizen.dateOfBirth, key: 'dob' },
                  { label: 'Số CCCD / Mã định danh', value: app.citizen.citizenId, key: 'citizenId' },
                  { label: 'Giới tính', value: app.citizen.gender, key: 'gender' },
                  { label: 'Số điện thoại', value: app.citizen.phoneNumber, key: 'phone' },
                  { label: 'Hộp thư điện tử', value: app.citizen.email, key: 'email' },
                  { label: 'Dân tộc / Quốc tịch', value: `${app.citizen.ethnicity || 'Kinh'} / ${app.citizen.nationality || 'Việt Nam'}`, key: 'ethnicity' },
                  { label: 'Nơi thường trú', value: app.citizen.permanentAddress, key: 'permanentAddress' },
                ].map((item) => (
                  <div key={item.key} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {item.label}
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Helper */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Sparkle size={16} className="text-amber-500" /> Hướng dẫn tiền kiểm thông tin
              </h3>
              <ul className="space-y-3 text-xs text-slate-600">
                <li className="flex gap-2">
                  <span className="font-bold text-red-800">1.</span>
                  <span>Kiểm tra xem số CCCD 12 số có còn hạn sử dụng hay không.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-red-800">2.</span>
                  <span>Đối chiếu họ tên và ngày sinh với ảnh mặt trước thẻ CCCD đính kèm trong mục Tài liệu.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-red-800">3.</span>
                  <span>Xác nhận địa chỉ thường trú có thuộc địa bàn quản lý của UBND xã/phường để thụ lý.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Eligibility Check */}
      {activeTab === 'eligibility' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Kiểm tra điều kiện thực hiện thủ tục</h3>
              <p className="text-xs text-slate-500">Đối chiếu hồ sơ với các quy định pháp lý bắt buộc</p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Đạt {app.eligibility.filter((e) => e.met).length}/{app.eligibility.length} tiêu chí
            </span>
          </div>

          <div className="space-y-3">
            {app.eligibility.map((criterion, idx) => (
              <div
                key={criterion.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  criterion.met ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={criterion.met}
                    onChange={() => {
                      setApp((prev) => ({
                        ...prev,
                        eligibility: prev.eligibility.map((e) => (e.id === criterion.id ? { ...e, met: !e.met } : e)),
                      }));
                    }}
                    className="size-5 rounded accent-emerald-700 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${criterion.met ? 'text-slate-900' : 'text-rose-900'}`}>
                    {idx + 1}. {criterion.label}
                  </p>
                  {criterion.notes && <p className="text-xs text-slate-500 mt-0.5">{criterion.notes}</p>}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${criterion.met ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                  {criterion.met ? 'Đạt điều kiện' : 'Chưa đạt'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: Smart Checklist */}
      {activeTab === 'checklist' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Thành phần hồ sơ (Smart Checklist)</h3>
              <p className="text-xs text-slate-500">Đánh giá tình trạng đầy đủ của từng loại giấy tờ do công dân nộp</p>
            </div>
          </div>

          <div className="space-y-3">
            {app.checklist.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        item.type === 'mandatory'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.type === 'mandatory' ? 'Bắt buộc' : item.type === 'conditional' ? 'Tùy trường hợp' : 'Không bắt buộc'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                  </div>
                  {item.officerNote && (
                    <p className="text-xs text-amber-800 mt-1 font-medium bg-amber-50 px-2 py-1 rounded-md border border-amber-200 inline-block">
                      Ghi chú: {item.officerNote}
                    </p>
                  )}
                </div>

                {/* Status Toggles */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item.id, 'ok')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      item.status === 'ok'
                        ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✓ Đầy đủ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item.id, 'warning')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      item.status === 'warning'
                        ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚠ Cần kiểm tra
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item.id, 'missing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      item.status === 'missing'
                        ? 'bg-white text-rose-700 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✕ Thiếu
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: Supporting Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tài liệu đính kèm ({app.documents.length})</h3>
                <p className="text-xs text-slate-500">
                  Xem bản chụp/scan tài liệu, kiểm tra độ rõ nét, đánh dấu hợp lệ hoặc gửi nhận xét yêu cầu bổ sung
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {app.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-all shadow-xs ${
                    doc.status === 'valid'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : doc.status === 'invalid'
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Thumbnail preview */}
                    <div
                      className="relative h-44 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden group cursor-pointer"
                      onClick={() => setActiveDocPreview(doc.url)}
                    >
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs">
                        <Eye size={18} /> Phóng to xem tài liệu
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {doc.fileSize} • Tải lên: {doc.uploadDate}
                      </p>
                    </div>

                    {/* Officer comment on document */}
                    {doc.officerComment && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-medium">
                        <p className="font-bold text-[11px] text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <WarningCircle size={14} /> Nhận xét của cán bộ:
                        </p>
                        {doc.officerComment}
                      </div>
                    )}
                  </div>

                  {/* Actions on document */}
                  <div className="pt-4 mt-3 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleDocStatus(doc.id, 'valid')}
                        className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          doc.status === 'valid'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                        }`}
                      >
                        <Check size={14} weight="bold" /> Hợp lệ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDocStatus(doc.id, 'invalid')}
                        className={`h-9 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          doc.status === 'invalid'
                            ? 'bg-rose-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-800'
                        }`}
                      >
                        <X size={14} weight="bold" /> Không đạt
                      </button>
                    </div>

                    {editingDocComment === doc.id ? (
                      <div className="space-y-2 pt-2">
                        <textarea
                          rows={2}
                          value={docCommentInput}
                          onChange={(e) => setDocCommentInput(e.target.value)}
                          placeholder="Nhập lý do tài liệu chưa đạt (ví dụ: ảnh mờ, mất góc)..."
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-600"
                        />
                        <div className="flex gap-2 justify-end">
                          {doc.officerComment && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDocComment(doc.id)}
                              className="mr-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash size={13} /> Xóa nhận xét
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditingDocComment(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDocComment(doc.id)}
                            className="px-3 py-1 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-lg cursor-pointer"
                          >
                            Lưu nhận xét
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDocComment(doc.id);
                            setDocCommentInput(doc.officerComment || '');
                          }}
                          className="flex-1 text-center py-1.5 text-xs font-semibold text-slate-600 hover:text-red-800 hover:underline cursor-pointer"
                        >
                          {doc.officerComment ? 'Chỉnh sửa nhận xét' : '+ Ghi nhận xét cho tài liệu này'}
                        </button>
                        {doc.officerComment && (
                          <button
                            type="button"
                            onClick={() => handleDeleteDocComment(doc.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa nhận xét"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: E-form Check */}
      {activeTab === 'eform' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Kiểm tra dữ liệu E-form</h3>
              <p className="text-xs text-slate-500">
                Đối chiếu từng trường thông tin tờ khai. Cho phép cán bộ ghi nhận xét trực tiếp vào trường dữ liệu sai sót.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {app.eformFields.map((field) => (
              <div key={field.key} className="p-4 bg-white hover:bg-slate-50/80 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{field.label}</span>
                      {field.mappedFrom && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          Nguồn: {field.mappedFrom}
                        </span>
                      )}
                      {field.wasChangedInRevision && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                          Đã sửa đổi ở phiên bản này
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">{field.value}</p>
                    {field.oldValue && (
                      <p className="text-xs text-slate-400 mt-0.5 line-through">
                        Giá trị cũ: {field.oldValue}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {field.officerComment && (
                      <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 max-w-xs truncate" title={field.officerComment}>
                        {field.officerComment}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFieldComment(field.key);
                        setFieldCommentInput(field.officerComment || '');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-red-800 cursor-pointer shadow-xs"
                    >
                      <ChatText size={14} />
                      <span>{field.officerComment ? 'Sửa góp ý' : 'Góp ý trường này'}</span>
                    </button>

                    {field.officerComment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFieldComment(field.key)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        title="Xóa góp ý"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Comment Input */}
                {editingFieldComment === field.key && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Góp ý cụ thể cho trường: <strong className="text-red-900">{field.label}</strong>
                    </label>
                    <input
                      type="text"
                      value={fieldCommentInput}
                      onChange={(e) => setFieldCommentInput(e.target.value)}
                      placeholder="Ví dụ: Cập nhật địa chỉ theo đúng giấy xác nhận cư trú..."
                      className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-red-600"
                    />
                    <div className="flex gap-2 justify-end">
                      {field.officerComment && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFieldComment(field.key)}
                          className="mr-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer"
                        >
                          <Trash size={13} /> Xóa góp ý
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingFieldComment(null)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveFieldComment(field.key)}
                        className="px-3.5 py-1 text-xs font-bold text-white bg-red-800 hover:bg-red-900 rounded-lg cursor-pointer"
                      >
                        Lưu góp ý
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: PDF Preview */}
      {activeTab === 'pdf' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Xem trước Tờ khai Hành chính (Bản in mô phỏng A4)</h3>
              <p className="text-xs text-slate-500">Mẫu tờ khai chính thức được tự động điền từ dữ liệu tiền kiểm</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Printer size={15} /> In tờ khai
              </button>
            </div>
          </div>

          {/* Simulated Official A4 Paper */}
          <div className="mx-auto max-w-[760px] p-8 sm:p-12 bg-white rounded-xl border border-slate-300 shadow-lg text-slate-900 space-y-6 font-sans">
            {/* Header */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="text-xs font-bold border-b border-slate-900 inline-block pb-0.5">Độc lập - Tự do - Hạnh phúc</p>
            </div>

            <div className="text-center pt-4">
              <h2 className="text-xl font-bold uppercase tracking-tight text-slate-950">
                TỜ KHAI {app.procedureName.toUpperCase()}
              </h2>
              <p className="text-xs italic text-slate-500 mt-1">
                Kính gửi: Ủy ban nhân dân Phường An Khánh, Quận Ba Đình, TP. Hà Nội
              </p>
            </div>

            {/* Content Table */}
            <div className="text-xs space-y-3 pt-4 border-t border-slate-200 font-sans">
              <div className="grid grid-cols-2 gap-y-2.5">
                <div>Họ và tên người nộp: <strong>{app.citizen.fullName}</strong></div>
                <div>Số CCCD: <strong>{app.citizen.citizenId}</strong></div>
                <div>Ngày sinh: <strong>{app.citizen.dateOfBirth}</strong></div>
                <div>Giới tính: <strong>{app.citizen.gender}</strong></div>
                <div className="col-span-2">Nơi thường trú: <strong>{app.citizen.permanentAddress}</strong></div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <p className="font-bold text-xs uppercase text-slate-800">Dữ liệu tờ khai điện tử:</p>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {app.eformFields.slice(0, 6).map((f) => (
                    <div key={f.key}>
                      <span className="text-slate-500">{f.label}:</span> <strong>{f.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <p className="italic text-[11px] text-slate-600 pt-3">
                "Tôi cam đoan những lời khai trên đây là đúng sự thật và chịu trách nhiệm hoàn toàn trước pháp luật về lời khai của mình."
              </p>
            </div>

            {/* Signature Area */}
            <div className="pt-8 flex justify-between items-end text-xs font-sans">
              <div className="text-center space-y-1">
                <p className="text-slate-500">Mã tiền kiểm điện tử</p>
                <p className="font-mono font-bold text-red-900 text-sm">{app.applicationNumber}</p>
                {app.qrCodeUrl && (
                  <img src={app.qrCodeUrl} alt="QR Code" className="size-20 mx-auto mt-1" />
                )}
              </div>
              <div className="text-center space-y-1">
                <p className="italic text-slate-600">Hà Nội, ngày 17 tháng 09 năm 2026</p>
                <p className="font-bold">NGƯỜI LÀM ĐƠN</p>
                <p className="text-[11px] text-emerald-700 pt-6 font-bold">(Đã ký số xác thực CCCD)</p>
                <p className="font-bold text-slate-900">{app.citizen.fullName}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: Revision History & Diff */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Lịch sử sửa đổi & So sánh phiên bản (What changed?)</h3>
              <p className="text-xs text-slate-500">
                Theo dõi tiến trình hoàn thiện hồ sơ qua các lần cán bộ yêu cầu bổ sung và công dân gửi lại
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
              Phiên bản hiện tại: v{app.currentVersion}
            </span>
          </div>

          <div className="space-y-6">
            {app.revisionHistory.map((rev) => (
              <div key={rev.version} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-red-800 text-white font-bold text-xs">
                      v{rev.version}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Phiên bản {rev.version}</h4>
                      <p className="text-[11px] text-slate-500">
                        Nộp lúc: {rev.submittedAt} {rev.reviewedBy && `• Thụ lý: ${rev.reviewedBy}`}
                      </p>
                    </div>
                  </div>
                  {rev.reviewedAt && (
                    <span className="text-xs text-slate-500 font-medium">Đã tiền kiểm lúc: {rev.reviewedAt}</span>
                  )}
                </div>

                <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  <strong>Tóm tắt:</strong> {rev.summary}
                </p>

                {/* Diffs Table */}
                {rev.diffs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Nội dung thay đổi so với phiên bản trước:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                          <tr>
                            <th className="p-3">Hạng mục thay đổi</th>
                            <th className="p-3 text-rose-800">Phiên bản cũ (Trước)</th>
                            <th className="p-3 text-emerald-800">Phiên bản mới (Sau khi sửa)</th>
                            <th className="p-3">Lý do điều chỉnh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rev.diffs.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-900">{diff.fieldName}</td>
                              <td className="p-3 text-rose-700 bg-rose-50/40">{diff.oldValue}</td>
                              <td className="p-3 text-emerald-700 bg-emerald-50/40 font-bold">{diff.newValue}</td>
                              <td className="p-3 text-slate-600">{diff.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENT FULLSCREEN PREVIEW MODAL */}
      {activeDocPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setActiveDocPreview(null)}
        >
          <div className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveDocPreview(null)}
              className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
            <img src={activeDocPreview} alt="Tài liệu chi tiết" className="w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* REQUEST REVISION MODAL */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-500 text-amber-950">
              <div className="flex items-center gap-2.5">
                <WarningCircle size={22} weight="bold" />
                <h3 className="text-base font-bold">Yêu cầu công dân bổ sung hồ sơ</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="rounded-lg p-1 text-amber-950/70 hover:bg-amber-600/20"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-600">
                Các nhận xét cụ thể trên từng trường dữ liệu và tài liệu sẽ được tự động tổng hợp để gửi tới tài khoản công dân:
              </p>

              {/* Aggregated comment list */}
              {collectedComments.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {collectedComments.map((c, idx) => (
                    <div key={idx} className="text-xs flex gap-2 pb-2 border-b border-slate-200 last:border-b-0 last:pb-0">
                      <span className="font-bold text-amber-800 shrink-0">[{c.type}]</span>
                      <div className="flex-1">
                        <strong className="text-slate-900">{c.label}:</strong> {c.comment}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-50 text-xs text-amber-800">
                  Chưa có nhận xét cụ thể theo trường. Bạn có thể nhập nội dung thông báo chung bên dưới.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nội dung kết luận & lời dặn thêm của Cán bộ Một cửa:
                </label>
                <textarea
                  rows={3}
                  value={generalRevisionNote}
                  onChange={(e) => setGeneralRevisionNote(e.target.value)}
                  placeholder="Vui lòng kiểm tra lại các mục đã nhận xét, cập nhật tài liệu hợp lệ và bấm 'Gửi lại' để cán bộ tiền kiểm tiếp tục thụ lý..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Xác nhận gửi yêu cầu bổ sung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-center p-6 space-y-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle size={32} weight="bold" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Phê duyệt tiền kiểm hồ sơ?</h3>
              <p className="text-xs text-slate-500">Mã hồ sơ: <strong className="font-mono text-red-800">{app.applicationNumber}</strong></p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              Sau khi duyệt: Hệ thống sẽ <strong>tự động tạo mã QR định danh</strong> cho hồ sơ. Công dân sẽ nhận được thông báo mang hồ sơ giấy cùng mã QR đến UBND xã/phường để tiếp nhận chính thức. Cán bộ vẫn có thể rà soát hoặc điều chỉnh nhận xét bất cứ lúc nào.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Xác nhận Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
