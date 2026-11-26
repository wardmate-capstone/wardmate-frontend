import { checklistQuantityLabel } from '@/lib/procedureDisplay';
import { formatDateTime } from '@/lib/dateFormat';
import { ApplicationConsultations } from '@/components/staffing/ConsultationsView';
import { useRef, useState, useEffect } from 'react';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Badge, Button, ListSelect, Modal, RefreshButton, Skeleton, toast, EmptyState, ErrorAlert, textareaClass } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useAddCommentMutation, useWithdrawCommentMutation, useApplicationComments, useApplicationDiff, useApplicationVersions, useReleaseApplicationMutation, useOfficiallyReceiveMutation } from '@/hooks/useWorkflow';
import { compareSubmissionSnapshots, humanizeFieldName, workflowStatusLabel, formDataFields, mapAssignmentHistoryToTimelineItem } from '@/lib/api/workflowAdapters';
import { ReleaseApplicationModal } from '@/components/workflow/AssignmentModals';
import { CounterReceiptModal } from '@/components/workflow/CounterReceiptModal';
import type { OfficialReceiptInput } from '@/lib/api/workflow';
import { workflowApi, workflowError } from '@/lib/api/workflow';
import { OfficerDocumentsPanel } from './OfficerDocumentsPanel';
import { DossierAiReviewCard } from '@/components/documents/DossierAiReviewCard';
import { GeneratedDocumentsPanel } from '@/pages/citizen/components/GeneratedDocumentsPanel';
import { useOfficerSubmissions } from '@/hooks/useDocumentForms';
import { documentFormError } from '@/lib/api/documentForms';
import { aiOcrApi, getAiRetryAfterSeconds, type DossierAssistResultDto } from '@/lib/api/aiOcr';
import type { OfficerApplication, OfficerReviewComment } from '@/types/officer';
import type { CommentDto } from '@/lib/api/workflow';
import { QUICK_COMMENT_TEMPLATES, TargetComments } from './TargetComments';
import { SubmissionReviewCompare } from './SubmissionReviewCompare';
import {
  ArrowLeft,
  ArrowsClockwise,
  ChatCircleDots,
  CheckCircle,
  ClockCounterClockwise,
  FileText,
  GitDiff,
  ListChecks,
  ShieldCheck,
  Sparkle,
  Warning,
} from '@phosphor-icons/react';

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

// Khóa trong formData do hệ thống tự ghi (không phải công dân khai) — không làm mục nhận xét
const SYSTEM_FORM_KEYS = new Set(['procedureCode', 'procedureTitle']);

const reasonSchema = z.object({
  reason: z.string().trim().min(1, 'Nhập lý do.').max(4000, 'Lý do tối đa 4.000 ký tự.'),
});

