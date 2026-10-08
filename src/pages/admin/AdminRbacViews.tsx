import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowsClockwise,
  CaretRight,
  Check,
  Copy,
  Eye,
  MagnifyingGlass,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { Button, Input, Modal } from "@/components/ui";
import { toast } from "@/components/ui/Toast";
import {
  rbacApi,
  rbacError,
  type AuditLog,
  type Permission,
  type RbacPage,
  type Role,
} from "@/lib/api/rbac";
import {
  getAccount,
  getWards,
  type ManagedUserDto,
} from "@/lib/api";

const roleLabels: Record<string, string> = {
  IT_ADMIN: "Quản trị hệ thống",
  PROCEDURE_MANAGER: "Quản lý thủ tục",
  MANAGER: "Lãnh đạo UBND",
  FRONT_DESK_OFFICER: "Cán bộ Một cửa",
  REGISTERED_CITIZEN: "Công dân",
};
const moduleLabels: Record<string, string> = {
  IAM: "Định danh và truy cập",
  ProcedureCatalog: "Quản lý thủ tục",
  DocumentForm: "Biểu mẫu điện tử",
};
const actionLabels: Record<string, string> = {
  "role.created": "Tạo vai trò",
  "role.updated": "Cập nhật vai trò",
  "role.deleted": "Xóa vai trò",
  "permission.granted": "Cấp quyền",
  "permission.revoked": "Thu hồi quyền",
  "role.assigned": "Gán vai trò",
  "role.revoked": "Thu hồi vai trò",
  "ward.created": "Tạo đơn vị Phường/Xã",
  "account.ward_changed": "Chuyển đơn vị công tác",
  "account.front_desk_created": "Tạo tài khoản cán bộ Một cửa",
  "account.enabled": "Kích hoạt tài khoản",
  "account.disabled": "Khóa tài khoản",
};

