import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UnifiedProcedureSidebar as ProcedureManagerSidebar, type ProcedureNavSection } from "@/components/layout/RoleWorkspaceSidebars";
import {
  ProcedureManagerHeader,
  sectionTitles,
} from "./ProcedureManagerHeader";
import { UnifiedSelfProfileView } from "@/components/profile/UnifiedSelfProfileView";
import { Button, CardGridSkeleton, Modal } from "@/components/ui";
import { ProcedureFeedback } from "@/components/ui/ProcedureFeedback";
import { useProcedureQuery } from "@/hooks/useProcedureQuery";
import {
  procedureApi,
  procedureError,
  type ProcedureSummary,
} from "@/lib/api/procedures";
import { ProcedureDashboardView } from "./ProcedureDashboardView";
import { ProcedureCategoriesView } from "./ProcedureCategoriesView";
import { ProcedureApiList } from "./ProcedureApiList";
import { ProcedureApiDetail } from "./ProcedureApiDetail";
import {
  ProcedureApiEditor,
  emptyProcedure,
  validateProcedure,
} from "./ProcedureApiEditor";
import { ProcedureDraftWorkspace } from "./ProcedureDraftWorkspace";
import { ProcedureVersionsModal } from "./ProcedureVersionsModal";
import { toast } from "@/components/ui/Toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuthStore } from "@/stores/authStore";
import { getGreeting } from "@/lib/utils";
import { FormsView } from '@/pages/admin/FormsView';
import { KnowledgeBaseView } from '@/components/ai/KnowledgeBaseView';
import { ProcedureValidationError } from '@/lib/procedureValidation';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

