import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UnifiedProcedureSidebar as ProcedureManagerSidebar, type ProcedureNavSection } from "@/components/layout/RoleWorkspaceSidebars";
import {
  ProcedureManagerHeader,
  sectionTitles,
} from "./ProcedureManagerHeader";
import { UnifiedSelfProfileView } from "@/components/profile/UnifiedSelfProfileView";
import { Button, Modal } from "@/components/ui";
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

export function ProcedureManagerPage({ embedded = false, initialSection = "dashboard" }: { embedded?: boolean; initialSection?: ProcedureNavSection } = {}) {
  const [params, setParams] = useSearchParams();
  const [section, setSection] = useState<ProcedureNavSection>(initialSection);
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<ProcedureSummary>();
  const [viewingVersions, setViewingVersions] = useState<ProcedureSummary | null>(null);
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState<Record<string, unknown>>(emptyProcedure);
  const [mode, setMode] = useState<"create" | "publish">("create");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draftPending, setDraftPending] = useState(false);
  const lock = useRef(false);
  const { profile } = useUserProfile();
  const user = useAuthStore((s) => s.user);
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
  const drafts = section === "drafts" || params.get("section") === "drafts" || params.has("draft");
  const navigate = (next: ProcedureNavSection) => {
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
    setInput(emptyProcedure());
    setMode("create");
    setConfirmed(false);
    setError("");
    setCreating(true);
  };
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
              <div className="flex flex-wrap gap-3">
                <Button onClick={openCreate}>Thêm thủ tục</Button>
              </div>
            </div>
          )}
          <ProcedureFeedback
            loading={categories.loading}
            error={categories.error}
            retry={categories.refresh}
          />
          {drafts ? (
            <ProcedureDraftWorkspace
              onPendingChange={setDraftPending}
              categories={categories.data ?? []}
              onPublished={() => setRevision((v) => v + 1)}
            />
          ) : selected ? (
            <ProcedureApiDetail
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
            <ProcedureCategoriesView categories={categories.data ?? []} onChange={categories.refresh} />
          ) : section === "dashboard" ? (
            <>
              <ProcedureFeedback
                loading={stats.loading}
                error={stats.error}
                retry={stats.refresh}
              />
              <ProcedureDashboardView
                key={revision}
                stats={stats.data}
                onNavigateSection={navigate}
                onSelectProcedure={setSelected}
                onOpenDrafts={() => setParams({ section: "drafts" })}
              />
            </>
          ) : section === "procedures" ? (
            <ProcedureApiList
              categories={categories.data ?? []}
              onSelect={setSelected}
              onViewVersions={setViewingVersions}
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
                      ? "Việc gắn biểu mẫu điện tử / phôi DOCX được thực hiện bên trong cấu hình của từng thủ tục (Tab Biểu mẫu). Backend chưa hỗ trợ API gắn biểu mẫu hàng loạt từ bên ngoài."
                      : section === "procedure-legal-links"
                        ? "Căn cứ pháp lý được lưu trữ và đính kèm theo từng thủ tục cụ thể. Backend hiện chưa có API kho văn bản độc lập để quản lý liên kết ngoài."
                        : ["forms", "upload-form", "form-versions"].includes(section)
                          ? "Kho biểu mẫu và file DOCX thuộc dịch vụ DocumentForm, không phải API Procedure Catalog."
                          : section === "audit-logs"
                            ? "Catalog cung cấp lịch sử phiên bản theo từng thủ tục (có thể bấm 'Lịch sử' ở danh sách thủ tục để xem), chưa có API nhật ký tổng hợp."
                            : section === "legal-docs"
                              ? "Căn cứ pháp lý được lưu trong từng thủ tục; chưa có API kho văn bản pháp lý độc lập."
                              : "Chưa có API quản lý kho tri thức hoặc đồng bộ AI."}
              </p>
              <Button variant="outline" onClick={() => navigate("procedures")}>
                Mở danh sách thủ tục
              </Button>
            </section>
          )}
          <Modal
            open={creating}
            onOpenChange={(open) => {
              if (!busy) setCreating(open);
            }}
            title="Thêm thủ tục"
            description="Thủ tục sẽ được công khai khi lưu thành công. Muốn lưu nháp, dùng luồng PDF và bản nháp."
            className="sm:max-w-5xl"
            footer={
              <Button
                loading={busy}
                disabled={!confirmed}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  setBusy(true);
                  setError("");
                  try {
                    const data = validateProcedure(input);
                    const created =
                      mode === "create"
                        ? await procedureApi.create(data)
                        : await procedureApi.publish(data);
                    setCreating(false);
                    setRevision((v) => v + 1);
                    setSelected(created);
                    toast.success("Đã lưu thủ tục trên máy chủ.");
                  } catch (e) {
                    setError(procedureError(e));
                  } finally {
                    setBusy(false);
                    lock.current = false;
                  }
                }}
              >
                Xác nhận lưu
              </Button>
            }
          >
            <ProcedureFeedback error={error} />
            <ProcedureApiEditor
              value={input}
              onChange={(next) => {
                setInput(next);
                setConfirmed(false);
              }}
              categories={categories.data ?? []}
              disabled={busy}
            />
            <label className="my-4 grid gap-2 text-sm font-semibold">
              Cách lưu
              <select
                aria-label="Cách lưu"
                className="min-h-11 rounded-lg border p-3"
                disabled={busy}
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as "create" | "publish");
                  setConfirmed(false);
                }}
              >
                <option value="create">Tạo mới — từ chối mã đã tồn tại</option>
                <option value="publish">
                  Xuất bản nội dung đã đối soát — cập nhật nếu mã tồn tại
                </option>
              </select>
            </label>
            {mode === "publish" && (
              <p className="my-3 text-sm text-amber-900">
                Nếu mã đã tồn tại, toàn bộ nội dung sẽ được thay thế và lưu
                phiên bản cũ. Nếu mất kết nối, kiểm tra thủ tục và lịch sử trước
                khi gửi lại.
              </p>
            )}
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                disabled={busy}
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              Tôi đã đối soát thông tin và xác nhận lưu nội dung này.
            </label>
          </Modal>
          <ProcedureVersionsModal
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