function ErrorBox({ error, retry }: { error: string; retry?: () => void }) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <span>{error}</span>
      {retry && (
        <Button size="small" variant="outline" onClick={retry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

export function AdminRolesView() {
  const [data, setData] = useState<RbacPage<Role>>();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Role | null | undefined>();
  const [deleting, setDeleting] = useState<Role>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number>();
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState("ALL");
  const [busyKey, setBusyKey] = useState("");
  const lock = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roles, available] = await Promise.all([
        rbacApi.roles(page),
        rbacApi.permissions(),
      ]);
      setData(roles);
      setPermissions(available);
    } catch (e) {
      setError(rbacError(e));
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    void load();
  }, [load]);
  const open = (role: Role | null) => {
    setEditing(role);
    setName(role?.roleName ?? "");
    setDescription(role?.description ?? "");
    setError("");
  };
  const mutate = async (
    key: string,
    action: () => Promise<void>,
    message: string,
  ) => {
    if (lock.current) return;
    lock.current = true;
    setBusyKey(key);
    setError("");
    try {
      await action();
      toast.success(message);
      await load();
    } catch (e) {
      setError(rbacError(e));
    } finally {
      setBusyKey("");
      lock.current = false;
    }
  };
  const selectedRole = data?.items.find((role) => role.id === selectedId);
  useEffect(() => {
    if (!selectedRole) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(undefined);
    };
    document.addEventListener("keydown", close);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = overflow;
    };
  }, [selectedRole]);
  const visibleRoles = useMemo(
    () =>
      data?.items.filter((role) =>
        `${roleLabels[role.roleName] ?? ""} ${role.roleName} ${role.description ?? ""}`
          .toLowerCase()
          .includes(roleSearch.trim().toLowerCase()),
      ) ?? [],
    [data, roleSearch],
  );
  const modules = useMemo(
    () =>
      [...new Set(permissions.map((permission) => permission.module))].sort(),
    [permissions],
  );
  const visiblePermissions = useMemo(
    () =>
      permissions.filter((permission) => {
        const assigned =
          selectedRole?.permissions.some((item) => item.id === permission.id) ??
          false;
        return (
          `${permission.permissionName} ${permission.permissionCode}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()) &&
          (moduleFilter === "ALL" || permission.module === moduleFilter) &&
          (assignmentFilter === "ALL" ||
            (assignmentFilter === "ASSIGNED") === assigned)
        );
      }),
    [assignmentFilter, moduleFilter, permissions, search, selectedRole],
  );
  return (
    <div className="space-y-5">
      <ErrorBox error={error} retry={() => void load()} />
      {loading ? (
        <p className="admin-card p-8 text-center text-sm">
          Đang tải phân quyền...
        </p>
      ) : (
        <section className="admin-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <label className="relative min-w-64 flex-1">
              <MagnifyingGlass
                className="absolute left-3 top-3 text-slate-400"
                size={17}
              />
              <input
                aria-label="Tìm vai trò"
                value={roleSearch}
                onChange={(event) => setRoleSearch(event.target.value)}
                placeholder="Tìm vai trò..."
                className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm"
              />
            </label>
            <Button onClick={() => open(null)}>
              <Plus size={18} /> Thêm vai trò
            </Button>
          </div>
          <div className="admin-table-wrap max-h-[34rem] overflow-auto">
            <table className="min-w-[720px]">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th>Vai trò</th>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th>Quyền hạn</th>
                  <th>
                    <span className="sr-only">Mở chi tiết</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleRoles.map((role) => {
                  const percent = permissions.length
                    ? Math.round(
                        (role.permissions.length / permissions.length) * 100,
                      )
                    : 0;
                  return (
                    <tr
                      key={role.id}
                      className="cursor-pointer transition-colors hover:bg-red-50/60"
                      onClick={() => setSelectedId(role.id)}
                    >
                      <td>
                        <button type="button" className="text-left">
                          <strong className="block text-base text-slate-950">
                            {roleLabels[role.roleName] ?? role.roleName}
                          </strong>
                          <code className="mt-1 inline-block rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                            {role.roleName}
                          </code>
                        </button>
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${role.isSystem ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {role.isSystem ? "Hệ thống" : "Tùy chỉnh"}
                        </span>
                      </td>
                      <td className="max-w-sm text-sm text-slate-600">
                        {role.description &&
                        role.description.toLowerCase() !== role.roleName.toLowerCase() &&
                        role.description.toLowerCase() !== "registered citizen"
                          ? role.description
                          : "—"}
                      </td>
                      <td>
                        <div className="min-w-32">
                          <strong className="mb-1 block text-xs text-red-700">
                            {role.permissions.length}/{permissions.length} quyền
                          </strong>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <span
                              className="block h-full rounded-full bg-red-600"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <CaretRight className="text-slate-400" size={20} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!visibleRoles.length && (
            <p className="p-8 text-center text-sm text-slate-500">
              Không tìm thấy vai trò.
            </p>
          )}
        </section>
      )}
      {selectedRole && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-permissions-title"
        >
          <button
            type="button"
            aria-label="Đóng bảng quyền"
            className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setSelectedId(undefined)}
          />
          <section className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl sm:w-[70vw] lg:w-[55vw] xl:w-1/2">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="role-permissions-title" className="text-xl font-bold">
                    {roleLabels[selectedRole.roleName] ?? selectedRole.roleName}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                    {selectedRole.isSystem
                      ? "Vai trò hệ thống"
                      : "Vai trò tùy chỉnh"}
                  </span>
                </div>
                {selectedRole.description &&
                  selectedRole.description.toLowerCase() !== selectedRole.roleName.toLowerCase() &&
                  selectedRole.description.toLowerCase() !== "registered citizen" && (
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedRole.description}
                    </p>
                  )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  variant="outline"
                  onClick={() => open(selectedRole)}
                >
                  Chỉnh sửa
                </Button>
                {!selectedRole.isSystem && (
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => {
                      setDeleting(selectedRole);
                      setError("");
                    }}
                  >
                    <Trash /> Xóa
                  </Button>
                )}
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setSelectedId(undefined)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            <div className="grid gap-3 border-b border-slate-100 p-4">
              <label className="relative">
                <MagnifyingGlass
                  className="absolute left-3 top-3 text-slate-400"
                  size={17}
                />
                <input
                  aria-label="Tìm quyền"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên hoặc mã quyền..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  aria-label="Lọc theo module"
                  value={moduleFilter}
                  onChange={(event) => setModuleFilter(event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="ALL">Tất cả module</option>
                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {moduleLabels[module] ?? module}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Lọc theo trạng thái quyền"
                  value={assignmentFilter}
                  onChange={(event) => setAssignmentFilter(event.target.value)}
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ASSIGNED">Đã cấp</option>
                  <option value="UNASSIGNED">Chưa cấp</option>
                </select>
              </div>
            </div>
            <div className="admin-table-wrap flex-1 overflow-auto">
              <table>
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th>Quyền hạn</th>
                    <th>Module</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePermissions.map((permission) => {
                    const checked = selectedRole.permissions.some(
                      (item) => item.id === permission.id,
                    );
                    const key = `${selectedRole.id}:${permission.id}`;
                    return (
                      <tr
                        key={permission.id}
                        className={checked ? "bg-emerald-50/30" : ""}
                      >
                        <td>
                          <strong className="block text-slate-950">
                            {permission.permissionName}
                          </strong>
                          <code className="mt-1 inline-block rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {permission.permissionCode}
                          </code>
                        </td>
                        <td>
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {moduleLabels[permission.module] ??
                              permission.module}
                          </span>
                        </td>
                        <td>
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              role="switch"
                              aria-label={`${checked ? "Thu hồi" : "Cấp"} quyền ${permission.permissionName}`}
                              checked={checked}
                              disabled={!!busyKey}
                              onChange={() =>
                                void mutate(
                                  key,
                                  () =>
                                    checked
                                      ? rbacApi.revokePermission(
                                          selectedRole.id,
                                          permission.id,
                                        )
                                      : rbacApi.grantPermission(
                                          selectedRole.id,
                                          permission.id,
                                        ),
                                  checked
                                    ? "Đã thu hồi quyền."
                                    : "Đã cấp quyền.",
                                )
                              }
                            />
                            <span
                              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${checked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                            >
                              {checked ? "Đã cấp" : "Chưa cấp"}
                            </span>
                            {busyKey === key && (
                              <ArrowsClockwise className="animate-spin" />
                            )}
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visiblePermissions.length && (
                <p className="p-8 text-center text-sm text-slate-500">
                  Không có quyền phù hợp.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between text-sm">
          <span>
            Trang {data.page} · Tổng {data.total} vai trò
          </span>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Trước
            </Button>
            <Button
              size="small"
              variant="outline"
              disabled={page * data.pageSize >= data.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
      <Modal
        open={editing !== undefined}
        onOpenChange={(value) => {
          if (!value && !busyKey) setEditing(undefined);
        }}
        title={editing ? "Chỉnh sửa vai trò" : "Thêm vai trò"}
        description={
          editing?.isSystem
            ? "Vai trò hệ thống chỉ được thay đổi mô tả."
            : undefined
        }
        footer={
          <Button
            loading={busyKey === "role"}
            onClick={() =>
              void mutate(
                "role",
                async () => {
                  const input = {
                    roleName: name.trim(),
                    description: description.trim() || null,
                  };
                  if (!/^[A-Za-z][A-Za-z0-9_]{0,49}$/.test(input.roleName))
                    throw new Error(
                      "Tên vai trò phải bắt đầu bằng chữ cái không dấu, chỉ gồm chữ, số hoặc _, tối đa 50 ký tự.",
                    );
                  if (editing) await rbacApi.updateRole(editing.id, input);
                  else await rbacApi.createRole(input);
                  setEditing(undefined);
                },
                editing ? "Đã cập nhật vai trò." : "Đã tạo vai trò.",
              )
            }
          >
            Lưu vai trò
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            label="Tên vai trò"
            value={name}
            disabled={!!editing?.isSystem || !!busyKey}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Mô tả"
            value={description}
            disabled={!!busyKey}
            onChange={(e) => setDescription(e.target.value)}
          />
          <ErrorBox error={error} />
        </div>
      </Modal>
      <Modal
        open={!!deleting}
        onOpenChange={(value) => {
          if (!value && !busyKey) setDeleting(undefined);
        }}
        title="Xóa vai trò"
        description={`Chỉ xóa được “${deleting?.roleName ?? ""}” khi chưa gán cho người dùng.`}
        footer={
          <Button
            loading={busyKey === "delete"}
            onClick={() =>
              void mutate(
                "delete",
                async () => {
                  await rbacApi.deleteRole(deleting!.id);
                  setDeleting(undefined);
                },
                "Đã xóa vai trò.",
              )
            }
          >
            Xác nhận xóa
          </Button>
        }
      >
        <ErrorBox error={error} />
      </Modal>
    </div>
  );
}

export function UserRolesModal({
  user,
  onClose,
  onChanged,
}: {
  user?: ManagedUserDto;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [available, setAvailable] = useState<Role[]>([]);
  const [assigned, setAssigned] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      rbacApi.roles(1, 100, controller.signal),
      rbacApi.userRoles(user.id, controller.signal),
    ])
      .then(
        ([roles, current]) => {
          setAvailable(roles.items);
          setAssigned(current);
        },
        (e) => {
          if (!controller.signal.aborted) setError(rbacError(e));
        },
      )
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user]);
  const toggle = async (role: Role) => {
    if (!user || busy) return;
    const has = assigned.some((item) => item.id === role.id);
    setBusy(role.id);
    setError("");
    try {
      if (has) await rbacApi.revokeUserRole(user.id, role.id);
      else await rbacApi.grantUserRole(user.id, role.id);
      setAssigned((value) =>
        has ? value.filter((item) => item.id !== role.id) : [...value, role],
      );
      onChanged();
      toast.success(has ? "Đã thu hồi vai trò." : "Đã gán vai trò.");
    } catch (e) {
      setError(rbacError(e));
    } finally {
      setBusy(0);
    }
  };
  return (
    <Modal
      open={!!user}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      title={`Quản lý vai trò: ${user?.username ?? ""}`}
      description="Cập nhật quyền hạn và vai trò hoạt động của người dùng trên hệ thống."
      footer={
        <Button variant="outline" onClick={onClose} disabled={!!busy}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-3">
        <ErrorBox error={error} />
        {loading ? (
          <p>Đang tải vai trò...</p>
        ) : (
          available.map((role) => (
            <label
              key={role.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={assigned.some((item) => item.id === role.id)}
                disabled={!!busy}
                onChange={() => void toggle(role)}
              />
              <span>
                <strong className="block">
                  {roleLabels[role.roleName] ?? role.roleName}
                </strong>
                <code className="text-xs text-slate-500">{role.roleName}</code>
              </span>
              {busy === role.id && (
                <ArrowsClockwise className="ml-auto animate-spin" />
              )}
            </label>
          ))
        )}
      </div>
    </Modal>
  );
}

function UserBadge({ id, username }: { id: string; username?: string }) {
  const [copied, setCopied] = useState(false);

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("Đã sao chép ID tài khoản.");
    setTimeout(() => setCopied(false), 2000);
  };

  const shortId = id.length > 12 ? `${id.slice(0, 8)}...` : id;

  if (username) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <strong className="text-sm font-semibold text-slate-900">
          @{username}
        </strong>
        <button
          type="button"
          onClick={copyId}
          title={`Bấm để sao chép toàn bộ ID: ${id}`}
          className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <span>{shortId}</span>
          {copied ? (
            <Check size={11} className="text-emerald-600" />
          ) : (
            <Copy size={11} />
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={copyId}
      title={`Bấm để sao chép: ${id}`}
      className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600 hover:bg-slate-200 transition-colors"
    >
      <span>{shortId}</span>
      {copied ? (
        <Check size={12} className="text-emerald-600" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}



function AuditDetailModal({
  log,
  actorName,
  targetName,
  wardsMap,
  rolesMap,
  permissionsMap,
  onClose,
}: {
  log: AuditLog | null;
  actorName?: string;
  targetName?: string;
  wardsMap: Record<string, string>;
  rolesMap: Record<number, Role>;
  permissionsMap: Record<number, Permission>;
  onClose: () => void;
}) {
  if (!log) return null;

  const parsed = (() => {
    try {
      return log.details ? JSON.parse(log.details) : null;
    } catch {
      return null;
    }
  })();

  const targetRole = log.roleId ? rolesMap[log.roleId] : undefined;
  const targetPerm = log.permissionId ? permissionsMap[log.permissionId] : undefined;

  return (
    <Modal
      open={!!log}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Chi tiết nhật ký hoạt động"
      description={`Mã bản ghi: #${log.id}`}
      footer={
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-4 text-sm text-slate-700">
        {/* Thông tin chung */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
          <div>
            <span className="text-xs text-slate-500 block">Thời gian ghi nhận</span>
            <strong className="text-slate-900">{new Date(log.createdAt).toLocaleString("vi-VN")}</strong>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Hành động</span>
            <strong className="text-slate-900">{actionLabels[log.action] ?? log.action}</strong>
            <code className="text-[11px] text-slate-500 block">({log.action})</code>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Người thực hiện</span>
            <strong className="text-slate-900">@{actorName || log.actorUserId}</strong>
            <span className="text-[11px] font-mono text-slate-400 block break-all">{log.actorUserId}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Đối tượng tác động</span>
            {log.targetUserId ? (
              <>
                <strong className="text-slate-900">@{targetName || log.targetUserId}</strong>
                <span className="text-[11px] font-mono text-slate-400 block break-all">{log.targetUserId}</span>
              </>
            ) : (
              <span className="text-slate-400">Không có tài khoản trực tiếp</span>
            )}
          </div>
        </div>

        {/* Thông tin Phân quyền & Vai trò liên quan */}
        {(log.roleId || log.permissionId) && (
          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông tin Phân quyền</h4>
            {log.roleId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Vai trò:</span>
                <strong className="text-slate-900">
                  {targetRole ? `${roleLabels[targetRole.roleName] ?? targetRole.roleName} (${targetRole.roleName})` : `#${log.roleId}`}
                </strong>
              </div>
            )}
            {log.permissionId && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Quyền hạn:</span>
                <strong className="text-slate-900">
                  {targetPerm ? `${targetPerm.permissionName} (${targetPerm.permissionCode})` : `#${log.permissionId}`}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Nội dung nghiệp vụ chi tiết */}
        {parsed && Object.keys(parsed).length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dữ liệu nghiệp vụ tác động</h4>

            {/* Trực quan hoá theo từng loại action */}
            {log.action === "role.updated" && parsed.before && parsed.after && (
              <div className="space-y-2 text-xs">
                {parsed.before.RoleName !== parsed.after.RoleName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Đổi tên vai trò:</span>
                    <span>
                      <del className="text-rose-600">{parsed.before.RoleName}</del> → <strong className="text-emerald-700">{parsed.after.RoleName}</strong>
                    </span>
                  </div>
                )}
                {parsed.before.Description !== parsed.after.Description && (
                  <div>
                    <span className="text-slate-500 block mb-1">Mô tả mới:</span>
                    <p className="rounded bg-slate-50 p-2 text-slate-700 border">{parsed.after.Description || "(Để trống)"}</p>
                  </div>
                )}
              </div>
            )}

            {log.action === "account.ward_changed" && (
              <div className="text-xs space-y-1">
                <span className="text-slate-500">Điều động đơn vị:</span>
                <div className="font-semibold text-slate-800">
                  {parsed.previousWardId ? (wardsMap[parsed.previousWardId] ?? "Phường cũ") : "Chưa có"} →{" "}
                  <span className="text-emerald-700">{parsed.wardId ? (wardsMap[parsed.wardId] ?? "Phường mới") : "Rời đơn vị"}</span>
                </div>
              </div>
            )}

            {log.action === "account.front_desk_created" && (
              <div className="text-xs">
                <span className="text-slate-500">Ủy ban nhân dân công tác:</span>{" "}
                <strong>{parsed.wardId ? (wardsMap[parsed.wardId] ?? "Ủy ban Nhân dân") : "Đơn vị"}</strong>
              </div>
            )}

            {/* Hiển thị bảng cặp Key/Value nếu không rơi vào mẫu trên */}
            {log.action !== "role.updated" && log.action !== "account.ward_changed" && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(parsed).map(([k, v]) => (
                  <div key={k} className="rounded bg-slate-50 p-2 border border-slate-100">
                    <span className="text-slate-500 block text-[11px] font-medium">{k}</span>
                    <strong className="text-slate-800 break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dữ liệu thô JSON */}
        {log.details && log.details !== "{}" && (
          <details className="group">
            <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 select-none">
              Xem payload JSON gốc
            </summary>
            <pre className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-slate-900 p-3 text-xs font-mono text-emerald-400">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </Modal>
  );
}

export function AdminRbacAuditView() {
  const [data, setData] = useState<RbacPage<AuditLog>>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("ALL");
  const [date, setDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [rolesMap, setRolesMap] = useState<Record<number, Role>>({});
  const [permissionsMap, setPermissionsMap] = useState<
    Record<number, Permission>
  >({});
  const [wardsMap, setWardsMap] = useState<Record<string, string>>({});
  const userCache = useRef(new Map<string, string>());

  // Nạp danh mục Roles, Permissions, Wards bổ trợ một lần
  useEffect(() => {
    let active = true;
    void Promise.all([
      rbacApi.roles(1, 100).catch(() => null),
      rbacApi.permissions().catch(() => null),
      getWards().catch(() => null),
    ]).then(([rolesRes, permsRes, wardsRes]) => {
      if (!active) return;
      if (rolesRes?.items) {
        setRolesMap(Object.fromEntries(rolesRes.items.map((r) => [r.id, r])));
      }
      if (permsRes) {
        setPermissionsMap(Object.fromEntries(permsRes.map((p) => [p.id, p])));
      }
      if (wardsRes) {
        setWardsMap(
          Object.fromEntries(
            wardsRes.map((w) => [w.id, `${w.name} (${w.code})`]),
          ),
        );
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await rbacApi.audit(page));
    } catch (e) {
      setError(rbacError(e));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const ids = [
      ...new Set(
        data?.items.flatMap((log) =>
          [log.actorUserId, log.targetUserId].filter(
            (id): id is string => !!id,
          ),
        ) ?? [],
      ),
    ];
    const missing = ids.filter((id) => !userCache.current.has(id));
    if (!missing.length) {
      setUsers(Object.fromEntries(userCache.current));
      return;
    }
    let active = true;
    void Promise.all(
      missing.map(async (id) => {
        try {
          const account = await getAccount(id);
          userCache.current.set(id, account.username);
        } catch {
          userCache.current.set(id, "");
        }
      }),
    ).then(() => {
      if (active) setUsers(Object.fromEntries(userCache.current));
    });
    return () => {
      active = false;
    };
  }, [data]);

  const actions = useMemo(
    () => [...new Set(data?.items.map((log) => log.action) ?? [])].sort(),
    [data],
  );

  const visible = useMemo(
    () =>
      data?.items.filter((log) => {
        const actor = users[log.actorUserId] ?? "";
        const target = log.targetUserId ? (users[log.targetUserId] ?? "") : "";
        const role = log.roleId ? (rolesMap[log.roleId]?.roleName ?? "") : "";
        const perm = log.permissionId
          ? (permissionsMap[log.permissionId]?.permissionName ?? "")
          : "";
        const text =
          `${log.action} ${actionLabels[log.action] ?? ""} ${actor} ${target} ${role} ${perm} ${log.actorUserId} ${log.targetUserId ?? ""} ${log.details}`.toLowerCase();
        return (
          (action === "ALL" || log.action === action) &&
          (!date || log.createdAt.slice(0, 10) === date) &&
          text.includes(query.trim().toLowerCase())
        );
      }) ?? [],
    [action, data, date, permissionsMap, query, rolesMap, users],
  );

  return (
    <section className="admin-card admin-table-card admin-content-card">
      <div className="space-y-4 border-b border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Theo dõi chi tiết các thao tác phân quyền, bổ nhiệm và quản lý tài
            khoản trên hệ thống
          </p>
          <Button
            size="small"
            variant="outline"
            loading={loading}
            onClick={() => void load()}
          >
            {!loading && <ArrowsClockwise />} Làm mới
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_minmax(13rem,auto)_auto_auto]">
          <label className="relative">
            <span className="sr-only">Tìm nhật ký</span>
            <MagnifyingGlass
              className="absolute left-3 top-3 text-slate-400"
              size={17}
            />
            <input
              aria-label="Tìm nhật ký"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm hành động, tài khoản hoặc nội dung..."
              className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm"
            />
          </label>
          <select
            aria-label="Lọc theo hành động"
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="ALL">Tất cả hành động</option>
            {actions.map((value) => (
              <option key={value} value={value}>
                {actionLabels[value] ?? value}
              </option>
            ))}
          </select>
          <Input
            aria-label="Lọc theo ngày"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Button
            variant="ghost"
            disabled={!query && action === "ALL" && !date}
            onClick={() => {
              setQuery("");
              setAction("ALL");
              setDate("");
            }}
          >
            Xóa lọc
          </Button>
        </div>
      </div>
      <ErrorBox error={error} retry={() => void load()} />
      {!loading && !error && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th className="min-w-[150px]">Thời gian</th>
                <th className="min-w-[170px]">Hành động</th>
                <th className="min-w-[180px]">Người thực hiện</th>
                <th className="min-w-[200px]">Đối tượng tác động</th>
                <th className="min-w-[220px]">Chi tiết nghiệp vụ</th>
                <th className="w-[100px] text-right pr-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((log) => {
                const targetRole = log.roleId
                  ? rolesMap[log.roleId]
                  : undefined;
                const targetPerm = log.permissionId
                  ? permissionsMap[log.permissionId]
                  : undefined;
                return (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-xs text-slate-600">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td>
                      <strong className="block text-sm font-semibold text-slate-900">
                        {actionLabels[log.action] ?? log.action}
                      </strong>
                    </td>
                    <td>
                      <UserBadge
                        id={log.actorUserId}
                        username={users[log.actorUserId]}
                      />
                    </td>
                    <td className="text-xs space-y-1">
                      {log.targetUserId && (
                        <div>
                          <span className="text-slate-500 block mb-0.5">
                            Người dùng:
                          </span>
                          <UserBadge
                            id={log.targetUserId}
                            username={users[log.targetUserId]}
                          />
                        </div>
                      )}
                      {log.roleId && (
                        <div>
                          <span className="text-slate-500">Vai trò:</span>{" "}
                          <strong className="text-slate-800">
                            {targetRole
                              ? (roleLabels[targetRole.roleName] ??
                                targetRole.roleName)
                              : `#${log.roleId}`}
                          </strong>
                        </div>
                      )}
                      {log.permissionId && (
                        <div>
                          <span className="text-slate-500">Quyền hạn:</span>{" "}
                          <strong className="text-slate-800">
                            {targetPerm?.permissionName ??
                              `#${log.permissionId}`}
                          </strong>
                        </div>
                      )}
                      {!log.targetUserId &&
                        !log.roleId &&
                        !log.permissionId && (
                          <span className="text-slate-400">—</span>
                        )}
                    </td>
                    <td className="text-xs text-slate-600">
                      <span className="line-clamp-2" title={log.details}>
                        {log.details && log.details !== "{}" ? log.details : "—"}
                      </span>
                    </td>
                    <td className="text-right pr-4">
                      <Button
                        size="small"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 px-2.5 text-xs text-red-800 hover:bg-red-50 hover:text-red-900"
                        title="Xem chi tiết nhật ký"
                      >
                        <Eye size={15} />
                        <span>Chi tiết</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">
              Không có nhật ký phù hợp trên trang này.
            </p>
          )}
        </div>
      )}
      {data && data.total > data.pageSize && (
        <div className="flex items-center justify-between border-t p-4 text-sm">
          <span>
            Trang {data.page} · Tổng {data.total} bản ghi
          </span>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Trước
            </Button>
            <Button
              size="small"
              variant="outline"
              disabled={page * data.pageSize >= data.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Modal chi tiết nhật ký hoạt động */}
      <AuditDetailModal
        log={selectedLog}
        actorName={selectedLog ? users[selectedLog.actorUserId] : undefined}
        targetName={selectedLog?.targetUserId ? users[selectedLog.targetUserId] : undefined}
        wardsMap={wardsMap}
        rolesMap={rolesMap}
        permissionsMap={permissionsMap}
        onClose={() => setSelectedLog(null)}
      />
    </section>
  );
}
