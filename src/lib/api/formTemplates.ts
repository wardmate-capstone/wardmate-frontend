import { api } from '@/lib/api';
import axios from 'axios';
import { z } from 'zod';
import { servicePath, serviceUrls } from './serviceUrls';

const documentPath = (path: string) => servicePath(serviceUrls.documentForm, path);

export const createFormTemplateSchema = z.object({
  code: z.string().trim().min(1, 'Vui lòng nhập mã biểu mẫu.').max(50, 'Mã biểu mẫu tối đa 50 ký tự.'),
  title: z.string().trim().min(1, 'Vui lòng nhập tên biểu mẫu.').max(255, 'Tên biểu mẫu tối đa 255 ký tự.'),
});

const templateSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), code: z.string().min(1), title: z.string().min(1),
  fileDocxUrl: z.string().nullable(), isActive: z.boolean(), createdAtUtc: z.string(),
  updatedAtUtc: z.string().nullish(),
});
const detailSchema = templateSchema.extend({ onlineReady: z.boolean() });
const pageSchema = z.object({
  items: z.array(templateSchema), page: z.number().int().positive(), pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
});

export interface FormTemplateDto {
  id: string;
  code: string;
  title: string;
  fileDocxUrl: string | null;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface FormTemplateDetailDto extends FormTemplateDto {
  onlineReady: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface GetFormTemplatesParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  searchCode?: string;
}

export interface CreateFormTemplateInput {
  code: string;
  title: string;
}

export interface UploadDocxResultDto {
  templateId: string;
  blobUrl: string;
}

/**
 * Lấy danh sách phôi biểu mẫu (có phân trang, tìm kiếm)
 */
export async function getFormTemplates(params: GetFormTemplatesParams = {}, signal?: AbortSignal): Promise<PagedResult<FormTemplateDto>> {
  const response = await api.get<PagedResult<FormTemplateDto>>(documentPath('/api/v1/form-templates'), {
    signal,
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.searchCode?.trim() ? { searchCode: params.searchCode.trim() } : {}),
    },
  });
  return pageSchema.parse(response.data);
}

/**
 * Xem chi tiết một phôi biểu mẫu kèm cờ onlineReady
 */
export async function getFormTemplateById(templateId: string, signal?: AbortSignal): Promise<FormTemplateDetailDto> {
  const response = await api.get<FormTemplateDetailDto>(documentPath(`/api/v1/form-templates/${templateId}`), { signal });
  return detailSchema.parse(response.data);
}

/**
 * Tạo mới phôi biểu mẫu (Code & Title)
 */
export async function createFormTemplate(payload: CreateFormTemplateInput): Promise<FormTemplateDetailDto> {
  payload = createFormTemplateSchema.parse(payload);
  const response = await api.post<FormTemplateDetailDto>(documentPath('/api/v1/form-templates'), {
    code: payload.code.trim().toUpperCase(),
    title: payload.title.trim(),
  });
  return detailSchema.parse(response.data);
}

/**
 * Tải lên tệp Word (.docx) mẫu gốc cho biểu mẫu
 */
export async function uploadFormTemplateDocx(templateId: string, file: File): Promise<UploadDocxResultDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadDocxResultDto>(
    documentPath(`/api/v1/form-templates/${templateId}/upload-docx`),
    formData,
    {
      headers: {
        // Trình duyệt/Axios gắn boundary cho FormData, không tự dựng multipart header.
        'Content-Type': undefined,
      },
    }
  );
  return response.data;
}

/**
 * Tải trực tiếp file nhị phân DOCX của biểu mẫu
 */
export async function downloadFormTemplateDocx(templateId: string, signal?: AbortSignal): Promise<{ blob: Blob; fileName: string }> {
  const response = await api.get<Blob>(documentPath(`/api/v1/form-templates/${templateId}/download-docx`), {
    responseType: 'blob',
    signal,
  }).catch(async error => {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()); }
      catch { /* Giữ lỗi HTTP nếu response không phải JSON. */ }
    }
    throw error;
  });

  let fileName = `template-${templateId}.docx`;
  const disposition = response.headers['content-disposition'];
  if (typeof disposition === 'string') {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
    if (match?.[1]) {
      try { fileName = decodeURIComponent(match[1]); }
      catch { fileName = match[1]; }
    }
  }

  return { blob: response.data, fileName };
}

/**
 * Helper kích hoạt trình duyệt tải xuống file DOCX
 */
export function triggerFileDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  a.remove();
}

/**
 * Chuyển đổi thông điệp lỗi từ API Form Templates
 */
export function formTemplateErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) return 'Dữ liệu biểu mẫu không hợp lệ. Vui lòng tải lại hoặc liên hệ quản trị viên.';
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) {
      const body = error.response.data;
      if (body?.code === 'iam.csrf_rejected') return 'Máy chủ từ chối yêu cầu do kiểm tra nguồn truy cập hoặc bảo vệ CSRF. Vui lòng liên hệ quản trị viên.';
      const reason = body && typeof body === 'object' ? body.detail || body.message || body.title : undefined;
      return 'Máy chủ từ chối thao tác biểu mẫu (403). ' + (typeof reason === 'string' && reason.trim() && reason !== 'Forbidden' ? reason : 'Vui lòng kiểm tra quyền truy cập biểu mẫu của tài khoản trên dịch vụ Document Form.')
        + (typeof body?.traceId === 'string' ? ` Mã hỗ trợ: ${body.traceId}` : '');
    }
    if (error.response?.status === 404) return 'Không tìm thấy biểu mẫu hoặc biểu mẫu chưa có tệp Word gốc.';
    if (error.response?.status === 409) return 'Mã biểu mẫu đã tồn tại. Vui lòng chọn mã khác.';
    if (!error.response) return 'Không thể kết nối kho biểu mẫu. Vui lòng thử lại.';
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      const messages: Record<string, string> = {
        'document.invalid_template': 'Mã biểu mẫu cần 1–50 ký tự và tên cần 1–255 ký tự.',
        'document.invalid_docx_file': 'Tệp Word không hợp lệ hoặc bị hỏng. Vui lòng chọn tệp .docx khác.',
        'document.empty_file': 'Tệp đã chọn không có nội dung.',
        'document.file_too_large': 'Tệp Word vượt quá giới hạn 20 MiB.',
        'document.blob_upload_failed': 'Chưa thể lưu tệp Word. Vui lòng thử lại sau.',
      };
      if ('code' in data && typeof data.code === 'string' && messages[data.code]) return messages[data.code];
      if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if ('detail' in data && typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail;
      }
      if ('title' in data && typeof data.title === 'string' && data.title.trim()) {
        return data.title;
      }
    }
  }
  return error instanceof Error ? error.message : 'Có lỗi xảy ra khi thao tác với biểu mẫu.';
}
