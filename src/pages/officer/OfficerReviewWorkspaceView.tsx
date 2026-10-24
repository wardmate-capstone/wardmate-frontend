import { useRef, useState } from 'react';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Badge, Button, Input, Modal, Skeleton, toast } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useAddCommentMutation, useApplicationComments, useApplicationDiff, useApplicationVersions, useReleaseApplicationMutation } from '@/hooks/useWorkflow';
import { formDataFields, mapAssignmentHistoryToTimelineItem } from '@/lib/api/workflowAdapters';
import { ReleaseApplicationModal } from '@/components/workflow/AssignmentModals';
import { workflowApi, workflowError } from '@/lib/api/workflow';
import { OfficerDocumentsPanel } from './OfficerDocumentsPanel';
import { GeneratedDocumentsPanel } from '@/pages/citizen/components/GeneratedDocumentsPanel';
import { useOfficerSubmissions } from '@/hooks/useDocumentForms';
import { documentFormError } from '@/lib/api/documentForms';
import { aiOcrApi } from '@/lib/api/aiOcr';
import type { OfficerApplication, OfficerReviewComment } from '@/types/officer';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  History,
  GitCompare,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

interface Props {
  application: OfficerApplication;
  onBack: () => void;
  onRequestRevision: (id: string, reason: string, issues: string[], submissionId?: string) => Promise<void>;
  onConfirmReadiness: (id: string, submissionId?: string) => Promise<void>;
  onUpdateComments?: (id: string, comments: OfficerReviewComment[]) => void;
}

const commentSchema = z.object({
  targetId: z.string().min(1, 'Chọn mục cần nhận xét.').max(100, 'Mã mục tối đa 100 ký tự.'),
  commentText: z.string().trim().min(1, 'Nhập nội dung nhận xét.').max(4000, 'Nhận xét tối đa 4.000 ký tự.'),
});

const reasonSchema = z.object({
  reason: z.string().trim().min(1, 'Nhập lý do.').max(4000, 'Lý do tối đa 4.000 ký tự.'),
});

type Tab = 'info' | 'documents' | 'comments' | 'versions' | 'timeline' | 'pdf';

const QUICK_COMMENT_TEMPLATES = [
  'Ảnh chụp/bản scan chưa rõ nét, vui lòng chụp lại góc thẳng đủ 4 góc.',
  'Cần ký và ghi rõ họ tên người làm đơn ở trang cuối.',
  'Thông tin họ tên hoặc ngày sinh chưa khớp chính xác với CCCD.',
  'Vui lòng tải lại bản chính hoặc bản sao có chứng thực theo đúng quy định.',
];

const QUICK_REVISION_TEMPLATES = [
  'Ảnh chụp/bản scan giấy tờ bị mờ, lóa hoặc mất góc, không đối soát được thông tin.',
  'Tờ khai còn thiếu chữ ký hoặc thông tin chưa trùng khớp với giấy tờ tùy thân.',
  'Thiếu thành phần hồ sơ bắt buộc theo quy định, vui lòng bổ sung đầy đủ.',
];

