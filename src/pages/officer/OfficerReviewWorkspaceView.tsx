import { checklistQuantityLabel } from '@/lib/procedureDisplay';
import { ChatCircleDots } from '@phosphor-icons/react';
import { ApplicationConsultations } from '@/components/staffing/ConsultationsView';
import { useRef, useState, useEffect } from 'react';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Badge, Button, ListSelect, Modal, RefreshButton, Skeleton, toast, EmptyState, ErrorAlert } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useAddCommentMutation, useWithdrawCommentMutation, useApplicationComments, useApplicationDiff, useApplicationVersions, useReleaseApplicationMutation } from '@/hooks/useWorkflow';
import { compareSubmissionSnapshots, diffFieldLabel, diffValueText, humanizeFieldName, workflowStatusLabel, formDataFields, mapAssignmentHistoryToTimelineItem } from '@/lib/api/workflowAdapters';
import { ReleaseApplicationModal } from '@/components/workflow/AssignmentModals';
import { workflowApi, workflowError } from '@/lib/api/workflow';
import { OfficerDocumentsPanel } from './OfficerDocumentsPanel';
import { DossierAiReviewCard } from '@/components/documents/DossierAiReviewCard';
import { GeneratedDocumentsPanel } from '@/pages/citizen/components/GeneratedDocumentsPanel';
import { useOfficerSubmissions } from '@/hooks/useDocumentForms';
import { documentFormError } from '@/lib/api/documentForms';
import { aiOcrApi, getAiRetryAfterSeconds, type DossierAssistResultDto } from '@/lib/api/aiOcr';
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
  targetId: z.string().min(1, 'Chọn mục cần nhận xét.').max(100, 'Mục giấy tờ không hợp lệ. Vui lòng tải lại hồ sơ.'),
  commentText: z.string().trim().min(1, 'Nhập nội dung nhận xét.').max(4000, 'Nhận xét tối đa 4.000 ký tự.'),
});

const reasonSchema = z.object({
  reason: z.string().trim().min(1, 'Nhập lý do.').max(4000, 'Lý do tối đa 4.000 ký tự.'),
});

type Tab = 'consultations' | 'info' | 'documents' | 'comments' | 'versions' | 'timeline' | 'pdf';

const QUICK_COMMENT_TEMPLATES = [
  'Ảnh chụp/bản scan chưa rõ nét, vui lòng chụp lại góc thẳng đủ 4 góc.',
  'Cần ký và ghi rõ họ tên người làm đơn ở trang cuối.',
  'Thông tin họ tên hoặc ngày sinh chưa khớp chính xác với CCCD.',
  'Vui lòng tải lại bản chính hoặc bản sao có chứng thực theo đúng quy định.',
];

