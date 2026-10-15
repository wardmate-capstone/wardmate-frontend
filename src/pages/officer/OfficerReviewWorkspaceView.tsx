import React, { useState, useEffect, useMemo } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/components/ui/Toast';
import { workflowError } from '@/lib/api/workflow';
import {
  useAddCommentMutation,
  useApplicationComments,
  useApplicationVersions,
  useApplicationDiff,
} from '@/hooks/useWorkflow';
import { mapCommentDtoToOfficerReviewComment } from '@/lib/api/workflowAdapters';
import {
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  ChatText,
  ClockCounterClockwise,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  DownloadSimple,
  ArrowsOut,
  Plus,
  Trash,
  Hourglass,
  Check,
  X,
  XCircle,
  FilePdf,
  Info,
} from '@phosphor-icons/react';
import type {
  OfficerApplication,
  OfficerReviewComment,
  SupportingDocument,
} from '@/types/officer';

interface OfficerReviewWorkspaceViewProps {
  application: OfficerApplication;
  onBack: () => void;
  onRequestRevision: (appId: string, notes: string, issues: string[]) => void;
  onApproveApplication: (appId: string) => void;
  onRejectApplication?: (appId: string, reason: string) => void;
  onUpdateComments: (appId: string, comments: OfficerReviewComment[]) => void;
}

type ReviewTab =
  | 'citizen-info'
  | 'eligibility'
  | 'checklist'
  | 'documents'
  | 'eform'
  | 'pdf'
  | 'comments'
  | 'versions'
  | 'timeline';