export function OfficerReviewWorkspaceView({
  application,
  onBack,
  onRequestRevision,
  onConfirmReadiness,
}: Props) {
  const user = useAuthStore(s => s.user);
  const detail = useQuery({
    queryKey: ['workflow', 'application', application.id, 'officer', user?.id],
    queryFn: ({ signal }) => workflowApi.getOfficerApplication(application.id, signal),
    enabled: Boolean(user?.id),
  });

  const version = detail.data?.currentVersionNumber ?? application.currentVersion;
  const comments = useApplicationComments(application.id, version);
  const submissions = useOfficerSubmissions(application.id);
  const [submissionId, setSubmissionId] = useState('');
  const [tab, setTab] = useState<Tab>('info');
  const versions = useApplicationVersions(application.id, tab === 'versions');
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(application.currentVersion);
  const diff = useApplicationDiff(application.id, from, to, tab === 'versions');
  const isRefreshing = detail.isFetching || comments.isFetching || submissions.isFetching;
  const addComment = useAddCommentMutation();
  const release = useReleaseApplicationMutation();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const writing = useIsMutating() > 0;
  const [decision, setDecision] = useState<'ready' | 'revision'>();
  const [decisionContext, setDecisionContext] = useState<{ version: number; hadSubmissions: boolean }>();
  const [decisionWarning, setDecisionWarning] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [isGeneratingAiReason, setIsGeneratingAiReason] = useState(false);
  const decisionLock = useRef(false);
  const commentLock = useRef(false);
  const submissionSelect = useRef<HTMLSelectElement>(null);

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { targetId: '', commentText: '' },
  });

  const reasonForm = useForm<z.infer<typeof reasonSchema>>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: '' },
  });

  // Chỉ cảnh báo khi rời workspace với nhận xét chưa lưu; đóng modal quyết định không hỏi lại.
  const guard = useUnsavedChanges(commentForm.formState.isDirty, busy || addComment.isPending);

  const editable =
    !writing &&
    detail.isSuccess &&
    detail.data.status === 'UNDER_REVIEW' &&
    detail.data.assignedOfficerId === user?.id &&
    detail.data.userId !== user?.id;

  const openComments = comments.data?.filter(x => x.status === 'OPEN' && x.versionNumber === version) ?? [];
  const checklists = detail.data?.checklists ?? [];
  const fields = detail.data ? formDataFields(detail.data.formData) : application.eformFields;

  const targets = [
    ...checklists.map(x => ({ id: x.id, label: x.title || x.code || 'Giấy tờ', type: 'CHECKLIST_ITEM' as const })),
    ...fields.map(x => ({ id: x.key, label: x.label, type: 'FORM_FIELD' as const })),
  ];

  const mandatoryChecklists = checklists.filter(x => x.isRequired);
  const completedMandatoryCount = mandatoryChecklists.filter(x => x.status === 'COMPLETED').length;
  const isAllMandatoryCompleted = mandatoryChecklists.length > 0 && completedMandatoryCount === mandatoryChecklists.length;

  const tabs: { id: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Thông tin & giấy tờ', count: checklists.length, icon: <FileText className="h-4 w-4" /> },
    { id: 'documents', label: 'Bản khai & giấy tờ', count: submissions.data?.length, icon: <FileCheck className="h-4 w-4" /> },
    { id: 'comments', label: `Nhận xét (${openComments.length} đang mở)`, count: openComments.length, icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'versions', label: 'Phiên bản & so sánh', icon: <GitCompare className="h-4 w-4" /> },
    { id: 'timeline', label: 'Lịch sử', icon: <History className="h-4 w-4" /> },
    { id: 'pdf', label: 'PDF sau tiền kiểm', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  function openDecision(next: 'ready' | 'revision') {
    if (commentForm.formState.isDirty) {
      setDecisionWarning('Bạn có nhận xét chưa lưu. Hãy lưu hoặc xóa nội dung đang nhập trước khi gửi quyết định.');
      setTab('comments');
      return;
    }
    // Chặn sớm: yêu cầu bổ sung phải dựa trên nhận xét cụ thể để công dân biết cần sửa gì.
    if (next === 'revision' && comments.isSuccess && openComments.length === 0) {
      setDecisionWarning(`Bạn chưa ghi nhận xét nào cho lần nộp này. Hãy ghi rõ điểm công dân cần sửa ở mục “Thêm nhận xét mới” bên dưới, bấm Lưu nhận xét, rồi bấm lại Yêu cầu bổ sung.`);
      setTab('comments');
      return;
    }
    setDecisionWarning('');
    setActionError('');
    setSelectionError('');
    setSubmissionId(submissions.data?.[0]?.id ?? '');
    setDecisionContext({ version, hadSubmissions: Boolean(submissions.data?.length) });
    reasonForm.reset({ reason: '' });
    setDecision(next);
  }

  async function handleGenerateAiReason() {
    if (isGeneratingAiReason || busy) return;
    setIsGeneratingAiReason(true);
    try {
      const missingDocs = mandatoryChecklists
        .filter((c) => c.status !== 'COMPLETED')
        .map((c) => c.title || c.code);

      const commentsList = openComments.map((c) => `${c.fieldLabel}: ${c.commentText}`);

      const issues: string[] = [];
      if (missingDocs.length > 0) {
        issues.push(`Giấy tờ bắt buộc chưa đạt hoặc thiếu: ${missingDocs.join(', ')}`);
      }
      if (commentsList.length > 0) {
        issues.push(`Chi tiết sai sót: ${commentsList.join('; ')}`);
      }
      if (issues.length === 0) {
        issues.push('Hồ sơ cần rà soát lại thông tin theo quy định thủ tục hành chính');
      }

      const prompt = `Bạn đóng vai Cán bộ Một cửa tiếp nhận hồ sơ hành chính cấp Xã/Phường.
Thủ tục: "${application.procedureName}".
Hồ sơ của công dân có các điểm chưa đạt yêu cầu sau:
${issues.map((it, idx) => `${idx + 1}. ${it}`).join('\n')}

Hãy soạn 1 đoạn ngắn (dưới 120 từ), văn phong hành chính trang trọng, lịch sự, nêu rõ lý do từ chối tạm thời và hướng dẫn công dân bổ sung hoặc tải lên lại đúng giấy tờ để được tiền kiểm lại.
Chỉ trả về nội dung lý do để gửi cho người dân, không thêm lời chào/kết thừa.`;

      const res = await aiOcrApi.chat({
        message: prompt,
        wardCode: detail.data?.wardCode || 'WARD_001',
      });

      if (res.answer) {
        reasonForm.setValue('reason', res.answer.trim(), {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast.success('Đã tạo gợi ý lý do bổ sung từ AI!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể kết nối AI. Vui lòng nhập lý do thủ công.';
      toast.error(msg);
    } finally {
      setIsGeneratingAiReason(false);
    }
  }

  async function confirmDecision() {
    if (decisionLock.current || !decision || !decisionContext || !editable) return;
    if (decision === 'revision' && !(await reasonForm.trigger(undefined, { shouldFocus: true }))) return;
    decisionLock.current = true;
    setBusy(true);
    setActionError('');
    setSelectionError('');
    try {
      const current = await detail.refetch();
      if (current.isError) throw current.error;
      const currentApplication = current.data;
      if (
        currentApplication?.status !== 'UNDER_REVIEW' ||
        currentApplication.assignedOfficerId !== user?.id ||
        currentApplication.userId === user?.id ||
        currentApplication.currentVersionNumber !== decisionContext.version
      ) {
        setActionError('Hồ sơ hoặc quyền thụ lý đã thay đổi. Đóng hộp thoại và kiểm tra lại.');
        return;
      }
      if (!Array.isArray(currentApplication.checklists)) {
        throw new Error('Chưa tải được danh sách giấy tờ của hồ sơ. Vui lòng bấm Làm mới dữ liệu.');
      }
      const latestSubmissions = await submissions.refetch();
      if (latestSubmissions.isError) throw latestSubmissions.error;
      const linked = latestSubmissions.data ?? [];
      if (decisionContext.hadSubmissions && !linked.length) {
        setActionError('Danh sách bản khai đã thay đổi. Đóng hộp thoại và kiểm tra lại hồ sơ.');
        return;
      }
      if (
        linked.length &&
        !linked.some(
          x =>
            x.id === submissionId &&
            x.applicationId === application.id &&
            x.applicantId === currentApplication.userId &&
            currentApplication.checklists?.some(item => item.id === x.checklistId && item.formTemplateId === x.templateId),
        )
      ) {
        setSelectionError('Chọn bản khai liên kết đúng mục giấy tờ của hồ sơ hiện tại.');
        submissionSelect.current?.focus();
        return;
      }
      const latest = await comments.refetch();
      if (latest.isError) throw latest.error;
      const open = latest.data?.filter(x => x.status === 'OPEN' && x.versionNumber === decisionContext.version) ?? [];
      if (decision === 'ready' && open.length) {
        setActionError(`Hồ sơ còn ${open.length} nhận xét công dân chưa sửa. Hãy chọn Yêu cầu bổ sung để gửi cho công dân; khi công dân gửi lại bản đã sửa, bạn mới xác nhận được.`);
        return;
      }
      if (decision === 'ready' && currentApplication.checklists?.some(x => x.isRequired && x.status !== 'COMPLETED')) {
        setActionError('Còn giấy tờ bắt buộc chưa hoàn tất. Vui lòng kiểm tra tab Thông tin & giấy tờ.');
        return;
      }
      if (decision === 'revision' && !open.length) {
        setActionError(`Chưa có nhận xét nào về điểm cần sửa. Hãy đóng hộp thoại, ghi và lưu nhận xét ở tab Nhận xét, rồi thử lại.`);
        return;
      }
      const selectedId = linked.length ? submissionId : undefined;
      if (decision === 'ready') await onConfirmReadiness(application.id, selectedId);
      else await onRequestRevision(application.id, reasonForm.getValues('reason').trim(), open.map(x => x.commentText || ''), selectedId);
      // Đóng hộp thoại ngay khi BE xác nhận; không chờ tải lại (Azure mất vài giây) để tránh tưởng bị treo.
      // Yêu cầu bổ sung: trang cha đóng workspace. Sẵn sàng: ở lại, tải lại nền và mở tab PDF.
      setDecision(undefined);
      if (decision === 'ready') {
        setTab('pdf');
        void Promise.all([detail.refetch(), submissions.refetch()]);
      }
    } catch (error) {
      const refreshed = await Promise.all([detail.refetch(), comments.refetch(), submissions.refetch()]);
      const recovery = refreshed.some(result => result.isError)
        ? 'Chưa tải lại được đầy đủ dữ liệu. Kiểm tra kết nối và tải lại trước khi thử tiếp.'
        : 'Trạng thái đã được tải lại; hãy kiểm tra trước khi thử lại.';
      const message =
        axios.isAxiosError(error) && String(error.response?.data?.code ?? '').startsWith('application.')
          ? workflowError(error)
          : documentFormError(error);
      setActionError(`${message} ${recovery}`);
    } finally {
      decisionLock.current = false;
      setBusy(false);
    }
  }

  // Trả hồ sơ về hàng đợi chung; gửi assignmentVersion để BE từ chối nếu phân công vừa đổi (409).
  async function handleRelease(reason: string) {
    await release.mutateAsync({
      id: application.id,
      input: { reason, expectedAssignmentVersion: detail.data?.assignmentVersion },
    });
    setReleaseOpen(false);
    toast.success(`Đã trả hồ sơ ${application.applicationNumber} về hàng đợi.`);
    guard.requestClose(onBack);
  }

  return (
    <article aria-label="Không gian làm việc tiền kiểm hồ sơ" className="space-y-6 pb-16">
      {/* 1. Header Banner & Actions */}
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-2.5">
          <Button
            variant="ghost"
            size="small"
            disabled={busy}
            onClick={() => guard.requestClose(onBack)}
            className="-ml-2 gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách hồ sơ
          </Button>

          <Button
            variant="outline"
            size="small"
            disabled={busy || isRefreshing}
            onClick={async () => {
              await Promise.all([detail.refetch(), comments.refetch(), submissions.refetch()]);
              toast.success('Đã cập nhật dữ liệu hồ sơ mới nhất.');
            }}
            className="gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
            title="Làm mới dữ liệu hồ sơ từ máy chủ (không cần F5)"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-red-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Đang cập nhật…' : 'Làm mới dữ liệu'}</span>
          </Button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {application.applicationNumber}
                </span>
                <Badge
                  variant={
                    detail.data?.status === 'DOCUMENTS_READY'
                      ? 'success'
                      : detail.data?.status === 'UNDER_REVIEW'
                        ? 'warning'
                        : 'neutral'
                  }
                  className="px-2.5 py-0.5 text-xs font-medium"
                >
                  {detail.data?.status === 'DOCUMENTS_READY'
                    ? 'Giấy tờ sẵn sàng'
                    : detail.data?.status === 'UNDER_REVIEW'
                      ? 'Đang kiểm tra'
                      : 'Xem trạng thái hồ sơ'}
                </Badge>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  Phiên bản {version}
                </span>
              </div>
              <h2 className="break-words text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
                {application.procedureName}
              </h2>
            </div>

            {/* Quick action decision buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                variant="outline"
                className="gap-2 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100/70"
                disabled={!editable || busy || !comments.isSuccess || !submissions.isSuccess}
                onClick={() => openDecision('revision')}
              >
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Yêu cầu bổ sung
              </Button>
              <Button
                variant="primary"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                disabled={!editable || busy || !comments.isSuccess || !submissions.isSuccess}
                onClick={() => openDecision('ready')}
              >
                <CheckCircle className="h-4 w-4" />
                Xác nhận giấy tờ sẵn sàng
              </Button>
              {editable && (
                <Button
                  variant="ghost"
                  className="gap-2 text-slate-600 hover:text-slate-900"
                  disabled={busy}
                  onClick={() => setReleaseOpen(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Trả về hàng đợi
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">Giấy tờ bắt buộc</span>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {completedMandatoryCount} / {mandatoryChecklists.length} mục hoàn tất
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">Nhận xét đang mở</span>
              <p className={`mt-1 text-sm font-bold ${openComments.length ? 'text-amber-700' : 'text-slate-800'}`}>
                {openComments.length} nhận xét cần sửa
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">Bản khai Word</span>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {submissions.data?.length ?? 0} bản khai liên kết
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">Thẩm quyền xử lý</span>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {editable ? 'Đang được phân công' : 'Chế độ chỉ xem'}
              </p>
            </div>
          </div>

          {detail.isError && (
            <div role="alert" className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{workflowError(detail.error)}</p>
              <Button size="small" variant="outline" onClick={() => void detail.refetch()}>Tải lại hồ sơ</Button>
            </div>
          )}

          {submissions.isError && (
            <div role="alert" className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{documentFormError(submissions.error)}</p>
              <Button size="small" variant="outline" onClick={() => void submissions.refetch()}>Tải lại bản khai</Button>
            </div>
          )}

          {!editable && detail.isSuccess && (
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              Chỉ cán bộ được phân công mới được ghi nhận xét khi hồ sơ đang kiểm tra. Hồ sơ ở trạng thái khác chỉ được xem.
            </p>
          )}

          {decisionWarning && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <p>{decisionWarning}</p>
            </div>
          )}

          {/* Navigation Tabs Bar */}
          <nav aria-label="Nội dung kiểm tra" className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {tabs.map(x => {
              const active = tab === x.id;
              return (
                <Button
                  key={x.id}
                  variant={active ? 'primary' : 'ghost'}
                  size="small"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setTab(x.id)}
                  className={`gap-2 rounded-xl font-medium transition ${
                    active
                      ? 'shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {x.icon}
                  {x.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 2. Main Workspace Body */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        {/* Tab 1: Info & Checklist */}
        {tab === 'info' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Thông tin người nộp</h3>
              <p className="mt-0.5 text-xs text-slate-500">Thông tin kê khai chưa phải xác minh danh tính hay xác nhận đủ điều kiện pháp lý.</p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map(x => (
                  <div key={x.key} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 transition hover:bg-slate-50">
                    <dt className="text-xs font-medium text-slate-500">{x.label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                      {x.value || 'Chưa có thông tin'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Danh mục giấy tờ</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Danh mục giấy tờ và tài liệu công dân cần cung cấp.</p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {completedMandatoryCount}/{mandatoryChecklists.length} mục bắt buộc
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {checklists.map(x => {
                  const completed = x.status === 'COMPLETED';
                  return (
                    <div
                      key={x.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50/50"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span
                          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                            completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-slate-800 break-words">{x.title || x.code}</h4>
                            <Badge variant={x.isRequired ? 'danger' : 'neutral'} className="text-[10px] px-2">
                              {x.isRequired ? 'Bắt buộc' : 'Tùy chọn'}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {x.quantity} bản · {completed ? 'Công dân đã chuẩn bị' : 'Chưa hoàn tất'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="small"
                          variant="outline"
                          disabled={!editable}
                          onClick={() => {
                            commentForm.setValue('targetId', x.id);
                            setTab('comments');
                          }}
                          className="gap-1.5"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          Nhận xét
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Documents Panel */}
        {tab === 'documents' && (
          <OfficerDocumentsPanel
            applicationId={application.id}
            editable={editable && !busy}
            onComment={id => {
              commentForm.setValue('targetId', id);
              setTab('comments');
            }}
            referenceData={fields.map(f => ({ label: f.label, value: String(f.value || 'Chưa có thông tin') }))}
          />
        )}

        {/* Tab 3: Comments & Contextual Review */}
        {tab === 'comments' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Nhận xét trên phiên bản {version}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Các nhận xét cần công dân lưu ý chỉnh sửa trước khi hồ sơ sẵn sàng.
                  </p>
                </div>
                <Badge variant={openComments.length ? 'warning' : 'success'} className="px-2.5 text-xs">
                  {openComments.length} nhận xét đang mở
                </Badge>
              </div>

              {comments.isPending && (
                <div role="status" aria-label="Đang tải nhận xét" className="mt-4 space-y-2">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              )}
              {comments.isError && (
                <div role="alert" className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p>{workflowError(comments.error)}</p>
                  <Button size="small" variant="outline" onClick={() => void comments.refetch()}>Thử lại nhận xét</Button>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {comments.data?.map(x => {
                  const isOpen = x.status === 'OPEN';
                  return (
                    <div
                      key={x.id}
                      className={`space-y-2 rounded-xl border p-4 transition ${
                        isOpen ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{x.fieldLabel}</span>
                        <Badge variant={isOpen ? 'warning' : 'success'} className="text-xs">
                          {isOpen ? 'Cần chỉnh sửa' : 'Đã xử lý'}
                        </Badge>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-700 leading-relaxed">
                        {x.commentText}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(x.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {comments.isSuccess && !comments.data?.length && (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">Chưa có nhận xét trên phiên bản này</p>
                  <p className="mt-0.5 text-xs text-slate-400">Nếu hồ sơ đủ điều kiện, bạn có thể chuyển sang xác nhận giấy tờ sẵn sàng.</p>
                </div>
              )}
            </div>

            {/* Comment Form with Quick Suggestions */}
            <form
              className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
              noValidate
              onSubmit={commentForm.handleSubmit(async values => {
                if (commentLock.current || !editable) return;
                const target = targets.find(x => x.id === values.targetId);
                if (!target) {
                  commentForm.setError('targetId', { message: 'Mục không còn trong hồ sơ hiện tại.' });
                  return;
                }
                if (!target.label.trim() || target.label.length > 255) {
                  commentForm.setError('targetId', {
                    message: 'Tên mục nhận xét phải có nội dung và không vượt quá 255 ký tự. Vui lòng kiểm tra dữ liệu hồ sơ.',
                  });
                  return;
                }
                commentLock.current = true;
                setCommentError('');
                try {
                  await addComment.mutateAsync({
                    id: application.id,
                    input: {
                      versionNumber: version,
                      targetType: target.type,
                      targetId: target.id,
                      fieldLabel: target.label,
                      commentText: values.commentText,
                    },
                  });
                  commentForm.reset({ targetId: '', commentText: '' });
                  setDecisionWarning('');
                } catch (error) {
                  setCommentError(workflowError(error));
                } finally {
                  commentLock.current = false;
                }
              })}
            >
              <h4 className="font-bold text-slate-900">Thêm nhận xét mới</h4>

              <label className="grid gap-1.5 text-sm font-semibold" htmlFor="comment-target">
                Mục cần nhận xét
                <select
                  id="comment-target"
                  className="min-h-11 rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-800 shadow-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  disabled={!editable || addComment.isPending}
                  aria-invalid={Boolean(commentForm.formState.errors.targetId)}
                  aria-describedby="comment-target-error"
                  {...commentForm.register('targetId')}
                >
                  <option value="">Chọn mục cần nhận xét</option>
                  {targets.map(x => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </label>
              <p id="comment-target-error" role="alert" className="text-xs text-red-700">
                {commentForm.formState.errors.targetId?.message}
              </p>

              {/* Quick Suggestion Chips */}
              {editable && (
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Gợi ý nhận xét nhanh:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_COMMENT_TEMPLATES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const current = commentForm.getValues('commentText');
                          commentForm.setValue('commentText', current ? `${current}\n${tpl}` : tpl, { shouldDirty: true });
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        + {tpl.slice(0, 42)}…
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Input
                label="Nội dung nhận xét"
                maxLength={4000}
                required
                disabled={!editable || addComment.isPending}
                {...commentForm.register('commentText')}
                error={commentForm.formState.errors.commentText?.message}
              />

              {commentError && (
                <p role="alert" className="text-xs text-red-700">
                  {commentError}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" loading={addComment.isPending} disabled={!editable}>
                  Lưu nhận xét vào hồ sơ
                </Button>
                {commentForm.formState.isDirty && (
                  <Button
                    variant="outline"
                    disabled={busy || addComment.isPending}
                    onClick={() => {
                      commentForm.reset({ targetId: '', commentText: '' });
                      setCommentError('');
                      setDecisionWarning('');
                    }}
                  >
                    Xóa nội dung đang nhập
                  </Button>
                )}
              </div>
            </form>
            <p className="text-xs text-slate-500">
              Nhận xét cũ được xử lý khi công dân gửi lại hồ sơ. Chưa hỗ trợ xóa hoặc đổi trạng thái nhận xét thủ công.
            </p>
          </div>
        )}

        {/* Tab 4: Versions & Diff */}
        {tab === 'versions' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Phiên bản và so sánh dữ liệu</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                So sánh dữ liệu JSON đã chụp; chưa hỗ trợ xem lại tệp nhị phân theo phiên bản cũ.
              </p>
            </div>

            {versions.isError && <p role="alert" className="text-sm text-red-700">{workflowError(versions.error)}</p>}

            <div className="flex flex-wrap items-center gap-3">
              {(['from', 'to'] as const).map(side => (
                <label key={side} className="grid gap-1.5 text-xs font-semibold text-slate-600">
                  {side === 'from' ? 'Phiên bản nguồn' : 'Phiên bản đích'}
                  <select
                    className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    value={side === 'from' ? from : to}
                    onChange={e => (side === 'from' ? setFrom(Number(e.target.value)) : setTo(Number(e.target.value)))}
                  >
                    {versions.data?.map(x => (
                      <option key={x.id} value={x.versionNumber}>
                        v{x.versionNumber}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {from >= to ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                Chọn phiên bản đích lớn hơn phiên bản nguồn để so sánh.
              </p>
            ) : diff.isPending ? (
              <div role="status" aria-label="Đang so sánh phiên bản" className="space-y-3 py-1">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : diff.isError ? (
              <p role="alert" className="text-sm text-red-700">{workflowError(diff.error)}</p>
            ) : (
              <div className="space-y-3">
                {diff.data?.map((x, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{x.fieldLabel || x.fieldKey}</span>
                      <Badge variant={x.hasChanged ? 'warning' : 'neutral'} className="text-xs">
                        {x.hasChanged ? 'Đã thay đổi' : 'Không đổi'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <span className="font-semibold text-slate-500">Trước:</span>
                        <p className="mt-1 break-all text-slate-700">{JSON.stringify(x.oldValue)}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50/60 p-2.5">
                        <span className="font-semibold text-emerald-700">Sau:</span>
                        <p className="mt-1 break-all text-emerald-900">{JSON.stringify(x.newValue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Timeline */}
        {tab === 'timeline' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lịch sử trạng thái</h3>
              <p className="mt-0.5 text-xs text-slate-500">Quá trình thụ lý và cập nhật tiến trình hồ sơ.</p>
            </div>
            <div className="space-y-3">
              {detail.data?.history?.map(x => (
                <div key={x.id} className="relative rounded-xl border border-slate-200 p-4 pl-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">
                      {x.fromStatus || 'Khởi tạo'} → <span className="text-red-700">{x.toStatus}</span>
                    </p>
                    <time className="text-xs text-slate-400">
                      {new Date(x.createdAt).toLocaleString('vi-VN')}
                    </time>
                  </div>
                  {x.reason && <p className="mt-1.5 text-sm text-slate-600">{x.reason}</p>}
                </div>
              ))}
            </div>
            {Boolean(detail.data?.assignmentHistory?.length) && (
              <section aria-labelledby="assignment-history-title" className="space-y-3">
                <h3 id="assignment-history-title" className="text-lg font-bold text-slate-900">Lịch sử phân công</h3>
                {detail.data?.assignmentHistory?.map((h) => {
                  const item = mapAssignmentHistoryToTimelineItem(h, {
                    currentOfficer: user?.id ? { id: user.id, name: 'Bạn' } : undefined,
                    directory: detail.data?.assignedOfficerId && detail.data.assignedOfficerName
                      ? { [detail.data.assignedOfficerId.toLowerCase()]: detail.data.assignedOfficerName }
                      : undefined,
                  });
                  return (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-4 pl-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{item.title}</p>
                        <time className="text-xs text-slate-400">{item.time}</time>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Thực hiện: {item.actor}</p>
                      {item.description && <p className="mt-1.5 text-sm text-slate-600">{item.description}</p>}
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        )}

        {/* Tab 6: PDF */}
        {tab === 'pdf' && (
          <div>
            {['DOCUMENTS_READY', 'APPROVED'].includes(detail.data?.status ?? '') ? (
              <GeneratedDocumentsPanel applicationId={application.id} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" />
                <h4 className="mt-3 font-semibold text-slate-700">Bản PDF chưa sẵn sàng</h4>
                <p className="mt-1 text-sm text-slate-500">
                  PDF chỉ được tạo khi hồ sơ đã được xác nhận giấy tờ sẵn sàng. Mở tab “Bản khai & giấy tờ” để xem DOCX hiện tại.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Decision Modal with Pre-flight Verification */}
      <Modal
        open={Boolean(decision)}
        onOpenChange={open => {
          if (!open && !busy) setDecision(undefined);
        }}
        title={decision === 'ready' ? 'Xác nhận giấy tờ sẵn sàng' : 'Yêu cầu bổ sung hồ sơ'}
        description="Thao tác áp dụng cho toàn bộ hồ sơ và các bản khai liên quan. Xác nhận giấy tờ sẵn sàng không phải tiếp nhận chính thức hay quyết định giải quyết thủ tục."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Lần nộp đang kiểm tra: {decisionContext?.version}</p>

          {/* Pre-flight Condition Checklist for 'ready' */}
          {decision === 'ready' && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Điều kiện để xác nhận
              </span>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-2">
                  {isAllMandatoryCompleted ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span className={isAllMandatoryCompleted ? 'text-emerald-900 font-medium' : 'text-amber-900'}>
                    Giấy tờ bắt buộc: {completedMandatoryCount}/{mandatoryChecklists.length} mục đã hoàn tất
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {openComments.length === 0 ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span className={openComments.length === 0 ? 'text-emerald-900 font-medium' : 'text-red-900 font-medium'}>
                    Nhận xét cần công dân sửa: {openComments.length === 0 ? 'Không còn' : `Còn ${openComments.length} nhận xét chưa sửa`}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {submissions.isPending && (
            <div role="status" aria-label="Đang tải bản khai" className="space-y-2 py-2">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          )}
          {submissions.isError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{documentFormError(submissions.error)}</p>
              <Button size="small" variant="outline" className="mt-2" onClick={() => void submissions.refetch()}>
                Tải lại bản khai
              </Button>
            </div>
          )}

          {Boolean(submissions.data?.length) && (
            <label className="grid gap-1.5 text-sm font-semibold" htmlFor="decision-submission">
              Bản khai đang kiểm tra
              <select
                ref={submissionSelect}
                id="decision-submission"
                className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white p-2.5 text-sm"
                disabled={busy}
                value={submissionId}
                aria-invalid={Boolean(selectionError)}
                aria-describedby={selectionError ? 'decision-submission-error' : undefined}
                onChange={e => {
                  setSubmissionId(e.target.value);
                  setSelectionError('');
                }}
              >
                <option value="">Chọn bản khai</option>
                {submissions.data?.map(x => (
                  <option key={x.id} value={x.id}>
                    {x.fileName}
                  </option>
                ))}
              </select>
              {selectionError && (
                <span id="decision-submission-error" role="alert" className="text-xs text-red-700">
                  {selectionError}
                </span>
              )}
            </label>
          )}

          {submissions.isSuccess && !submissions.data?.length && (
            <p className="text-sm text-slate-600">
              Hồ sơ không có bản khai điện tử. Thao tác được thực hiện trực tiếp trên hồ sơ.
            </p>
          )}

          {decision === 'revision' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800" htmlFor="decision-revision-reason">
                  Lý do yêu cầu bổ sung <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  disabled={isGeneratingAiReason || busy}
                  onClick={() => void handleGenerateAiReason()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors disabled:opacity-50"
                  title="Dùng AI tổng hợp lỗi checklist thành văn bản hành chính lịch sự"
                >
                  <Sparkles className={`size-3.5 ${isGeneratingAiReason ? 'animate-spin text-purple-600' : ''}`} />
                  <span>{isGeneratingAiReason ? 'Đang tạo văn bản...' : 'AI gợi ý lý do'}</span>
                </button>
              </div>

              {/* Mẫu nhanh hành chính */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Mẫu nhanh:</span>
                {QUICK_REVISION_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => reasonForm.setValue('reason', tpl, { shouldValidate: true, shouldDirty: true })}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-left truncate max-w-[220px]"
                    title={tpl}
                  >
                    {tpl}
                  </button>
                ))}
              </div>

              <textarea
                id="decision-revision-reason"
                rows={4}
                maxLength={4000}
                disabled={busy}
                placeholder="Nhập chi tiết các nội dung công dân cần chỉnh sửa, bổ sung..."
                {...reasonForm.register('reason')}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 focus:border-red-600 focus:outline-none focus:ring-3 focus:ring-red-100 disabled:opacity-50"
              />
              {reasonForm.formState.errors.reason?.message && (
                <span role="alert" className="text-xs text-red-600 font-medium">
                  {reasonForm.formState.errors.reason.message}
                </span>
              )}
            </div>
          )}

          {actionError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {actionError}
            </p>
          )}

          <Button
            loading={busy}
            disabled={!editable || !comments.isSuccess || !submissions.isSuccess}
            onClick={() => void confirmDecision()}
            className="w-full"
          >
            Xác nhận quyết định
          </Button>
        </div>
      </Modal>

      <ReleaseApplicationModal
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        applicationNumber={application.applicationNumber}
        onConfirm={handleRelease}
      />

      {guard.confirmation}
    </article>
  );
}