export function ProcedureManagerPage({ embedded = false, readOnly = false, initialSection = "dashboard" }: { embedded?: boolean; readOnly?: boolean; initialSection?: ProcedureNavSection } = {}) {
  const [params, setParams] = useSearchParams();
  const rawParamSection = params.get("section") as ProcedureNavSection | null;
  const validSection = (rawParamSection && ['dashboard', 'procedures', 'drafts', 'categories', 'forms', 'ai-knowledge', 'profile'].includes(rawParamSection)) ? rawParamSection : null;
  const [section, setSection] = useState<ProcedureNavSection>(readOnly ? 'procedures' : (validSection ?? initialSection));

  useEffect(() => {
    const s = params.get("section") as ProcedureNavSection | null;
    if (s && ['dashboard', 'procedures', 'drafts', 'categories', 'forms', 'ai-knowledge', 'profile'].includes(s)) {
      setSection(s);
    }
  }, [params]);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<ProcedureSummary>();
  const [viewingVersions, setViewingVersions] = useState<ProcedureSummary | null>(null);
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState<Record<string, unknown>>(emptyProcedure);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draftPending, setDraftPending] = useState(false);
  const lock = useRef(false);
  const [validationError, setValidationError] = useState<ProcedureValidationError | null>(null);
  const guard = useUnsavedChanges(creating && JSON.stringify(input) !== JSON.stringify(emptyProcedure()), busy);
  const { profile } = useUserProfile();
  const user = useAuthStore((s) => s.user);
  const can = (permission: string) => !readOnly && (user?.permissions.includes(permission) ?? false);
  const procedureManagerName =
    profile?.fullName?.trim() || user?.username || "Chuyên viên";
  const categories = useProcedureQuery(
    useCallback((signal: AbortSignal) => procedureApi.categories(signal), []),
  );
  const stats = useProcedureQuery(
    useCallback(
      async (signal: AbortSignal) => {
        void revision;
        const [active, inactive] = await Promise.all([
          procedureApi.list({ isActive: true, pageSize: 1 }, true, signal),
          procedureApi.list({ isActive: false, pageSize: 1 }, true, signal),
        ]);
        return { active: active.totalCount, inactive: inactive.totalCount };
      },
      [revision],
    ),
  );
  const drafts = !readOnly && (section === "drafts" || params.get("section") === "drafts" || params.has("draft"));
  const navigate = (next: ProcedureNavSection) => {
    if (readOnly && next !== 'procedures') return;
    if (draftPending) {
      toast.info(
        "Hãy lưu hoặc bỏ thay đổi và chờ thao tác hoàn tất trước khi rời bản nháp.",
      );
      return;
    }
    setSection(next);
    setSelected(undefined);
    if (next === "drafts") {
      setParams({ section: "drafts" });
    } else {
      setParams({});
    }
  };
  const openCreate = () => {
    if (!can('procedure.create')) return;
    setValidationError(null);
    setInput(emptyProcedure());
    setConfirmed(false);
    setError("");
    setCreating(true);
  };
  const isEditingDraft = !readOnly && Boolean(params.get("draft"));

  if (isEditingDraft && !embedded) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <main id="procedure-manager-main" tabIndex={-1}>
          <ProcedureDraftWorkspace
            onPendingChange={setDraftPending}
            categories={categories.data ?? []}
            onPublished={() => setRevision((v) => v + 1)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "admin-layout procedure-manager-layout"}>
      {!embedded && <a href="#procedure-manager-main" className="skip-link">
        Đến nội dung chính
      </a>}
      {!embedded && <ProcedureManagerSidebar
        currentSection={section}
        onSelectSection={navigate}
        isOpenMobile={mobile}
        onCloseMobile={() => setMobile(false)}
        isCollapsedDesktop={collapsed}
        onToggleCollapseDesktop={() => setCollapsed(!collapsed)}
        publishedCount={stats.data?.active}
      />}
      <div
        className={embedded ? "" : `admin-workspace ${collapsed ? "is-sidebar-collapsed" : ""}`}
      >
        {!embedded && <ProcedureManagerHeader
          onOpenMobileSidebar={() => setMobile(true)}
          isCollapsedDesktop={collapsed}
          onToggleCollapseDesktop={() => setCollapsed(!collapsed)}
        />}
        <main
          id={embedded ? undefined : "procedure-manager-main"}
          className={embedded ? "space-y-5" : "admin-main space-y-5"}
          tabIndex={-1}
        >
          {!drafts && !selected && section !== "profile" && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {sectionTitles[section].title}
                </h1>
                {section === "dashboard" && (
                  <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">
                    {getGreeting()}, Chuyên viên {procedureManagerName}
                  </p>
                )}
              </div>
              {section === "procedures" && can("procedure.create") && <div className="flex flex-wrap gap-3">
                <Button onClick={openCreate}>Thêm thủ tục</Button>
              </div>}
            </div>
          )}
          <ProcedureFeedback
            error={categories.error}
            retry={categories.refresh}
          />
          {readOnly && <p className="text-sm text-slate-600">Chỉ xem thông tin thủ tục.</p>}
          {drafts && !can("procedure.drafts.read") ? (
            <section className="admin-card space-y-3 p-6" role="alert">
              <h1 className="text-xl font-bold">Bạn chưa có quyền xem PDF và bản nháp</h1>
              <p>Liên hệ quản trị viên để được cấp quyền xem bản nháp thủ tục.</p>
            </section>
          ) : drafts ? (
            <ProcedureDraftWorkspace
              onPendingChange={setDraftPending}
              categories={categories.data ?? []}
              onPublished={() => setRevision((v) => v + 1)}
            />
          ) : selected ? (
            <ProcedureApiDetail
              readOnly={readOnly}
              key={selected.id}
              row={selected}
              categories={categories.data ?? []}
              onBack={() => setSelected(undefined)}
              onChange={(active) => {
                setSelected((value) =>
                  value ? { ...value, isActive: active } : undefined,
                );
                setRevision((v) => v + 1);
              }}
            />
          ) : section === "profile" ? (
            <UnifiedSelfProfileView />
          ) : section === "categories" ? (
            categories.loading
              ? <CardGridSkeleton />
              : categories.error ? <ProcedureFeedback error={categories.error} retry={categories.refresh} />
              : <ProcedureCategoriesView categories={categories.data ?? []} onChange={categories.refresh} />
          ) : section === "dashboard" ? (
            <>
              {stats.error && (
                <ProcedureFeedback
                  error={stats.error}
                  retry={stats.refresh}
                />
              )}
              <ProcedureDashboardView
                key={revision}
                stats={stats.data}
                statsLoading={stats.loading}
                categoriesCount={categories.data?.length}
                canCreate={can('procedure.create')}
                onCreateProcedure={openCreate}
                onNavigateSection={navigate}
                onSelectProcedure={setSelected}
              />
            </>
          ) : section === "forms" || section === "upload-form" ? (
            <FormsView />
          ) : section === "ai-knowledge" ? (
            <KnowledgeBaseView />
          ) : section === "procedures" ? (
            <ProcedureApiList
              categories={categories.data ?? []}
              onSelect={setSelected}
              onViewVersions={user?.permissions.includes('procedure.versions.read') ? setViewingVersions : undefined}
              revision={revision}
            />
          ) : (
            <section className="admin-card space-y-3 p-6">
              <h2 className="text-lg font-bold">
                Chưa có kết nối cho chức năng này
              </h2>
              <p>
                {section === "checklists"
                  ? "Thành phần hồ sơ (giấy tờ nộp / xuất trình) được cấu hình theo từng thủ tục hành chính cụ thể. Vui lòng vào Danh sách thủ tục, chọn thủ tục tương ứng để xem hoặc chỉnh sửa danh mục giấy tờ."
                  : section === "steps"
                    ? "Quy trình và các bước thực hiện được cấu hình theo từng trường hợp nghiệp vụ của mỗi thủ tục. Vui lòng mở Danh sách thủ tục để cấu hình trực tiếp trong thủ tục cần thiết lập."
                    : section === "attach-forms"
                      ? "Biểu mẫu được gắn trong từng thủ tục. Hiện chưa hỗ trợ gắn nhiều biểu mẫu cùng lúc."
                      : section === "procedure-legal-links"
                        ? "Căn cứ pháp lý được quản lý trong từng thủ tục. Hiện chưa có kho văn bản riêng."
                        : ["forms", "upload-form", "form-versions"].includes(section)
                          ? "Chức năng quản lý kho biểu mẫu đang được hoàn thiện."
                          : section === "audit-logs"
                            ? "Bạn có thể xem lịch sử của từng thủ tục tại Danh sách thủ tục. Hiện chưa có lịch sử tổng hợp."
                            : "Căn cứ pháp lý được quản lý trong từng thủ tục. Hiện chưa có kho văn bản riêng."}
              </p>
              <Button variant="outline" onClick={() => navigate("procedures")}>
                Mở danh sách thủ tục
              </Button>
            </section>
          )}
          <Modal
            open={!readOnly && creating}
            onOpenChange={(open) => {
              if (!open) guard.requestClose(() => setCreating(false));
            }}
            title="Thêm thủ tục"
            description="Chỉ bắt buộc mã, tên và lĩnh vực. Bỏ chọn công khai để lưu ở trạng thái ẩn; bật công khai sau trong danh sách thủ tục."
            className="sm:max-w-5xl"
            footer={
              <Button
                loading={busy}
                onClick={async () => {
                  if (!can('procedure.create') || lock.current) return;
                  lock.current = true;
                  setBusy(true);
                  setError("");
                  try {
                    const data = validateProcedure(input);
                    // Ô xác nhận quyết định trạng thái: không tick = lưu ẩn (isActive: false)
                    const created = await procedureApi.create(data, confirmed);
                    setCreating(false);
                    setRevision((v) => v + 1);
                    setSelected(created);
                    toast.success(confirmed ? "Đã tạo và công khai thủ tục." : "Đã lưu thủ tục ở trạng thái ẩn.");
                  } catch (e) {
                    if (e instanceof ProcedureValidationError) {
                      setValidationError(e);
                      setError("");
                    } else {
                      setError(procedureError(e));
                    }
                  } finally {
                    setBusy(false);
                    lock.current = false;
                  }
                }}
              >
                {confirmed ? "Tạo và công khai" : "Lưu ở trạng thái ẩn"}
              </Button>
            }
          >
            <ProcedureFeedback error={error} />
            <ProcedureApiEditor
              value={input}
              validationError={validationError}
              onChange={(next) => {
                setInput(next);
              }}
              categories={categories.data ?? []}
              disabled={busy}
            />
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-red-700"
                disabled={busy}
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>
                <span className="font-semibold text-slate-900">Tôi đã kiểm tra thông tin và xác nhận công khai thủ tục này.</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {confirmed ? "Người dân sẽ thấy thủ tục ngay sau khi lưu." : "Bỏ chọn để lưu ở trạng thái ẩn; bật công khai sau trong danh sách thủ tục."}
                </span>
              </span>
            </label>
          </Modal>
          {guard.confirmation}
          <ProcedureVersionsModal
            readOnly={readOnly}
            procedure={viewingVersions}
            categories={categories.data ?? []}
            onClose={() => setViewingVersions(null)}
            onChanged={() => setRevision(value => value + 1)}
          />
        </main>
      </div>
    </div>
  );
}
