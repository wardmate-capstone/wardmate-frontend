import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowsClockwise, Plus, UploadSimple } from '@phosphor-icons/react';
import { Button, Input, Modal, Badge, RefreshButton, TableSkeletonRows, SearchInput, Select, Pagination, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import { FormTemplateActions } from '@/components/forms/FormTemplateActions';
import { useAuthStore } from '@/stores/authStore';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { createFormTemplate, createFormTemplateSchema, formTemplateErrorMessage, getFormTemplates, uploadFormTemplateDocx, type CreateFormTemplateInput, type FormTemplateDto } from '@/lib/api/formTemplates';

export function FormsView() {
  const user = useAuthStore(s => s.user);
  const canManage = Boolean(user?.roles.includes('PROCEDURE_MANAGER') && user.permissions.includes('document.templates.manage'));
  const canRead = Boolean(user?.permissions.includes('document.templates.read') || user?.permissions.includes('document.templates.manage'));
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<FormTemplateDto | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const createLock = useRef(false);
  const uploadLock = useRef(false);
  const form = useForm<CreateFormTemplateInput>({ resolver: zodResolver(createFormTemplateSchema), defaultValues: { code: '', title: '' } });
  const list = useQuery({
    queryKey: ['form-templates', user?.id, 'list', page, searchCode, filter],
    queryFn: ({ signal }) => getFormTemplates({ page, pageSize: 10, searchCode, isActive: filter === 'ALL' ? undefined : filter === 'ACTIVE' }, signal),
    enabled: Boolean(user && canRead),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['form-templates'] });
  const create = useMutation({ mutationFn: createFormTemplate });
  const upload = useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => uploadFormTemplateDocx(id, file) });
  const guard = useUnsavedChanges((createOpen && form.formState.isDirty) || Boolean(uploadTarget && (file || replaceConfirmed)), create.isPending || upload.isPending);
  const openUpload = (target: FormTemplateDto) => {
    setUploadTarget(target); setFile(null); setReplaceConfirmed(false); setUploadError(''); upload.reset();
  };
  const submitCreate = form.handleSubmit(async values => {
    if (!canManage || createLock.current) return;
    createLock.current = true;
    try {
      const template = await create.mutateAsync(values);
      setCreateOpen(false); form.reset();
      toast.success('Đã tạo biểu mẫu. Hãy tải lên mẫu Word.');
      openUpload(template);
      await invalidate();
    } catch { /* Lỗi hiển thị trong form. */ }
    finally { createLock.current = false; }
  });
  const submitUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || !uploadTarget || uploadLock.current) return;
    if (!file || !file.name.toLowerCase().endsWith('.docx') || file.size === 0 || file.size > 20 * 1024 * 1024) {
      setUploadError('Chọn tệp Word không rỗng, tối đa 20 MB.'); return;
    }
    if (uploadTarget.fileDocxUrl && !replaceConfirmed) { setUploadError('Vui lòng xác nhận thay mẫu Word hiện tại.'); return; }
    uploadLock.current = true;
    try {
      await upload.mutateAsync({ id: uploadTarget.id, file });
      setUploadTarget(null); setFile(null); toast.success('Đã cập nhật mẫu Word.');
      await invalidate();
    } catch { /* Giữ file để người dùng thử lại. */ }
    finally { uploadLock.current = false; }
  };
  if (!canRead) return <p role="alert">Bạn chưa được cấp quyền xem kho biểu mẫu.</p>;
  const totalPages = list.data?.totalPages || 1;
  return <div className="space-y-5">
    {guard.confirmation}
    {!canManage && user?.roles.includes('IT_ADMIN') && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Bạn có thể xem kho biểu mẫu. Tạo hoặc thay mẫu Word cần vai trò Quản lý thủ tục.</p>}
    <section className="admin-card space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <form role="search" className="flex min-w-[280px] flex-1 items-center sm:max-w-md" onSubmit={event => { event.preventDefault(); setSearchCode(searchInput.trim()); setPage(1); }}>
          <label htmlFor="form-template-search" className="sr-only">Tìm theo mã biểu mẫu</label>
          <SearchInput containerClassName="flex-1" id="form-template-search" value={searchInput} onChange={event => setSearchInput(event.target.value)} onClear={() => { setSearchInput(''); setSearchCode(''); setPage(1); }} placeholder="Tìm theo mã, ví dụ: DON_01" />
          <button type="submit" className="ml-2 h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">Tìm kiếm</button>
        </form>
        <label className="sr-only" htmlFor="form-template-status">Trạng thái</label>
        <Select id="form-template-status" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Tạm dừng</option></Select>
        {canManage && <Button size="toolbar" className="ml-auto" onClick={() => { create.reset(); setCreateOpen(true); }}><Plus size={16} weight="bold" aria-hidden />Thêm biểu mẫu</Button>}
      </div>
      {list.isError ? (
        <div role="alert" className="space-y-3 text-red-800">
          <p>{formTemplateErrorMessage(list.error)}</p>
          <Button variant="outline" onClick={() => void list.refetch()}>Thử lại</Button>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="min-w-[720px]">
              <caption className="sr-only">Danh sách mẫu Word</caption>
              <thead>
                <tr>
                  {['Mã / Tên biểu mẫu', 'Tệp Word', 'Trạng thái', 'Thao tác'].map((label, idx) => (
                    <th key={label} scope="col" className={cn('p-3', idx === 3 && 'text-right')}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.isPending ? (
                  <TableSkeletonRows
                    columns={4}
                    rows={5}
                    cellClassName="p-3"
                    columnWidths={['w-48', 'w-24', 'w-24', 'ml-auto w-32']}
                    lastCellClassName="text-right"
                  />
                ) : (
                  list.data.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
            <td className="min-w-44"><p className="font-semibold">{item.code}</p><p className="mt-1">{item.title}</p></td>
            <td><Badge variant={item.fileDocxUrl ? 'success' : 'warning'}>{item.fileDocxUrl ? 'Đã có tệp Word' : 'Chưa có tệp'}</Badge></td>
            <td>{item.isActive ? 'Hoạt động' : 'Tạm dừng'}</td>
            <td className="w-[380px] min-w-[350px]">
              <FormTemplateActions templateId={item.id} name={item.title} hasFile={Boolean(item.fileDocxUrl)} managementAction={canManage && <Button variant="outline" size="small" className="gap-1.5 rounded-lg px-3 shadow-none hover:translate-y-0" onClick={() => openUpload(item)}>
                {item.fileDocxUrl ? <ArrowsClockwise size={16} aria-hidden /> : <UploadSimple size={16} aria-hidden />}
                {item.fileDocxUrl ? 'Thay đổi' : 'Tải lên'}
              </Button>} />
            </td>
          </tr>
                  ))
                )}
                {!list.isPending && list.data.items.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState title="Không tìm thấy biểu mẫu phù hợp." description="Thử tìm theo mã khác hoặc đổi trạng thái." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!list.isPending && (
            <Pagination
              label="Phân trang biểu mẫu"
              page={page}
              total={list.data.totalCount}
              pageSize={10}
              totalPages={totalPages}
              unit="biểu mẫu"
              disabled={list.isFetching}
              onPageChange={setPage}
              extra={<RefreshButton loading={list.isFetching} onClick={() => void list.refetch()} />}
            />
          )}
        </>
      )}
    </section>
    <Modal open={createOpen && canManage} onOpenChange={open => { if (!open) guard.requestClose(() => setCreateOpen(false)); }} title="Tạo biểu mẫu" description="Tạo mã và tên trước, sau đó tải lên file Word gốc.">
      <form onSubmit={submitCreate} className="space-y-4" noValidate>
        <Input label="Mã biểu mẫu" maxLength={50} required {...form.register('code')} error={form.formState.errors.code?.message} disabled={create.isPending} />
        <Input label="Tên biểu mẫu" maxLength={255} required {...form.register('title')} error={form.formState.errors.title?.message} disabled={create.isPending} />
        {create.isError && <p role="alert" className="text-sm text-red-800">{formTemplateErrorMessage(create.error)}</p>}
        <Button type="submit" loading={create.isPending}>Tạo biểu mẫu</Button>
      </form>
    </Modal>
    <Modal open={Boolean(uploadTarget) && canManage} onOpenChange={open => { if (!open) guard.requestClose(() => setUploadTarget(null)); }} title={`Tải lên mẫu Word: ${uploadTarget?.code ?? ''}`} description="Chọn tệp Word không rỗng, tối đa 20 MB.">
      <form onSubmit={submitUpload} className="space-y-4">
        <Input key={uploadTarget?.id} label="Tệp Word" type="file" accept=".docx" disabled={upload.isPending} onChange={event => { setFile(event.target.files?.[0] ?? null); setUploadError(''); upload.reset(); }} />
        {uploadTarget?.fileDocxUrl && <label className="flex min-h-12 items-center gap-3 text-sm"><input type="checkbox" checked={replaceConfirmed} disabled={upload.isPending} onChange={event => setReplaceConfirmed(event.target.checked)} />Tôi xác nhận thay mẫu Word đang được cung cấp cho các thủ tục liên kết.</label>}
        {(uploadError || upload.isError) && <p role="alert" className="text-sm text-red-800">{uploadError || formTemplateErrorMessage(upload.error)}</p>}
        <Button type="submit" loading={upload.isPending}>Tải lên mẫu Word</Button>
      </form>
    </Modal>
  </div>;
}