export const OfficerReviewWorkspaceView: React.FC<OfficerReviewWorkspaceViewProps> = ({
  application,
  onBack,
  onRequestRevision,
  onApproveApplication,
  onRejectApplication,
  onUpdateComments,
}) => {
  const { profile } = useUserProfile();
  const user = useAuthStore((state) => state.user);
  const officerName = profile?.fullName?.trim() || user?.username || 'Cán bộ Một cửa';
  const [activeTab, setActiveTab] = useState<ReviewTab>('citizen-info');

  // Queries & Mutations từ Workflow API
  const addCommentMutation = useAddCommentMutation();
  const { data: remoteComments } = useApplicationComments(application.id, application.currentVersion);
  const { data: remoteVersions } = useApplicationVersions(application.id);
  const [diffFromVersion, setDiffFromVersion] = useState<number>(1);
  const [diffToVersion, setDiffToVersion] = useState<number>(application.currentVersion);
  const { data: remoteDiff, isLoading: loadingDiff } = useApplicationDiff(
    application.id,
    diffFromVersion,
    diffToVersion
  );

  // Tự động gán 2 version gần nhất khi có dữ liệu versions
  useEffect(() => {
    if (remoteVersions && remoteVersions.length >= 2) {
      setDiffFromVersion(remoteVersions[remoteVersions.length - 2].versionNumber);
      setDiffToVersion(remoteVersions[remoteVersions.length - 1].versionNumber);
    }
  }, [remoteVersions]);

  // Interactive workspace states
  const [comments, setComments] = useState<OfficerReviewComment[]>(application.comments || []);
  const activeComments = useMemo(() => {
    if (remoteComments && remoteComments.length > 0) {
      return remoteComments.map((c) => mapCommentDtoToOfficerReviewComment(c, officerName));
    }
    return comments;
  }, [remoteComments, comments, officerName]);

  const [newCommentInput, setNewCommentInput] = useState('');
  const [commentCategory, setCommentCategory] = useState<'general' | 'eform' | 'document' | 'checklist'>('general');
  const [commentTarget, setCommentTarget] = useState(application.eformFields[0]?.key || '/formData/applicantName');
  const [commentLabel, setCommentLabel] = useState('Góp ý chung');

  // Modals
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedIssueKeys, setSelectedIssueKeys] = useState<string[]>([]);

  // Document preview zoom
  const [selectedDoc, setSelectedDoc] = useState<SupportingDocument | null>(
    application.documents[0] || null
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // PDF checklist states
  const [pdfChecks, setPdfChecks] = useState({
    correctForm: true,
    correctVersion: true,
    completeData: true,
    noLayoutError: true,
  });

  // Handle adding comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentInput.trim()) return;

    const isChecklist = commentCategory === 'checklist' || commentCategory === 'document';
    const targetType = isChecklist ? 'CHECKLIST_ITEM' : 'FORM_FIELD';

    let targetId = commentTarget;
    if (isChecklist) {
      if (!targetId || !application.checklist.some((c) => c.id === targetId)) {
        targetId = application.checklist[0]?.id || '';
      }
    } else {
      if (!targetId || !targetId.startsWith('/formData') || !application.eformFields.some((f) => f.key === targetId)) {
        targetId = application.eformFields[0]?.key || '/formData/applicantName';
      }
    }

    const fieldLabel = commentLabel || (isChecklist ? 'Mục giấy tờ đính kèm' : 'Thông tin biểu mẫu');

    try {
      await addCommentMutation.mutateAsync({
        id: application.id,
        input: {
          versionNumber: application.currentVersion,
          targetType,
          targetId,
          fieldLabel,
          commentText: newCommentInput.trim(),
        },
      });
      toast.success('Đã thêm nhận xét vào hồ sơ thành công.');
      setNewCommentInput('');
    } catch (err) {
      // Fallback local update nếu offline
      const newC: OfficerReviewComment = {
        id: `c-${Date.now()}`,
        category: isChecklist ? 'checklist' : 'eform',
        target: fieldLabel,
        content: newCommentInput.trim(),
        createdAt: 'Vừa xong',
        officerName,
      };
      const updated = [...comments, newC];
      setComments(updated);
      onUpdateComments(application.id, updated);
      setNewCommentInput('');
      toast.error(workflowError(err));
    }
  };

  // Handle removing comment
  const handleDeleteComment = (commentId: string) => {
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    onUpdateComments(application.id, updated);
  };

  // Quick field comment trigger
  const handleQuickFieldComment = (
    category: 'general' | 'eform' | 'checklist' | 'document',
    targetId: string,
    label: string,
    defaultComment: string = ''
  ) => {
    setCommentCategory(category);
    setCommentTarget(targetId);
    setCommentLabel(label);
    setNewCommentInput(defaultComment);
    setActiveTab('comments');
  };

  // Action guards
  const handleOpenRevisionModal = () => {
    if (activeComments.length === 0) {
      toast.warning('Cần có ít nhất 1 nhận xét lỗi cụ thể trên tờ khai hoặc giấy tờ trước khi gửi yêu cầu chỉnh sửa.');
      setActiveTab('comments');
      return;
    }
    const issueList = activeComments.map((c) => `${c.target}: ${c.content}`);
    setSelectedIssueKeys(issueList);
    setShowRevisionModal(true);
  };

  const handleOpenApproveModal = () => {
    if (activeComments.length > 0) {
      toast.error('Hồ sơ vẫn còn nhận xét lỗi chưa giải quyết. Cần yêu cầu công dân sửa hoặc xóa nhận xét trước khi duyệt.');
      setActiveTab('comments');
      return;
    }
    setShowApproveModal(true);
  };

  const tabs: Array<{ id: ReviewTab; label: string; badge?: number }> = [
    { id: 'citizen-info', label: 'Thông tin người dân' },
    { id: 'eligibility', label: 'Điều kiện thủ tục' },
    { id: 'checklist', label: 'Checklist thành phần' },
    { id: 'documents', label: 'Giấy tờ đính kèm', badge: application.documents.length },
    { id: 'eform', label: 'Tờ khai E-form' },
    { id: 'pdf', label: 'Xem trước PDF' },
    { id: 'comments', label: 'Comment trực tiếp', badge: activeComments.length },
    { id: 'versions', label: 'Phiên bản & So sánh', badge: application.currentVersion > 1 ? application.currentVersion : undefined },
    { id: 'timeline', label: 'Timeline sự kiện' },
  ];

  return (
    <article aria-label="Không gian làm việc tiền kiểm hồ sơ" className="space-y-6 pb-24">
      {/* Top Application Header */}
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Quay lại danh sách hồ sơ"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xl font-extrabold text-slate-950 sm:text-2xl">
                  {application.applicationNumber}
                </span>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                  {application.status === 'UNDER_REVIEW'
                    ? 'Đang kiểm tra'
                    : application.status === 'RESUBMITTED'
                    ? 'Đã gửi lại (V2)'
                    : application.status === 'REJECTED'
                    ? 'Đã từ chối'
                    : application.status}
                </span>
                {application.currentVersion > 1 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-900">
                    Phiên bản V{application.currentVersion}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 flex-wrap">
                <strong className="text-slate-900 font-bold">{application.citizen.fullName}</strong>
                <span>·</span>
                <span className="text-slate-700">{application.procedureName}</span>
                <span>·</span>
                <span>Bắt đầu kiểm tra: {application.reviewStartedAt || application.submittedAt}</span>
                <span>·</span>
                <span>Cán bộ: {application.assignedOfficer}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            {/* Nút Từ chối */}
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
            >
              <XCircle size={18} weight="bold" />
              <span>Từ chối</span>
            </button>

            {/* Nút Yêu cầu bổ sung */}
            <button
              type="button"
              onClick={handleOpenRevisionModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-800 hover:bg-rose-100 transition-colors"
            >
              <WarningCircle size={18} weight="bold" />
              <span>Yêu cầu bổ sung ({activeComments.length})</span>
            </button>

            {/* Nút Duyệt tiền kiểm */}
            <button
              type="button"
              onClick={handleOpenApproveModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              <CheckCircle size={18} weight="bold" />
              <span>Duyệt tiền kiểm</span>
            </button>
          </div>
        </div>

        {/* 9 Tabs Bar */}
        <nav aria-label="Các phân hệ kiểm tra hồ sơ" className="mt-5 border-t border-slate-100 pt-3">
          <ul className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-red-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {/* Main Workspace Body Tab by Tab */}
      <section aria-label="Nội dung chi tiết kiểm tra" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        {/* TAB 1: THÔNG TIN NGƯỜI DÂN */}
        {activeTab === 'citizen-info' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">Kiểm tra thông tin người dân</h3>
              </div>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                ✓ Dữ liệu khớp VNeID
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-400">Họ và tên</span>
                    <strong className="block text-sm font-bold text-slate-900 mt-0.5">{application.citizen.fullName}</strong>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">✓ Hợp lệ</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFieldComment('eform', '/formData/applicantName', 'Họ và tên người nộp', 'Họ tên đã khớp bản gốc CCCD.')}
                    className="text-xs font-semibold text-slate-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                  >
                    <ChatText size={14} />
                    <span>Comment</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-400">Ngày sinh</span>
                    <strong className="block text-sm font-bold text-slate-900 mt-0.5">{application.citizen.dateOfBirth}</strong>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">✓ Hợp lệ</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFieldComment('eform', '/formData/dateOfBirth', 'Ngày tháng năm sinh')}
                    className="text-xs font-semibold text-slate-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                  >
                    <ChatText size={14} />
                    <span>Comment</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-400">Số CCCD / Định danh</span>
                    <strong className="block text-sm font-bold text-slate-900 font-mono mt-0.5">{application.citizen.citizenId}</strong>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">✓ Hợp lệ</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFieldComment('eform', '/formData/identityNumber', 'Số CCCD / Định danh')}
                    className="text-xs font-semibold text-slate-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                  >
                    <ChatText size={14} />
                    <span>Comment</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-amber-700">Nơi cư trú</span>
                    <strong className="block text-sm font-bold text-slate-900 mt-0.5">{application.citizen.address}</strong>
                  </div>
                  <span className="text-xs font-bold text-amber-800">⚠ Cần kiểm tra</span>
                </div>
                <p className="text-xs text-amber-800 italic">
                  Ghi chú hiện tại: Cần ghi rõ số nhà, tổ dân phố theo giấy cư trú
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFieldComment('eform', '/formData/address', 'Địa chỉ nơi cư trú', 'Vui lòng cập nhật địa chỉ theo giấy xác nhận cư trú.')}
                    className="text-xs font-bold text-red-800 hover:underline inline-flex items-center gap-1"
                  >
                    <ChatText size={14} />
                    <span>Sửa góp ý trường này</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-400">Số điện thoại liên hệ</span>
                    <strong className="block text-sm font-bold text-slate-900 font-mono mt-0.5">{application.citizen.phoneNumber}</strong>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">✓ Hợp lệ</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-400">Email nhận thông báo</span>
                    <strong className="block text-sm font-bold text-slate-900 mt-0.5">{application.citizen.email}</strong>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">✓ Hợp lệ</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ĐIỀU KIỆN THỰC HIỆN */}
        {activeTab === 'eligibility' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950">Kiểm tra điều kiện thủ tục</h3>
            </div>

            <ul className="space-y-3">
              {application.eligibility.map((crit) => (
                <li
                  key={crit.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                      <Check size={16} weight="bold" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{crit.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Đạt điều kiện
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickFieldComment('general', application.eformFields[0]?.key || '/formData/applicantName', `Điều kiện: ${crit.label}`)}
                      className="text-xs font-semibold text-slate-600 hover:text-red-700 hover:underline px-2"
                    >
                      Thêm nhận xét
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* TAB 3: CHECKLIST THÀNH PHẦN HỒ SƠ */}
        {activeTab === 'checklist' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950">Kiểm tra Checklist thành phần hồ sơ</h3>
            </div>

            <div className="space-y-3">
              {application.checklist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-slate-900">{item.name}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {item.type === 'mandatory' ? 'Bắt buộc' : 'Tùy chọn'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Công dân kê khai: <strong className="text-slate-800">Đã chuẩn bị</strong>
                    </p>
                    {item.officerNote && (
                      <p className="text-xs font-semibold text-amber-800 mt-1 italic">
                        Ghi chú cán bộ: {item.officerNote}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      defaultValue={item.officerStatus}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-red-600 focus:outline-none"
                    >
                      <option value="valid">✓ Hợp lệ</option>
                      <option value="check_needed">⚠ Cần kiểm tra</option>
                      <option value="missing">✕ Thiếu tài liệu</option>
                      <option value="invalid">✕ Không hợp lệ</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleQuickFieldComment('checklist', item.id, item.name)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Comment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GIẤY TỜ ĐÍNH KÈM & ZOOM PREVIEW */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950">Kiểm tra giấy tờ đính kèm ({application.documents.length})</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Document List */}
              <div className="lg:col-span-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh mục tệp đính kèm</h4>
                <ul className="space-y-2">
                  {application.documents.map((doc) => {
                    const isSelected = selectedDoc?.id === doc.id;
                    return (
                      <li key={doc.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setZoomLevel(100);
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-red-700 bg-red-50/60 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-bold text-slate-900 truncate">{doc.name}</strong>
                            <span className="text-[10px] uppercase font-bold text-slate-500">{doc.fileType}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{doc.fileSize} · {doc.uploadDate}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                doc.status === 'valid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.status === 'invalid'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {doc.status === 'valid' ? 'Hợp lệ' : doc.status === 'invalid' ? 'Không hợp lệ' : 'Chưa kiểm tra'}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Document Viewer & Zoom Controls */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-slate-900/5 p-4 space-y-4">
                {selectedDoc ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                      <div>
                        <strong className="block text-sm font-bold text-slate-950">{selectedDoc.name}</strong>
                        <span className="text-xs text-slate-500">Độ thu phóng: {zoomLevel}%</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                          className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          title="Thu nhỏ"
                        >
                          <MagnifyingGlassMinus size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(100)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          100%
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                          className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          title="Phóng to"
                        >
                          <MagnifyingGlassPlus size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Preview Box */}
                    <div className="relative min-h-[420px] max-h-[520px] overflow-auto rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-center">
                      {selectedDoc.fileType === 'image' ? (
                        <img
                          src={selectedDoc.url}
                          alt={selectedDoc.name}
                          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                          className="max-h-[460px] object-contain transition-transform duration-200 rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="text-center p-8 space-y-3">
                          <FilePdf size={64} className="mx-auto text-red-700" />
                          <p className="text-sm font-bold text-slate-800">{selectedDoc.name}</p>
                          <p className="text-xs text-slate-500">Tệp tài liệu PDF đã sẵn sàng đối chiếu.</p>
                          <a
                            href={selectedDoc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-800 text-xs font-bold text-white hover:bg-red-900"
                          >
                            <DownloadSimple size={16} />
                            <span>Mở tệp PDF trong tab mới</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Decision buttons for this doc */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            selectedDoc.status = 'valid';
                            selectedDoc.officerComment = undefined;
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 shadow-2xs"
                        >
                          Đánh dấu Hợp lệ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            selectedDoc.status = 'invalid';
                            handleQuickFieldComment('document', selectedDoc.id, selectedDoc.name, 'Ảnh chụp tài liệu mờ, mất góc.');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-700 text-xs font-bold text-white hover:bg-rose-800 shadow-2xs"
                        >
                          Không hợp lệ
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickFieldComment('document', selectedDoc.id, selectedDoc.name)}
                        className="text-xs font-bold text-slate-700 hover:text-red-700 underline inline-flex items-center gap-1"
                      >
                        <ChatText size={16} />
                        <span>Ghi nhận xét cho tài liệu này</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="py-20 text-center text-sm text-slate-500">Chọn một tài liệu để xem trước.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KIỂM TRA E-FORM */}
        {activeTab === 'eform' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950">Kiểm tra dữ liệu tờ khai E-form</h3>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                    <th className="px-4 py-3">Trường dữ liệu</th>
                    <th className="px-4 py-3">Giá trị công dân kê khai</th>
                    <th className="px-4 py-3">Đánh giá</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {application.eformFields.map((field) => (
                    <tr key={field.key} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 font-bold text-slate-900 w-1/4">
                        {field.label}
                        {field.wasChangedInRevision && (
                          <span className="block text-[10px] font-bold text-purple-700 mt-0.5">
                            ★ Vừa sửa trong V2
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-800">
                        <span className="font-medium text-sm">{field.value}</span>
                        {field.oldValue && (
                          <span className="block text-[11px] text-slate-400 line-through mt-0.5">
                            Cũ: {field.oldValue}
                          </span>
                        )}
                        {field.officerComment && (
                          <p className="text-xs text-rose-700 italic mt-1">
                            Góp ý: {field.officerComment}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {field.status === 'valid' && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Hợp lệ
                          </span>
                        )}
                        {field.status === 'warning' && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⚠ Cần sửa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleQuickFieldComment('eform', field.key, field.label, field.officerComment || '')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <ChatText size={14} />
                          <span>{field.officerComment ? 'Sửa góp ý' : 'Góp ý'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: KIỂM TRA PDF */}
        {activeTab === 'pdf' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950">Kiểm tra kết xuất PDF tờ khai</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* PDF Preview Frame */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-slate-900/5 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <FilePdf size={20} className="text-red-700" />
                    Bản xem trước tờ khai chính thức ({application.applicationNumber}.pdf)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      title="Toàn màn hình"
                    >
                      <ArrowsOut size={16} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      title="Tải xuống"
                    >
                      <DownloadSimple size={16} />
                    </button>
                  </div>
                </div>

                <div className="min-h-[480px] bg-white rounded-xl border border-slate-300 p-8 shadow-inner font-serif text-slate-900 space-y-4">
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="text-xs font-semibold">Độc lập - Tự do - Hạnh phúc</p>
                    <div className="w-32 h-0.5 bg-slate-900 mx-auto mt-1" />
                  </div>

                  <div className="text-center pt-4">
                    <h4 className="text-lg font-bold uppercase tracking-tight">{application.procedureName.toUpperCase()}</h4>
                    <p className="text-xs italic text-slate-600 mt-1">Kính gửi: Ủy ban nhân dân Phường An Khánh, TP. Thủ Đức</p>
                  </div>

                  <div className="space-y-2 text-xs pt-4 leading-6">
                    <p><strong>Họ và tên người yêu cầu:</strong> {application.citizen.fullName.toUpperCase()}</p>
                    <p><strong>Ngày tháng năm sinh:</strong> {application.citizen.dateOfBirth}</p>
                    <p><strong>Số định danh cá nhân / CCCD:</strong> {application.citizen.citizenId}</p>
                    <p><strong>Nơi thường trú:</strong> {application.citizen.address}</p>
                    <p><strong>Số điện thoại:</strong> {application.citizen.phoneNumber}</p>
                  </div>

                  <div className="pt-8 flex justify-between text-xs italic text-slate-600">
                    <p>Mã hồ sơ tiền kiểm: {application.applicationNumber}</p>
                    <div className="text-center">
                      <p>Ngày 21 tháng 09 năm 2026</p>
                      <p className="font-bold text-slate-900 mt-1">Người làm đơn</p>
                      <p className="mt-8 text-slate-400 font-sans text-[11px]">(Đã ký số / xác nhận kê khai)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Checklist for PDF */}
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-950 border-b border-slate-200 pb-2">
                  Review Checklist cho PDF
                </h4>

                <ul className="space-y-3 text-xs">
                  <li className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pdf-chk-1"
                      checked={pdfChecks.correctForm}
                      onChange={(e) => setPdfChecks({ ...pdfChecks, correctForm: e.target.checked })}
                      className="size-4 rounded text-red-800 focus:ring-red-600"
                    />
                    <label htmlFor="pdf-chk-1" className="font-semibold text-slate-800">
                      Đúng biểu mẫu quy định
                    </label>
                  </li>
                  <li className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pdf-chk-2"
                      checked={pdfChecks.correctVersion}
                      onChange={(e) => setPdfChecks({ ...pdfChecks, correctVersion: e.target.checked })}
                      className="size-4 rounded text-red-800 focus:ring-red-600"
                    />
                    <label htmlFor="pdf-chk-2" className="font-semibold text-slate-800">
                      Đúng phiên bản (V{application.currentVersion})
                    </label>
                  </li>
                  <li className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pdf-chk-3"
                      checked={pdfChecks.completeData}
                      onChange={(e) => setPdfChecks({ ...pdfChecks, completeData: e.target.checked })}
                      className="size-4 rounded text-red-800 focus:ring-red-600"
                    />
                    <label htmlFor="pdf-chk-3" className="font-semibold text-slate-800">
                      Đầy đủ các trường thông tin
                    </label>
                  </li>
                  <li className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pdf-chk-4"
                      checked={pdfChecks.noLayoutError}
                      onChange={(e) => setPdfChecks({ ...pdfChecks, noLayoutError: e.target.checked })}
                      className="size-4 rounded text-red-800 focus:ring-red-600"
                    />
                    <label htmlFor="pdf-chk-4" className="font-semibold text-slate-800">
                      Không lỗi bố cục hoặc ngắt dòng
                    </label>
                  </li>
                </ul>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleQuickFieldComment('general', application.eformFields[0]?.key || '/formData/applicantName', 'Bản PDF tờ khai chính thức')}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <ChatText size={16} />
                    <span>Góp ý chỉnh sửa PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: COMMENT TRỰC TIẾP */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">Tổng hợp nhận xét / góp ý ({comments.length})</h3>
              </div>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="p-4 rounded-xl border border-red-100 bg-red-50/30 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-900">Thêm nhận xét mới</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="comment-cat-select" className="block text-xs font-bold text-slate-700 mb-1">
                    Phân loại nhận xét
                  </label>
                  <select
                    id="comment-cat-select"
                    value={commentCategory}
                    onChange={(e) => {
                      const cat = e.target.value as 'general' | 'eform' | 'document' | 'checklist';
                      setCommentCategory(cat);
                      if (cat === 'general') {
                        setCommentTarget(application.eformFields[0]?.key || '/formData/applicantName');
                        setCommentLabel('Góp ý chung hồ sơ');
                      } else if (cat === 'eform') {
                        const first = application.eformFields[0];
                        setCommentTarget(first?.key || '/formData/applicantName');
                        setCommentLabel(first?.label || 'Trường tờ khai');
                      } else {
                        const first = application.checklist[0];
                        setCommentTarget(first?.id || '');
                        setCommentLabel(first?.name || 'Giấy tờ đính kèm');
                      }
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  >
                    <option value="general">Góp ý chung hồ sơ</option>
                    <option value="eform">Trường dữ liệu E-form</option>
                    <option value="checklist">Thành phần hồ sơ / Giấy tờ</option>
                  </select>
                </div>

                {commentCategory === 'eform' && (
                  <div>
                    <label htmlFor="comment-target-select" className="block text-xs font-bold text-slate-700 mb-1">
                      Trường dữ liệu E-form
                    </label>
                    <select
                      id="comment-target-select"
                      value={commentTarget}
                      onChange={(e) => {
                        setCommentTarget(e.target.value);
                        const f = application.eformFields.find((x) => x.key === e.target.value);
                        setCommentLabel(f?.label || e.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    >
                      {application.eformFields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label} ({f.key})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(commentCategory === 'checklist' || commentCategory === 'document') && (
                  <div>
                    <label htmlFor="comment-checklist-select" className="block text-xs font-bold text-slate-700 mb-1">
                      Thành phần hồ sơ / Giấy tờ
                    </label>
                    <select
                      id="comment-checklist-select"
                      value={commentTarget}
                      onChange={(e) => {
                        setCommentTarget(e.target.value);
                        const c = application.checklist.find((x) => x.id === e.target.value);
                        setCommentLabel(c?.name || e.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    >
                      {application.checklist.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.type === 'mandatory' ? '(Bắt buộc)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {commentCategory === 'general' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phạm vi áp dụng
                    </label>
                    <div className="w-full rounded-lg border border-slate-200 bg-slate-100/70 px-3 py-2 text-xs text-slate-600">
                      Toàn bộ hồ sơ ({application.applicationNumber})
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="comment-content-textarea" className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung hướng dẫn chỉnh sửa
                </label>
                <textarea
                  id="comment-content-textarea"
                  value={newCommentInput}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  placeholder="Nhập nội dung rõ ràng giúp công dân hiểu cách bổ sung đúng..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newCommentInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-800 text-xs font-bold text-white hover:bg-red-900 disabled:opacity-50"
                >
                  <Plus size={16} weight="bold" />
                  <span>Lưu nhận xét</span>
                </button>
              </div>
            </form>

            {/* List of comments */}
            <ul className="space-y-3">
              {comments.length === 0 ? (
                <li className="py-8 text-center text-sm text-slate-500">Chưa có nhận xét nào được ghi nhận.</li>
              ) : (
                comments.map((c) => (
                  <li key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-900">
                          {c.category}
                        </span>
                        <strong className="text-xs font-bold text-slate-900">{c.target}</strong>
                        <span className="text-[11px] text-slate-400">· {c.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-5 pt-1">{c.content}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      title="Xóa nhận xét này"
                    >
                      <Trash size={16} />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {/* TAB 8: PHIÊN BẢN & SO SÁNH (DIFF V1 vs V2) */}
        {activeTab === 'versions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">Lịch sử phiên bản & Đối chiếu thay đổi (Diff Engine)</h3>
                <p className="text-xs text-slate-500">Tự động so sánh dữ liệu Snapshot giữa các lần nộp của công dân theo chuẩn RFC 6901</p>
              </div>

              {remoteVersions && remoteVersions.length >= 2 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-600">So sánh:</span>
                  <select
                    value={diffFromVersion}
                    onChange={(e) => setDiffFromVersion(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 font-bold text-slate-700 text-xs"
                  >
                    {remoteVersions.map((v) => (
                      <option key={v.id} value={v.versionNumber}>
                        Bản cũ (V{v.versionNumber})
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">↔</span>
                  <select
                    value={diffToVersion}
                    onChange={(e) => setDiffToVersion(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 font-bold text-slate-700 text-xs"
                  >
                    {remoteVersions.map((v) => (
                      <option key={v.id} value={v.versionNumber}>
                        Bản mới (V{v.versionNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {loadingDiff ? (
              <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                Đang đối chiếu dữ liệu giữa phiên bản V{diffFromVersion} và V{diffToVersion}...
              </div>
            ) : remoteDiff && remoteDiff.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Phát hiện <strong className="text-red-800">{remoteDiff.length}</strong> trường có thay đổi so với bản trước:</span>
                  <span className="text-[11px] text-slate-400">Khác biệt được tô màu tự động</span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                        <th className="px-4 py-3">Trường dữ liệu</th>
                        <th className="px-4 py-3 text-rose-800">Bản cũ (V{diffFromVersion})</th>
                        <th className="px-4 py-3 text-emerald-800">Bản mới nộp lại (V{diffToVersion})</th>
                        <th className="px-4 py-3">Nhận xét liên kết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {remoteDiff.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            <div>{d.fieldLabel || d.fieldKey}</div>
                            <span className="text-[10px] font-mono text-slate-400">{d.fieldKey}</span>
                          </td>
                          <td className="px-4 py-3 text-rose-700 line-through bg-rose-50/40">
                            {d.oldValue !== null && d.oldValue !== undefined
                              ? (typeof d.oldValue === 'object' ? JSON.stringify(d.oldValue) : String(d.oldValue))
                              : <span className="italic text-slate-400">Chưa có</span>}
                          </td>
                          <td className="px-4 py-3 text-emerald-800 font-semibold bg-emerald-50/40">
                            {d.newValue !== null && d.newValue !== undefined
                              ? (typeof d.newValue === 'object' ? JSON.stringify(d.newValue) : String(d.newValue))
                              : <span className="italic text-slate-400">Đã xóa</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {d.associatedComments && d.associatedComments.length > 0 ? (
                              <div className="space-y-1">
                                {d.associatedComments.map((c) => (
                                  <div key={c.id} className="text-amber-800 text-[11px] bg-amber-50 p-1.5 rounded border border-amber-200">
                                    <strong>💬 Cán bộ:</strong> {c.commentText}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="italic text-slate-400">Không có comment cũ</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center space-y-2">
                <ClockCounterClockwise size={32} className="mx-auto text-slate-400" />
                <h4 className="text-sm font-bold text-slate-800">
                  {(!remoteVersions || remoteVersions.length <= 1)
                    ? `Hồ sơ đang ở phiên bản V${application.currentVersion} (bản nộp đầu tiên)`
                    : `Không có sự sai khác nào giữa V${diffFromVersion} và V${diffToVersion}`}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {(!remoteVersions || remoteVersions.length <= 1)
                    ? 'Khi cán bộ gửi yêu cầu bổ sung và công dân nộp lại hồ sơ, hệ thống sẽ tự động đối chiếu các trường thay đổi tại đây.'
                    : 'Tất cả các trường dữ liệu ở hai phiên bản này đều hoàn toàn giống nhau.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: TIMELINE SỰ KIỆN */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-950">Dòng thời gian sự kiện hồ sơ</h3>
            </div>

            <ol className="relative border-l border-slate-200 ml-4 space-y-6">
              {application.timeline.map((item) => (
                <li key={item.id} className="ml-6">
                  <span
                    className={`absolute -left-3 grid size-6 place-items-center rounded-full ring-4 ring-white ${
                      item.status === 'done'
                        ? 'bg-emerald-600 text-white'
                        : item.status === 'current'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {item.status === 'done' ? (
                      <Check size={12} weight="bold" />
                    ) : item.status === 'current' ? (
                      <Hourglass size={12} weight="bold" />
                    ) : (
                      <ClockCounterClockwise size={12} />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-900">{item.title}</strong>
                    <span className="text-[11px] text-slate-500">· {item.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Tác nhân: <span className="font-semibold text-slate-800">{item.actor}</span></p>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1 italic">{item.description}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Fixed Bottom Action Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info size={16} className="text-slate-400 shrink-0" />
            <span>Đang xử lý: <strong className="text-slate-900">{application.applicationNumber}</strong> ({application.citizen.fullName})</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Thoát workspace
            </button>

            {/* Nút Từ chối */}
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
            >
              <XCircle size={16} weight="bold" />
              <span>Từ chối</span>
            </button>

            {/* Nút Yêu cầu bổ sung */}
            <button
              type="button"
              onClick={handleOpenRevisionModal}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors"
            >
              <WarningCircle size={16} weight="bold" />
              <span>Yêu cầu bổ sung ({activeComments.length})</span>
            </button>

            {/* Nút Duyệt tiền kiểm */}
            <button
              type="button"
              onClick={handleOpenApproveModal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition-colors shadow-2xs"
            >
              <CheckCircle size={16} weight="bold" />
              <span>Duyệt tiền kiểm</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL 1: YÊU CẦU BỔ SUNG */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <WarningCircle size={22} weight="bold" />
                <h4 className="text-base font-bold">Yêu cầu chỉnh sửa / Bổ sung hồ sơ</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Hồ sơ <strong className="text-slate-900">{application.applicationNumber}</strong> sẽ chuyển sang trạng thái <strong>CẦN BỔ SUNG</strong> và thông báo trực tiếp đến công dân.
            </p>

            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-800">Các vấn đề cần công dân khắc phục:</span>
              <ul className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                {comments.length === 0 ? (
                  <li className="text-slate-400 italic">Chưa có comment cụ thể. Hãy nhập ghi chú phía dưới.</li>
                ) : (
                  comments.map((c) => (
                    <li key={c.id} className="flex items-start gap-2 text-slate-800">
                      <span className="text-rose-700 font-bold">•</span>
                      <span><strong>{c.target}:</strong> {c.content}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div>
              <label htmlFor="rev-notes" className="block text-xs font-bold text-slate-800 mb-1">
                Ghi chú hướng dẫn thêm cho công dân:
              </label>
              <textarea
                id="rev-notes"
                rows={3}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Ví dụ: Vui lòng bổ sung đầy đủ các giấy tờ trên và gửi lại trước ngày 25/09/2026..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-red-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onRequestRevision(application.id, revisionNotes, selectedIssueKeys);
                  setShowRevisionModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-700 text-xs font-bold text-white hover:bg-rose-800 shadow-2xs"
              >
                Gửi yêu cầu bổ sung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DUYỆT TIỀN KIỂM */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <CheckCircle size={22} weight="bold" />
                <h4 className="text-base font-bold">Xác nhận duyệt tiền kiểm hồ sơ</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Bạn đang xác nhận hồ sơ <strong className="text-slate-900">{application.applicationNumber}</strong> của công dân <strong className="text-slate-900">{application.citizen.fullName}</strong> đạt yêu cầu tiền kiểm.
            </p>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <span className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Xác nhận các tiêu chuẩn nghiệp vụ:
              </span>
              <ul className="space-y-1.5 text-xs text-emerald-900">
                <li className="flex items-center gap-2">✓ Đã kiểm tra thông tin công dân</li>
                <li className="flex items-center gap-2">✓ Đủ điều kiện thực hiện thủ tục</li>
                <li className="flex items-center gap-2">✓ Thành phần hồ sơ checklist đầy đủ</li>
                <li className="flex items-center gap-2">✓ Giấy tờ đính kèm hợp lệ, rõ ràng</li>
                <li className="flex items-center gap-2">✓ Tờ khai E-form chính xác</li>
                <li className="flex items-center gap-2">✓ Bản PDF đạt chuẩn in ấn đối chiếu</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onApproveApplication(application.id);
                  setShowApproveModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 shadow-2xs"
              >
                Xác nhận phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TỪ CHỐI TIỀN KIỂM */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <XCircle size={22} weight="bold" />
                <h4 className="text-base font-bold">Từ chối tiếp nhận tiền kiểm</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Hồ sơ <strong className="text-slate-900">{application.applicationNumber}</strong> sẽ bị <strong>TỪ CHỐI</strong> chính thức. Vui lòng nêu rõ lý do không đủ điều kiện tiếp nhận theo quy định.
            </p>

            <div>
              <label htmlFor="reject-reason" className="block text-xs font-bold text-slate-800 mb-1">
                Lý do từ chối chính thức (bắt buộc):
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nêu rõ lý do từ chối (tối đa 4000 ký tự)..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-red-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.warning('Vui lòng nhập lý do từ chối chính thức.');
                    return;
                  }
                  onRejectApplication?.(application.id, rejectReason.trim());
                  setShowRejectModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-red-700 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50 shadow-2xs"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