type Tab = 'consultations' | 'info' | 'documents' | 'comments' | 'versions' | 'timeline' | 'pdf';

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
  const [tab, setTab] = useState<Tab>('info');
  // Trường tờ khai đang mở ô nhập nhận xét tại chỗ (tab Thông tin người gửi)
  const [commentingField, setCommentingField] = useState<string>();
  const [scrollTarget, setScrollTarget] = useState<string>();
  useEffect(() => {
    if (!scrollTarget) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(`comment-target-${scrollTarget}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setScrollTarget(undefined);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollTarget, tab]);
  const versions = useApplicationVersions(application.id, tab === 'versions' || (tab === 'documents' && version > 1));
  const [from, setFrom] = useState(Math.max(1, application.currentVersion - 1));
  const [to, setTo] = useState(application.currentVersion);
  const diff = useApplicationDiff(application.id, from, to, tab === 'versions');
  // Nhận xét cán bộ đã ghi ở lần gửi trước (versionNumber = 0 thì hook không gọi API)
  const previousComments = useApplicationComments(application.id, tab === 'versions' && from < to ? from : 0);
  // Thời điểm công dân gửi lần trước: tờ khai gửi sau mốc này được đánh dấu "Mới cập nhật"
  const previousSubmittedAt = version > 1 ? versions.data?.find(x => x.versionNumber === version - 1)?.submittedAt : undefined;
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
  const receive = useOfficiallyReceiveMutation();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const writing = useIsMutating() > 0;
  const [decision, setDecision] = useState<'ready' | 'revision'>();
  const [decisionContext, setDecisionContext] = useState<{ version: number; hadSubmissions: boolean }>();
  const [decisionWarning, setDecisionWarning] = useState('');
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

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { targetId: '', commentText: '' },
  });
  const [targetKindPref, setTargetKindPref] = useState<'CHECKLIST_ITEM' | 'FORM_FIELD'>('CHECKLIST_ITEM');

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

  // L02: cán bộ thụ lý tiếp nhận tại quầy hồ sơ đã sẵn sàng (BE kiểm tra lại quyền workflow.receipt.confirm, phường, người thụ lý).
  const canReceive =
    !writing &&
    detail.isSuccess &&
    detail.data.status === 'DOCUMENTS_READY' &&
    detail.data.assignedOfficerId === user?.id &&
    detail.data.userId !== user?.id &&
    Boolean(user?.permissions.includes('workflow.receipt.confirm'));

  const isManager = Boolean(user?.roles.includes('WARD_MANAGER'));
  const canVerifyAi = Boolean(detail.data?.assignedOfficerId === user?.id && !isManager);

  const openComments = comments.data?.filter(x => x.status === 'OPEN' && x.versionNumber === version) ?? [];
  const checklists = detail.data?.checklists ?? [];
  const fields = detail.data ? formDataFields(detail.data.formData) : application.eformFields;

  const targets = [
    ...checklists.map(x => ({ id: x.id, label: x.title || x.code || 'Giấy tờ', type: 'CHECKLIST_ITEM' as const })),
    ...fields
      // Mã/tên thủ tục do hệ thống tự gắn khi công dân chọn thủ tục, công dân không sửa được nên không cho nhận xét
      .filter(x => !SYSTEM_FORM_KEYS.has(x.key.split('/').pop() ?? ''))
      .map(x => ({ id: x.key, label: x.label, type: 'FORM_FIELD' as const })),
  ];
  // Loại mục nhận xét: nếu mục đã được chọn (kể cả chọn từ nút "Nhận xét" ở tab khác) thì theo loại của mục đó
  const selectedTargetId = commentForm.watch('targetId');
  const selectedTargetType = targets.find(x => x.id === selectedTargetId)?.type;
  const targetKind = selectedTargetType
    ?? (targets.some(x => x.type === targetKindPref) ? targetKindPref : targetKindPref === 'CHECKLIST_ITEM' ? 'FORM_FIELD' : 'CHECKLIST_ITEM');
  const targetKinds = [
    { id: 'CHECKLIST_ITEM' as const, label: 'Giấy tờ', count: checklists.length },
    { id: 'FORM_FIELD' as const, label: 'Thông tin tờ khai', count: targets.filter(x => x.type === 'FORM_FIELD').length },
  ];

  // Nhận xét ngay tại từng mục (tab Thông tin người gửi và tab Tờ khai & giấy tờ)
  const commentsFor = (targetId: string) =>
    comments.data?.filter(x => x.versionNumber === version && x.targetId === targetId) ?? [];
  const openCountFor = (targetId: string) => commentsFor(targetId).filter(x => x.status === 'OPEN').length;
  const saveTargetComment = (targetId: string) => async (text: string): Promise<string | undefined> => {
    if (commentLock.current || !editable) return 'Hồ sơ hiện không cho phép thêm nhận xét.';
    const target = targets.find(x => x.id === targetId);
    if (!target || !target.label.trim() || target.label.length > 255) return 'Mục không còn trong hồ sơ hiện tại. Vui lòng tải lại hồ sơ.';
    commentLock.current = true;
    try {
      await addComment.mutateAsync({
        id: application.id,
        input: { versionNumber: version, targetType: target.type, targetId: target.id, fieldLabel: target.label, commentText: text },
      });
      setDecisionWarning('');
      return undefined;
    } catch (error) {
      return workflowError(error);
    } finally {
      commentLock.current = false;
    }
  };
  const startWithdraw = (x: CommentDto) => {
    setWithdrawingComment({ id: x.id, fieldLabel: x.fieldLabel, commentText: x.commentText });
    setWithdrawReason('');
    setWithdrawError('');
  };
  // Từ tab Nhận xét: nhảy tới đúng mục đang được nhận xét
  const goToTarget = (targetId?: string | null, targetType?: string | null) => {
    if (!targetId) return;
    setTab(targetType === 'CHECKLIST_ITEM' ? 'documents' : 'info');
    setScrollTarget(targetId);
  };

  const mandatoryChecklists = checklists.filter(x => x.isRequired);
  const completedMandatoryCount = mandatoryChecklists.filter(x => x.status === 'COMPLETED').length;
  const isAllMandatoryCompleted = mandatoryChecklists.length > 0 && completedMandatoryCount === mandatoryChecklists.length;

  const tabs: { id: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Người gửi', icon: <FileText className="h-4 w-4" /> },
    { id: 'documents', label: 'Tờ khai & giấy tờ', count: submissions.data?.length, icon: <ListChecks className="h-4 w-4" /> },
    { id: 'comments', label: openComments.length ? `Nhận xét (${openComments.length})` : 'Nhận xét', count: openComments.length, icon: <Warning className="h-4 w-4" /> },
    { id: 'versions', label: 'So sánh lần gửi', icon: <GitDiff className="h-4 w-4" /> },
    ...(user?.permissions.includes('workflow.consultation.read') ? [{ id: 'consultations' as const, label: 'Tham vấn', icon: <FileText className="h-4 w-4" /> }] : []),
    { id: 'timeline', label: 'Lịch sử', icon: <ClockCounterClockwise className="h-4 w-4" /> },
    { id: 'pdf', label: 'PDF tiền kiểm', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  function openDecision(next: 'ready' | 'revision') {
    if (commentForm.formState.isDirty) {
      setDecisionWarning('Còn nhận xét chưa lưu. Lưu hoặc xóa trước khi gửi quyết định.');
      setTab('comments');
      return;
    }
    // Chặn sớm: yêu cầu bổ sung phải dựa trên nhận xét cụ thể để công dân biết cần sửa gì.
    if (next === 'revision' && comments.isSuccess && openComments.length === 0) {
      setDecisionWarning(`Chưa có nhận xét nào. Ghi nhận xét ở mục cần sửa trước khi yêu cầu bổ sung.`);
      setTab('comments');
      return;
    }
    setDecisionWarning('');
    setActionError('');
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
      // Quyết định áp dụng cho cả hồ sơ: BE chỉ dùng tờ khai để tìm hồ sơ rồi gọi Workflow, và tự đồng bộ
      // mọi tờ khai của hồ sơ. Vì vậy FE tự chọn một tờ khai hợp lệ, cán bộ không cần chọn.
      const linkedSubmission = linked.find(
        x =>
          x.applicationId === application.id &&
          x.applicantId === currentApplication.userId &&
          // Giấy tờ gắn nhiều mẫu (BE-H forms[]): tờ khai theo mẫu nào trong số đó cũng hợp lệ
          currentApplication.checklists?.some(item => item.id === x.checklistId && (item.formTemplateId === x.templateId || item.forms?.some(f => f.formTemplateId === x.templateId))),
      );
      if (linked.length && !linkedSubmission) {
        setActionError('Tờ khai của hồ sơ không còn khớp danh mục giấy tờ hiện tại. Đóng hộp thoại và tải lại hồ sơ.');
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
        setActionError('Còn giấy tờ bắt buộc chưa hoàn tất. Vui lòng kiểm tra tab Tờ khai & giấy tờ.');
        return;
      }
      if (decision === 'revision' && !open.length) {
        setActionError(`Chưa có nhận xét nào về điểm cần sửa. Hãy đóng hộp thoại, ghi và lưu nhận xét ở tab Nhận xét, rồi thử lại.`);
        return;
      }
      const selectedId = linkedSubmission?.id;
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

  async function handleReceive(input: OfficialReceiptInput) {
    try {
      const result = await receive.mutateAsync({ id: application.id, input });
      setReceiptOpen(false);
      toast.success(result.receiptNumber
        ? `Đã tiếp nhận hồ sơ ${application.applicationNumber}. Số biên nhận: ${result.receiptNumber}.`
        : `Đã tiếp nhận hồ sơ ${application.applicationNumber} tại quầy.`);
      return result;
    } finally {
      void detail.refetch();
    }
  }

  return (
    <article aria-label="Không gian làm việc tiền kiểm hồ sơ" className="space-y-6 pb-16 max-sm:pb-28">
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
                    detail.data?.status === 'DOCUMENTS_READY' || detail.data?.status === 'OFFICIALLY_RECEIVED'
                      ? 'success'
                      : detail.data?.status === 'UNDER_REVIEW'
                        ? 'warning'
                        : 'neutral'
                  }
                  className="px-2.5 py-0.5 text-xs font-medium"
                >
                  {detail.data?.status === 'DOCUMENTS_READY'
                    ? 'Giấy tờ sẵn sàng'
                    : detail.data?.status === 'OFFICIALLY_RECEIVED'
                      ? 'Đã tiếp nhận tại quầy'
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
                className="gap-2 border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100/70 max-sm:hidden"
                disabled={!editable || busy || !comments.isSuccess || !submissions.isSuccess}
                onClick={() => openDecision('revision')}
              >
                <Warning className="h-4 w-4 text-amber-600" />
                Yêu cầu bổ sung
              </Button>
              <Button
                variant="primary"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 max-sm:hidden"
                disabled={!editable || busy || !comments.isSuccess || !submissions.isSuccess}
                onClick={() => openDecision('ready')}
              >
                <CheckCircle className="h-4 w-4" />
                Xác nhận giấy tờ sẵn sàng
              </Button>
              {/* Điện thoại: hai nút quyết định nằm ở thanh cố định cuối màn hình để không phải cuộn lên đầu trang (L23). */}
              {editable && (
                <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] sm:hidden">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 border-amber-300 bg-amber-50/50 px-2 text-amber-900"
                    disabled={busy || !comments.isSuccess || !submissions.isSuccess}
                    onClick={() => openDecision('revision')}
                  >
                    <Warning className="h-4 w-4 text-amber-600" />
                    Yêu cầu bổ sung
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 gap-1.5 bg-emerald-600 px-2 hover:bg-emerald-700"
                    disabled={busy || !comments.isSuccess || !submissions.isSuccess}
                    onClick={() => openDecision('ready')}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Xác nhận giấy tờ sẵn sàng
                  </Button>
                </div>
              )}
              {canReceive && (
                <Button
                  variant="primary"
                  className="gap-2"
                  disabled={busy}
                  onClick={() => setReceiptOpen(true)}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Tiếp nhận tại quầy
                </Button>
              )}
              {canRelease && (
                <Button
                  variant="ghost"
                  className="gap-2 text-slate-600 hover:text-slate-900"
                  disabled={busy}
                  onClick={() => setReleaseOpen(true)}
                >
                  <ArrowsClockwise className="h-4 w-4" />
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
                {completedMandatoryCount}/{mandatoryChecklists.length} hoàn tất
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">Nhận xét đang mở</span>
              <p className={`mt-1 text-sm font-bold ${openComments.length ? 'text-amber-700' : 'text-slate-800'}`}>
                {openComments.length}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">Tờ khai Word</span>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {submissions.data?.length ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <span className="text-xs font-medium text-slate-500">Quyền xử lý</span>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {editable ? 'Bạn đang thụ lý' : 'Chỉ xem'}
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
              Chế độ chỉ xem: chỉ cán bộ thụ lý được nhận xét khi hồ sơ đang kiểm tra.
            </p>
          )}

          {decisionWarning && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Warning className="h-4 w-4 shrink-0 text-amber-600" />
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
        {/* Tab 1: Thông tin người gửi (danh mục giấy tờ nằm ở tab Tờ khai & giấy tờ) */}
        {tab === 'info' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Thông tin người gửi</h3>
              <p className="mt-0.5 text-xs text-slate-500">Công dân tự kê khai, chưa được xác minh.</p>
              <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map(x => {
                  const commentable = targets.some(t => t.id === x.key);
                  const openCount = openCountFor(x.key);
                  const composing = commentingField === x.key;
                  return (
                    <div
                      key={x.key}
                      id={`comment-target-${x.key}`}
                      className={`space-y-2 rounded-xl border p-3 transition ${openCount ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50/80 hover:bg-slate-50'} ${composing ? 'sm:col-span-2 lg:col-span-3' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <dt className="text-xs font-medium text-slate-500">{x.label}</dt>
                          <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                            {x.value || 'Chưa có thông tin'}
                          </dd>
                        </div>
                        {commentable && editable && !composing && (
                          <button
                            type="button"
                            title="Nhận xét trường này"
                            aria-label={`Nhận xét: ${x.label}`}
                            onClick={() => setCommentingField(x.key)}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800"
                          >
                            <ChatCircleDots className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {commentable && (
                        <dd>
                          <TargetComments
                            idPrefix={`field-${x.key.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
                            label={x.label}
                            comments={commentsFor(x.key)}
                            editable={editable && !busy}
                            composerOpen={composing}
                            onCloseComposer={() => setCommentingField(undefined)}
                            onSave={saveTargetComment(x.key)}
                            onWithdraw={startWithdraw}
                          />
                        </dd>
                      )}
                    </div>
                  );
                })}
              </dl>
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
              renderTargetComments={(id, title, composerOpen, close) => (
                <TargetComments
                  idPrefix={`checklist-${id}`}
                  label={title}
                  comments={commentsFor(id)}
                  editable={editable && !busy}
                  composerOpen={composerOpen}
                  onCloseComposer={close}
                  onSave={saveTargetComment(id)}
                  onWithdraw={startWithdraw}
                />
              )}
              openCommentCount={openCountFor}
              updatedSince={previousSubmittedAt}
              previousVersion={version > 1 ? version - 1 : undefined}
              referenceData={fields.map(f => ({ label: f.label, value: String(f.value || 'Chưa có thông tin') }))}
              checklists={checklists.map(x => ({
                id: x.id,
                title: x.title || x.code || 'Giấy tờ',
                isRequired: x.isRequired,
                completed: x.status === 'COMPLETED',
                meta: checklistQuantityLabel(x),
                // Ghi chú điều kiện + mẫu đơn trước đây hiện ở tab Thông tin, nay chuyển sang đây
                note: [x.conditionNote, x.itemNote !== x.conditionNote ? x.itemNote : null].filter(Boolean).join('\n') || undefined,
                forms: x.forms?.map(f => f.formName || f.formCode).filter(Boolean) as string[] | undefined,
              }))}
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
                        <span className="min-w-0 font-semibold text-slate-900">
                          {humanizeFieldName(x.fieldLabel || 'Nhận xét')}
                          {x.targetId && targets.some(t => t.id === x.targetId) && (
                            <button
                              type="button"
                              onClick={() => goToTarget(x.targetId, x.targetType)}
                              className="ml-2 text-xs font-semibold text-red-800 hover:underline"
                            >
                              Xem tại mục →
                            </button>
                          )}
                        </span>
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
                              variant="dangerGhost"
                              className="h-6 min-h-0 px-2 text-xs"
                              onClick={() => startWithdraw(x)}
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
                              Thời gian: {formatDateTime(x.withdrawnAt)}
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-400">
                        {formatDateTime(x.createdAt)}
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
                  description="Hồ sơ đủ điều kiện thì có thể xác nhận sẵn sàng."
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
              <div>
                <h4 className="font-bold text-slate-900">Thêm nhận xét mới</h4>
                <p className="mt-0.5 text-xs text-slate-500">Có thể nhận xét ngay tại từng mục ở tab Người gửi và Tờ khai & giấy tờ.</p>
              </div>

              {/* Chọn loại mục trước: giấy tờ trong danh mục hoặc trường thông tin trên tờ khai */}
              <div className="grid gap-1.5">
                <span id="comment-target-kind" className="text-sm font-semibold">Nhận xét về</span>
                <div role="radiogroup" aria-labelledby="comment-target-kind" className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-100 p-1">
                  {targetKinds.map(kind => (
                    <button
                      key={kind.id}
                      type="button"
                      role="radio"
                      aria-checked={targetKind === kind.id}
                      disabled={!editable || addComment.isPending || kind.count === 0}
                      onClick={() => {
                        if (targetKind === kind.id) return;
                        setTargetKindPref(kind.id);
                        // Đổi loại thì bỏ mục đang chọn của loại cũ
                        if (selectedTargetType) commentForm.setValue('targetId', '', { shouldValidate: false });
                      }}
                      className="min-h-9 rounded-lg px-3.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 aria-checked:bg-white aria-checked:text-red-800 aria-checked:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-1"
                    >
                      {kind.label} <span className="font-normal text-slate-500">({kind.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="grid gap-1.5 text-sm font-semibold" htmlFor="comment-target">
                Mục cần nhận xét
                <Controller control={commentForm.control} name="targetId" render={({ field, fieldState }) => (
                  <ListSelect id="comment-target" value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                    disabled={!editable || addComment.isPending} invalid={Boolean(fieldState.error)} describedBy="comment-target-error"
                    searchable
                    placeholder={targetKind === 'CHECKLIST_ITEM' ? 'Chọn giấy tờ cần nhận xét' : 'Chọn thông tin tờ khai cần nhận xét'}
                    options={targets.filter(item => item.type === targetKind).map(item => ({ value: item.id, label: item.label }))} />
                )} />
              </label>
              <p id="comment-target-error" role="alert" className="text-xs text-red-700">
                {commentForm.formState.errors.targetId?.message}
              </p>

              {/* Quick Suggestion Chips */}
              {editable && (
                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Sparkle className="h-3.5 w-3.5 text-amber-500" />
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
                  className={textareaClass}
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
                <Button type="submit" loading={addComment.isPending} disabled={!editable || !commentForm.watch('commentText')?.trim() || !selectedTargetId}>
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
          </div>
        )}

        {/* Tab 4: Kiểm tra lần gửi lại — nhận xét cũ đặt cạnh thay đổi của từng mục */}
        {tab === 'versions' && (
          <div className="space-y-5">
            {versions.isError && <p role="alert" className="text-sm text-red-700">{workflowError(versions.error)}</p>}
            {/* Mới gửi một lần: thông tin bình thường, không phải cảnh báo lỗi. */}
            {version < 2 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">Hồ sơ mới gửi một lần nên chưa có lần gửi lại để so sánh. Khi công dân gửi lại sau yêu cầu bổ sung, thay đổi sẽ hiện ở đây.</p>
            ) : <SubmissionReviewCompare
              applicationId={application.id}
              fromVersion={from}
              toVersion={to}
              versionNumbers={versions.data?.map(x => x.versionNumber) ?? []}
              onChangeVersions={(nextFrom, nextTo) => { setFrom(nextFrom); setTo(nextTo); }}
              checklists={checklists.map(x => ({ id: x.id, title: x.title || x.code || 'Giấy tờ' }))}
              previousComments={previousComments}
              fieldChanges={comparedFields}
              fieldChangesPending={snapshotDiff === undefined && diff.isPending}
              fieldChangesError={snapshotDiff === undefined && diff.isError ? workflowError(diff.error) : undefined}
              canComment={editable && !busy}
              renderTargetComments={(id, title, composerOpen, close) => (
                <TargetComments
                  idPrefix={`review-${id}`}
                  label={title}
                  comments={commentsFor(id)}
                  editable={editable && !busy}
                  composerOpen={composerOpen}
                  onCloseComposer={close}
                  onSave={saveTargetComment(id)}
                  onWithdraw={startWithdraw}
                />
              )}
            />}
          </div>
        )}

        {/* Tab 5: Timeline */}
        {tab === 'timeline' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Lịch sử trạng thái</h3>
            </div>
            <div className="space-y-3">
              {detail.data?.history?.map(x => (
                <div key={x.id} className="relative rounded-xl border border-slate-200 p-4 pl-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">
                      {x.fromStatus ? workflowStatusLabel(x.fromStatus) : 'Khởi tạo'} → <span className="text-red-700">{workflowStatusLabel(x.toStatus)}</span>
                    </p>
                    <time className="text-xs text-slate-400">
                      {formatDateTime(x.createdAt)}
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
            {['DOCUMENTS_READY', 'OFFICIALLY_RECEIVED', 'APPROVED'].includes(detail.data?.status ?? '') ? (
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
        description={decision === 'ready'
          ? 'Áp dụng cho cả hồ sơ. Đây không phải tiếp nhận chính thức.'
          : 'Hồ sơ được trả về công dân kèm các nhận xét đang mở.'}
      >
        <div className="space-y-4">
          {/* Pre-flight Condition Checklist for 'ready' */}
          {decision === 'ready' && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Điều kiện
              </span>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-2">
                  {isAllMandatoryCompleted ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Warning className="h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <span className={isAllMandatoryCompleted ? 'text-emerald-900 font-medium' : 'text-amber-900'}>
                    Giấy tờ bắt buộc: {completedMandatoryCount}/{mandatoryChecklists.length}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  {openComments.length === 0 ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Warning className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span className={openComments.length === 0 ? 'text-emerald-900 font-medium' : 'text-red-900 font-medium'}>
                    Nhận xét đang mở: {openComments.length}
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
                  title="AI soạn lý do từ các mục chưa đạt"
                >
                  <Sparkle className={`size-3.5 ${isGeneratingAiReason ? 'animate-spin text-purple-600' : ''}`} />
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
                placeholder="Nội dung công dân cần bổ sung…"
                {...reasonForm.register('reason')}
                className={textareaClass}
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
            {decision === 'ready' ? 'Xác nhận sẵn sàng' : 'Gửi yêu cầu bổ sung'}
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

      <CounterReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        applicationNumber={application.applicationNumber}
        onConfirm={handleReceive}
      />

      {withdrawingComment && (
        <Modal
          open={Boolean(withdrawingComment)}
          onOpenChange={(open) => { if (!open) setWithdrawingComment(null); }}
          title="Rút nhận xét khỏi hồ sơ"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Mục: <strong className="text-slate-900">{withdrawingComment.fieldLabel}</strong>. Nhận xét đã rút sẽ ẩn với công dân.
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
                placeholder="Lý do rút (5–500 ký tự)…"
                maxLength={500}
                className={textareaClass}
              />
              <span className="text-[11px] text-slate-400 block text-right mt-0.5">
                {withdrawReason.trim().length}/500
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
