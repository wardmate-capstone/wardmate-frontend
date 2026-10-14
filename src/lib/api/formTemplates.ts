import { api } from '@/lib/api';
import axios from 'axios';

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
export async function getFormTemplates(params: GetFormTemplatesParams = {}): Promise<PagedResult<FormTemplateDto>> {
  const response = await api.get<PagedResult<FormTemplateDto>>('/api/v1/form-templates', {
    params: {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.searchCode?.trim() ? { searchCode: params.searchCode.trim() } : {}),
    },
  });
  return response.data;
}

/**
 * Xem chi tiết một phôi biểu mẫu kèm cờ onlineReady
 */
export async function getFormTemplateById(templateId: string): Promise<FormTemplateDetailDto> {
  const response = await api.get<FormTemplateDetailDto>(`/api/v1/form-templates/${templateId}`);
  return response.data;
}

/**
 * Tạo mới phôi biểu mẫu (Code & Title)
 */
export async function createFormTemplate(payload: CreateFormTemplateInput): Promise<FormTemplateDetailDto> {
  const response = await api.post<FormTemplateDetailDto>('/api/v1/form-templates', {
    code: payload.code.trim().toUpperCase(),
    title: payload.title.trim(),
  });
  return response.data;
}

/**
 * Tải lên tệp Word (.docx) mẫu gốc cho biểu mẫu
 */
export async function uploadFormTemplateDocx(templateId: string, file: File): Promise<UploadDocxResultDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadDocxResultDto>(
    `/api/v1/form-templates/${templateId}/upload-docx`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Tải trực tiếp file nhị phân DOCX của biểu mẫu
 */
export async function downloadFormTemplateDocx(templateId: string): Promise<{ blob: Blob; fileName: string }> {
  const response = await api.get<Blob>(`/api/v1/form-templates/${templateId}/download-docx`, {
    responseType: 'blob',
  });

  let fileName = `template-${templateId}.docx`;
  const disposition = response.headers['content-disposition'];
  if (typeof disposition === 'string') {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(disposition);
    if (match?.[1]) {
      fileName = decodeURIComponent(match[1]);
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
  window.URL.revokeObjectURL(url);
  a.remove();
}

/**
 * Chuyển đổi thông điệp lỗi từ API Form Templates
 */
export function formTemplateErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
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
    if (error.response?.status === 403) {
      return 'Bạn không có quyền quản lý biểu mẫu (yêu cầu quyền IT_ADMIN hoặc PROCEDURE_MANAGER).';
    }
    if (error.response?.status === 404) {
      return 'Không tìm thấy biểu mẫu hoặc biểu mẫu chưa được tải tệp Word gốc.';
    }
    if (error.response?.status === 409) {
      return 'Mã biểu mẫu này đã tồn tại trong hệ thống. Vui lòng chọn mã khác.';
    }
  }
  return error instanceof Error ? error.message : 'Có lỗi xảy ra khi thao tác với biểu mẫu.';
}
