import { test, expect } from '@playwright/test';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { workflowError } from '../src/lib/api/workflow';

function createAxiosError(code: string, status = 400, message = 'Error') {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response: AxiosResponse = {
    config,
    status,
    statusText: String(status),
    headers: {},
    data: {
      code,
      message,
    },
  };
  return new AxiosError(message, 'ERR_BAD_RESPONSE', config, undefined, response);
}

test.describe('Workflow Error Humanizer - Multi-tenancy & Ward Scope', () => {
  test('chuyển mã application.ward_required (409) thành thông điệp hướng dẫn hồ sơ cũ cần bổ sung phường', () => {
    const error = createAxiosError('application.ward_required', 409);
    const message = workflowError(error);
    expect(message).toBe('Hồ sơ cũ chưa có phường tiếp nhận; cần bổ sung trước khi nộp.');
  });

  test('chuyển mã application.invalid_ward (400) thành thông điệp phường/xã không hợp lệ', () => {
    const error = createAxiosError('application.invalid_ward', 400);
    const message = workflowError(error);
    expect(message).toBe('Phường/xã tiếp nhận không hợp lệ hoặc không tồn tại trong hệ thống.');
  });

  test('chuyển mã application.iam_unavailable (503) thành thông điệp IAM tạm thời không phản hồi', () => {
    const error = createAxiosError('application.iam_unavailable', 503);
    const message = workflowError(error);
    expect(message).toBe('Hệ thống định danh xác thực tạm thời không phản hồi. Vui lòng thử lại sau giây lát.');
  });
});