const QUICK_REVISION_TEMPLATES = [
  'Ảnh chụp/bản scan giấy tờ bị mờ, lóa hoặc mất góc, không đối chiếu được thông tin.',
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
  const snapshotDiff = compareSubmissionSnapshots(versions.data?.find(item => item.versionNumber === from)?.snapshotData, versions.data?.find(item => item.versionNumber === to)?.snapshotData);
  const comparedFields = snapshotDiff ?? diff.data;
  const isRefreshing = detail.isFetching || comments.isFetching || submissions.isFetching;
  const addComment = useAddCommentMutation();
  const withdrawCommentMutation = useWithdrawCommentMutation();
  const [withdrawingComment, setWithdrawingComment] = useState<{ id: string; fieldLabel?: string | null; commentText?: string | null } | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
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
  const [dossierAiResult, setDossierAiResult] = useState<DossierAssistResultDto | null>(null);
  const [dossierAiLoading, setDossierAiLoading] = useState(false);
  const [dossierAiError, setDossierAiError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
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

  // WF-ASSIGN-REL-01: cán bộ đang thụ lý được trả hồ sơ đang kiểm tra hoặc đang chờ người dân bổ sung
  const releaseVariant = detail.data?.status === 'NEED_REVISION' ? 'revision' : 'queue';
  const canRelease =
    !writing &&
    detail.isSuccess &&
    ['UNDER_REVIEW', 'NEED_REVISION'].includes(detail.data.status) &&
    detail.data.assignedOfficerId === user?.id &&
    detail.data.userId !== user?.id;

  const isManager = Boolean(user?.roles.includes('WARD_MANAGER'));
  const canVerifyAi = Boolean(detail.data?.assignedOfficerId === user?.id && !isManager);

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
    { id: 'documents', label: 'Tờ khai & giấy tờ', count: submissions.data?.length, icon: <FileCheck className="h-4 w-4" /> },
    { id: 'comments', label: `Nhận xét (${openComments.length} đang mở)`, count: openComments.length, icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'versions', label: 'So sánh các lần gửi', icon: <GitCompare className="h-4 w-4" /> },
    ...(user?.permissions.includes('workflow.consultation.read') ? [{ id: 'consultations' as const, label: 'Tham vấn chuyên môn', icon: <FileText className="h-4 w-4" /> }] : []),
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
      setDecisionWarning(`Bạn chưa ghi nhận xét nào cho lần gửi này. Hãy ghi rõ điểm công dân cần sửa ở mục “Thêm nhận xét mới” bên dưới, bấm Lưu nhận xét, rồi bấm lại Yêu cầu bổ sung.`);
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

  useEffect(() => {
    if (!retryCountdown || retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown(prev => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const handleRunDossierAi = async () => {
    if (dossierAiLoading || !canVerifyAi) return;
    setDossierAiLoading(true);
    setDossierAiError(null);
    try {
      const data = await aiOcrApi.dossierAssist(application.id);
      setDossierAiResult(data);
      toast.success('AI đã hoàn tất kiểm tra và đối chiếu hồ sơ.');
    } catch (err: unknown) {
      const retrySec = getAiRetryAfterSeconds(err);
      if (retrySec) {
        setRetryCountdown(retrySec);
      }
      setDossierAiError(err instanceof Error ? err.message : 'Chưa thể kiểm tra hồ sơ bằng AI.');
    } finally {
      setDossierAiLoading(false);
    }
  };

  async function handleGenerateAiReason() {
    if (isGeneratingAiReason || busy) return;
    const wardCode = detail.data?.wardCode;
    if (!wardCode) {
      toast.error('Chưa xác định được phường/xã của hồ sơ. Vui lòng nhập lý do thủ công.');
      return;
    }
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
        wardCode,
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
        throw new Error('Chưa tải được danh sách giấy tờ của hồ sơ. Vui lòng bấm nút Làm mới.');
      }
      const latestSubmissions = await submissions.refetch();
      if (latestSubmissions.isError) throw latestSubmissions.error;
      const linked = latestSubmissions.data ?? [];
      if (decisionContext.hadSubmissions && !linked.length) {
        setActionError('Danh sách tờ khai đã thay đổi. Đóng hộp thoại và kiểm tra lại hồ sơ.');
        return;
      }
      if (
        linked.length &&
        !linked.some(
          x =>
            x.id === submissionId &&
            x.applicationId === application.id &&
            x.applicantId === currentApplication.userId &&
            // Giấy tờ gắn nhiều mẫu (BE-H forms[]): tờ khai theo mẫu nào trong số đó cũng hợp lệ
            currentApplication.checklists?.some(item => item.id === x.checklistId && (item.formTemplateId === x.templateId || item.forms?.some(f => f.formTemplateId === x.templateId))),
        )
      ) {
        setSelectionError('Chọn tờ khai liên kết đúng mục giấy tờ của hồ sơ hiện tại.');
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
    toast.success(releaseVariant === 'revision'
      ? `Đã trả lại hồ sơ ${application.applicationNumber}. Khi người dân nộp lại, hồ sơ vào hàng chờ chung.`
      : `Đã trả hồ sơ ${application.applicationNumber} về hàng đợi.`);
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

          <RefreshButton
            label="Làm mới dữ liệu hồ sơ"
            loading={isRefreshing}
            disabled={busy}
            onClick={() => void Promise.all([detail.refetch(), comments.refetch(), submissions.refetch()]).then(() => toast.success('Đã cập nhật dữ liệu hồ sơ mới nhất.'))}
          />
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
              {canRelease && (
                <Button
                  variant="ghost"
                  className="gap-2 text-slate-600 hover:text-slate-900"
                  disabled={busy}
                  onClick={() => setReleaseOpen(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  {releaseVariant === 'revision' ? 'Trả lại hồ sơ' : 'Trả về hàng đợi'}
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
              <span className="text-xs font-medium text-slate-500">Tờ khai Word</span>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {submissions.data?.length ?? 0} tờ khai liên kết
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
            <ErrorAlert className="mt-4" retryLabel="Tải lại hồ sơ" retrying={detail.isFetching} onRetry={() => void detail.refetch()}>{workflowError(detail.error)}</ErrorAlert>
          )}

          {submissions.isError && (
            <ErrorAlert className="mt-4" retryLabel="Tải lại tờ khai" retrying={submissions.isFetching} onRetry={() => void submissions.refetch()}>{documentFormError(submissions.error)}</ErrorAlert>
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
              <h3 className="text-lg font-bold text-slate-900">Thông tin người gửi</h3>
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
                            {checklistQuantityLabel(x)} · {completed ? 'Công dân đã chuẩn bị' : 'Chưa hoàn tất'}
                          </p>
                          {(x.conditionNote || x.itemNote) && (
                            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">
                              {[x.conditionNote, x.itemNote !== x.conditionNote ? x.itemNote : null].filter(Boolean).join('\n')}
                            </p>
                          )}
                          {(x.forms?.length ?? 0) > 0 && (
                            <p className="mt-1 text-xs text-slate-600">
                              <span className="font-semibold text-slate-700">
                                {x.forms!.length > 1 ? 'Mẫu đơn (điền một trong các mẫu): ' : 'Mẫu đơn: '}
                              </span>
                              {x.forms!.map(f => f.formName || f.formCode).join('; ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {completed && canVerifyAi && (
                          <Button
                            size="small"
                            variant="ghost"
                            onClick={() => setTab('documents')}
                            className="gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50"
                            title="Mở tab tài liệu để xem tệp và đối chiếu bằng AI"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                            <span>Tài liệu & AI</span>
                          </Button>
                        )}
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
        {tab === 'consultations' && <ApplicationConsultations applicationId={application.id} context={detail.data} />}

        {tab === 'documents' && (
          <div className="space-y-6">
            <DossierAiReviewCard
              result={dossierAiResult}
              loading={dossierAiLoading}
              error={dossierAiError}
              retryCountdown={retryCountdown}
              onRunReview={() => void handleRunDossierAi()}
              onApplyComment={suggested => {
                commentForm.setValue('commentText', suggested);
                setTab('comments');
                toast.success('Đã chèn nội dung gợi ý vào ô nhận xét.');
              }}
              canReview={canVerifyAi}
              disabled={busy || writing}
            />

            <OfficerDocumentsPanel
              applicationId={application.id}
              applicationNumber={application.applicationNumber}
              editable={editable && !busy}
              canVerify={canVerifyAi}
              onComment={id => {
                commentForm.setValue('targetId', id);
                setTab('comments');
              }}
              referenceData={fields.map(f => ({ label: f.label, value: String(f.value || 'Chưa có thông tin') }))}
            />
          </div>
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
                <ErrorAlert className="mt-4" retryLabel="Thử lại nhận xét" retrying={comments.isFetching} onRetry={() => void comments.refetch()}>{workflowError(comments.error)}</ErrorAlert>
              )}

              <div className="mt-4 space-y-3">
                {comments.data?.map(x => {
                  const isOpen = x.status === 'OPEN';
                  const isWithdrawn = x.status === 'WITHDRAWN';
                  return (
                    <div
                      key={x.id}
                      className={`space-y-2 rounded-xl border p-4 transition ${
                        isWithdrawn
                          ? 'border-slate-200 bg-slate-100/60 opacity-80'
                          : isOpen
                          ? 'border-amber-200 bg-amber-50/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{humanizeFieldName(x.fieldLabel || 'Nhận xét')}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isWithdrawn ? 'neutral' : isOpen ? 'warning' : 'success'}
                            className="text-xs"
                          >
                            {isWithdrawn ? 'Đã rút nhận xét' : isOpen ? 'Cần chỉnh sửa' : 'Đã xử lý'}
                          </Badge>
                          {editable && isOpen && (
                            <Button
                              size="small"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-red-700 hover:bg-red-50 hover:text-red-900 font-semibold"
                              onClick={() => {
                                setWithdrawingComment({
                                  id: x.id,
                                  fieldLabel: x.fieldLabel,
                                  commentText: x.commentText,
                                });
                                setWithdrawReason('');
                                setWithdrawError('');
                              }}
                            >
                              Rút nhận xét
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-700 leading-relaxed">
                        {x.commentText}
                      </p>
                      {isWithdrawn && x.withdrawReason && (
                        <div className="mt-1 rounded-lg bg-slate-200/50 p-2 text-xs text-slate-600">
                          <span className="font-semibold">Lý do rút: </span>
                          <span>{x.withdrawReason}</span>
                          {x.withdrawnAt && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Thời gian: {new Date(x.withdrawnAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(x.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {comments.isSuccess && !comments.data?.length && (
                <EmptyState
                  className="mt-4 rounded-xl border border-dashed border-slate-200 py-6"
                  icon={ChatCircleDots}
                  title="Chưa có nhận xét trên phiên bản này"
                  description="Nếu hồ sơ đủ điều kiện, bạn có thể chuyển sang xác nhận giấy tờ sẵn sàng."
                />
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
                    message: 'Mục giấy tờ không hợp lệ. Vui lòng tải lại hồ sơ.',
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
                <Controller control={commentForm.control} name="targetId" render={({ field, fieldState }) => (
                  <ListSelect id="comment-target" value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                    disabled={!editable || addComment.isPending} invalid={Boolean(fieldState.error)} describedBy="comment-target-error"
                    searchable placeholder="Chọn mục cần nhận xét" options={targets.map(item => ({ value: item.id, label: item.label }))} />
                )} />
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="comment-text-input" className="block text-xs font-bold text-slate-700">
                    Nội dung nhận xét <span className="text-red-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {commentForm.watch('commentText')?.length || 0}/4.000 ký tự
                  </span>
                </div>
                <textarea
                  id="comment-text-input"
                  rows={4}
                  maxLength={4000}
                  required
                  disabled={!editable || addComment.isPending}
                  placeholder="Nhập nội dung nhận xét chi tiết gửi cho công dân..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:bg-slate-100 disabled:opacity-75"
                  aria-invalid={Boolean(commentForm.formState.errors.commentText)}
                  aria-describedby={commentForm.formState.errors.commentText ? 'comment-text-error' : undefined}
                  {...commentForm.register('commentText')}
                />
                {commentForm.formState.errors.commentText && (
                  <p id="comment-text-error" role="alert" className="text-xs text-red-700">
                    {commentForm.formState.errors.commentText.message}
                  </p>
                )}
              </div>

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
              <h3 className="text-lg font-bold text-slate-900">So sánh các lần gửi</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Đối chiếu thông tin và danh mục giấy tờ giữa hai lần gửi. Chưa hỗ trợ mở lại nội dung tệp đính kèm cũ theo phiên bản.
              </p>
            </div>

            {versions.isError && <p role="alert" className="text-sm text-red-700">{workflowError(versions.error)}</p>}

            <div className="flex flex-wrap items-center gap-3">
              {(['from', 'to'] as const).map(side => (
                <label key={side} className="grid gap-1.5 text-xs font-semibold text-slate-600">
                  {side === 'from' ? 'Lần gửi trước' : 'Lần gửi sau'}
                  <select
                    className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm"
                    value={side === 'from' ? from : to}
                    onChange={e => (side === 'from' ? setFrom(Number(e.target.value)) : setTo(Number(e.target.value)))}
                  >
                    {versions.data?.map(x => (
                      <option key={x.id} value={x.versionNumber}>
                        Lần gửi {x.versionNumber}
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
            ) : snapshotDiff === undefined && diff.isPending ? (
              <div role="status" aria-label="Đang so sánh phiên bản" className="space-y-3 py-1">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : snapshotDiff === undefined && diff.isError ? (
              <p role="alert" className="text-sm text-red-700">{workflowError(diff.error)}</p>
            ) : (
              <div className="space-y-3">
                {comparedFields?.length === 0 && <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Hai lần gửi không có thay đổi về thông tin hoặc danh mục giấy tờ.</p>}
                {comparedFields?.map((x, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <span className="min-w-0 break-words font-semibold text-slate-800">{diffFieldLabel(x.fieldKey || '', x.fieldLabel)}</span>
                      <Badge variant={x.hasChanged ? 'warning' : 'neutral'} className="text-xs">
                        {x.hasChanged ? 'Đã thay đổi' : 'Không đổi'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <span className="font-semibold text-slate-500">Trước:</span>
                        <p className="mt-1 break-all text-slate-700">{diffValueText(x.oldValue, x.oldExists, x.fieldKey || '')}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50/60 p-2.5">
                        <span className="font-semibold text-emerald-700">Sau:</span>
                        <p className="mt-1 break-all text-emerald-900">{diffValueText(x.newValue, x.newExists, x.fieldKey || '')}</p>
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
                      {x.fromStatus ? workflowStatusLabel(x.fromStatus) : 'Khởi tạo'} → <span className="text-red-700">{workflowStatusLabel(x.toStatus)}</span>
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
                  PDF chỉ được tạo khi hồ sơ đã được xác nhận giấy tờ sẵn sàng. Mở tab “Tờ khai & giấy tờ” để xem DOCX hiện tại.
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
        description="Thao tác áp dụng cho toàn bộ hồ sơ và các tờ khai liên quan. Xác nhận giấy tờ sẵn sàng không phải tiếp nhận chính thức hay quyết định giải quyết thủ tục."
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
            <div role="status" aria-label="Đang tải tờ khai" className="space-y-2 py-2">
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          )}
          {submissions.isError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p>{documentFormError(submissions.error)}</p>
              <Button size="small" variant="outline" className="mt-2" onClick={() => void submissions.refetch()}>
                Tải lại tờ khai
              </Button>
            </div>
          )}

          {Boolean(submissions.data?.length) && (
            <label className="grid gap-1.5 text-sm font-semibold" htmlFor="decision-submission">
              Tờ khai đang kiểm tra
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
                <option value="">Chọn tờ khai</option>
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
              Hồ sơ không có tờ khai điện tử. Thao tác được thực hiện trực tiếp trên hồ sơ.
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
                  title="Dùng AI soạn lý do bổ sung từ các mục giấy tờ chưa đạt"
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
            <ErrorAlert>{actionError}</ErrorAlert>
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
        variant={releaseVariant}
      />

      {withdrawingComment && (
        <Modal
          open={Boolean(withdrawingComment)}
          onOpenChange={(open) => { if (!open) setWithdrawingComment(null); }}
          title="Rút nhận xét khỏi hồ sơ"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Bạn đang rút nhận xét cho mục: <strong className="text-slate-900">{withdrawingComment.fieldLabel}</strong>.
              Nhận xét đã rút sẽ không còn tính là lỗi chưa giải quyết và không hiển thị cho công dân.
            </p>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-amber-900">
              <span className="font-semibold">Nội dung nhận xét:</span>
              <p className="mt-0.5 whitespace-pre-wrap italic">{withdrawingComment.commentText}</p>
            </div>
            <div>
              <label htmlFor="withdraw-reason" className="font-semibold text-slate-800 block mb-1">
                Lý do rút nhận xét <span className="text-red-600">*</span>
              </label>
              <textarea
                id="withdraw-reason"
                rows={3}
                value={withdrawReason}
                onChange={e => setWithdrawReason(e.target.value)}
                placeholder="Nhập lý do rút nhận xét (từ 5 đến 500 ký tự)..."
                maxLength={500}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-red-700"
              />
              <span className="text-[11px] text-slate-400 block text-right mt-0.5">
                {withdrawReason.trim().length}/500 ký tự (tối thiểu 5 ký tự)
              </span>
            </div>
            {withdrawError && (
              <ErrorAlert>{withdrawError}</ErrorAlert>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="small"
                disabled={withdrawing}
                onClick={() => setWithdrawingComment(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="small"
                disabled={withdrawing || withdrawReason.trim().length < 5}
                loading={withdrawing}
                onClick={async () => {
                  if (withdrawReason.trim().length < 5) return;
                  setWithdrawing(true);
                  setWithdrawError('');
                  try {
                    await withdrawCommentMutation.mutateAsync({
                      id: application.id,
                      commentId: withdrawingComment.id,
                      reason: withdrawReason.trim(),
                    });
                    toast.success('Đã rút nhận xét thành công.');
                    setWithdrawingComment(null);
                    setWithdrawReason('');
                  } catch (err) {
                    setWithdrawError(workflowError(err));
                  } finally {
                    setWithdrawing(false);
                  }
                }}
              >
                Xác nhận rút
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {guard.confirmation}
    </article>
  );
}
