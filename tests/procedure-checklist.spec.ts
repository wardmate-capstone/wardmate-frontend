import { test, expect } from '@playwright/test';
import { validateChecklistItems, validateProcedure, ProcedureValidationError } from '../src/lib/procedureValidation';
import { procedureApi, type ChecklistUpdateInput } from '../src/lib/api/procedures';
import { api } from '../src/lib/api';

test.describe('Procedure Checklist Validation & API Flow', () => {
  const allowedCases = [
    { caseCode: 'CASE_01', caseName: 'Trường hợp thông thường' },
    { caseCode: 'CASE_02', caseName: 'Trường hợp ưu tiên' },
  ];

  test('validateChecklistItems accepts valid checklist items', () => {
    const valid = [
      {
        checklistId: 'TL_01',
        caseCode: 'CASE_01',
        itemName: 'Tờ khai đăng ký',
        submissionType: 'NOP',
        documentCopyType: 'ORIGINAL',
        quantity: 1,
        isMandatory: true,
      },
      {
        checklistId: 'TL_02',
        caseCode: null,
        itemName: 'Căn cước công dân',
        submissionType: 'XUAT_TRINH',
        documentCopyType: 'REGULAR_COPY',
        quantity: 1,
        isMandatory: true,
      },
    ];

    const result = validateChecklistItems(valid, allowedCases);
    expect(result).toHaveLength(2);
    expect(result?.[0].checklistId).toBe('TL_01');
    expect(result?.[1].checklistId).toBe('TL_02');
  });

  test('validateChecklistItems rejects duplicated checklistId', () => {
    const duplicates = [
      { checklistId: 'TL_TRUNG', itemName: 'Giấy A', submissionType: 'NOP', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
      { checklistId: 'TL_TRUNG', itemName: 'Giấy B', submissionType: 'NOP', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
    ];

    expect(() => validateChecklistItems(duplicates, allowedCases)).toThrow(ProcedureValidationError);
    try {
      validateChecklistItems(duplicates, allowedCases);
    } catch (e) {
      expect((e as ProcedureValidationError).message).toContain('Mã giấy tờ không được trùng');
    }
  });

  test('validateChecklistItems rejects leading/trailing spaces in checklistId', () => {
    const spaceId = [
      { checklistId: '  TL_SPACE  ', itemName: 'Giấy A', submissionType: 'NOP', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
    ];

    expect(() => validateChecklistItems(spaceId, allowedCases)).toThrow(ProcedureValidationError);
    try {
      validateChecklistItems(spaceId, allowedCases);
    } catch (e) {
      expect((e as ProcedureValidationError).message).toContain('khoảng trắng đầu/cuối');
    }
  });

  test('validateChecklistItems rejects unlisted caseCode', () => {
    const invalidCase = [
      { checklistId: 'TL_01', caseCode: 'CASE_KHONG_TON_TAI', itemName: 'Giấy A', submissionType: 'NOP', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
    ];

    expect(() => validateChecklistItems(invalidCase, allowedCases)).toThrow(ProcedureValidationError);
    try {
      validateChecklistItems(invalidCase, allowedCases);
    } catch (e) {
      expect((e as ProcedureValidationError).message).toContain('Mã trường hợp phải thuộc các trường hợp');
    }
  });

  test('validateChecklistItems rejects checklist exceeding 500 items', () => {
    const huge = Array.from({ length: 501 }, (_, i) => ({
      checklistId: `TL_${i}`,
      itemName: `Giấy ${i}`,
      submissionType: 'NOP',
      documentCopyType: 'ORIGINAL',
      quantity: 1,
      isMandatory: true,
    }));

    expect(() => validateChecklistItems(huge, allowedCases)).toThrow(ProcedureValidationError);
    try {
      validateChecklistItems(huge, allowedCases);
    } catch (e) {
      expect((e as ProcedureValidationError).message).toContain('Checklist tối đa 500 mục');
    }
  });

  test('validateProcedure rejects zero-GUID in formDefinitions and duplicated formCode in same case', () => {
    const basePayload = {
      procedureCode: 'THU_TUC_01',
      categoryId: 1,
      title: 'Thủ tục đăng ký kết hôn tại cấp xã',
      levelOfImplementation: 'Cấp xã',
      targetAudience: 'Công dân',
      feeSummary: 'Miễn phí',
      processingTimeSummary: 'Trong ngày',
      contentPayload: {
        decisionNumber: '123/QD-UBND',
        receivingAddress: 'Bộ phận Một cửa',
        submissionMethods: [{ methodName: 'Trực tiếp', feeAmount: 0, feeUnit: 'VNĐ', estimatedDays: 1 }],
        legalReferences: [{ documentNumber: 'Luật Hộ tịch', documentName: 'Luật Hộ tịch 2014', authority: 'Quốc hội' }],
        results: ['Giấy chứng nhận kết hôn'],
        cases: [
          {
            caseCode: 'CASE_A',
            caseName: 'Công dân trong nước',
            steps: [{ stepOrder: 1, stepName: 'Nộp hồ sơ', executor: 'Công dân', actionDetails: 'Nộp hồ sơ' }],
          },
        ],
      },
      checklistSchema: [
        { checklistId: 'TL_01', caseCode: 'CASE_A', itemName: 'Tờ khai', submissionType: 'NOP', documentCopyType: 'ORIGINAL', quantity: 1, isMandatory: true },
      ],
      formDefinitions: [
        {
          formCode: 'MAU_01',
          formName: 'Mẫu đơn 1',
          formType: 'ONLINE_INTERACTIVE',
          formTemplateId: '00000000-0000-0000-0000-000000000000',
          quantity: 1,
          isMandatory: true,
          caseCode: 'CASE_A',
        },
      ],
    };

    expect(() => validateProcedure(basePayload)).toThrow(ProcedureValidationError);
    try {
      validateProcedure(basePayload);
    } catch (e) {
      expect((e as ProcedureValidationError).message).toContain('Mã template không được là GUID rỗng');
    }
  });

  test('procedureApi.updateChecklist sends correct payload and normalizes effectiveDate', async () => {
    let capturedMethod = '';
    let capturedUrl = '';
    let capturedBody: unknown = null;

    const originalPut = api.put;
    // Mock api.put
    api.put = (async (url: string, data?: unknown) => {
      capturedMethod = 'PUT';
      capturedUrl = url;
      capturedBody = data;
      return {
        data: {
          id: '11111111-2222-3333-4444-555555555555',
          procedureCode: 'TT_01',
          title: 'Thủ tục thử nghiệm',
          categoryName: 'Hộ tịch',
          categoryId: 1,
          levelOfImplementation: 'Cấp xã',
          targetAudience: 'Công dân',
          feeSummary: 'Miễn phí',
          processingTimeSummary: '1 ngày',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentPayload: {
            decisionNumber: 'QD-TEST-01',
            receivingAddress: 'Một cửa',
            submissionMethods: [],
            legalReferences: [],
            results: [],
            cases: [],
          },
          checklistSchema: [],
          formDefinitions: [],
        },
      };
    }) as typeof api.put;

    try {
      const payload: ChecklistUpdateInput = {
        expectedUpdatedAt: '2026-10-15T10:00:00.000Z',
        decisionNumber: 'QD-CHECKLIST-2026',
        effectiveDate: '2026-10-15T00:00:00.000Z',
        items: [
          {
            checklistId: 'GIAY_01',
            itemName: 'Giấy tờ tùy thân',
            submissionType: 'XUAT_TRINH',
            documentCopyType: 'ORIGINAL',
            quantity: 1,
            isMandatory: true,
          },
        ],
      };

      const result = await procedureApi.updateChecklist('11111111-2222-3333-4444-555555555555', payload);
      expect(capturedMethod).toBe('PUT');
      expect(capturedUrl).toContain('/api/v1/procedure-manager/procedures/11111111-2222-3333-4444-555555555555/checklist');
      expect(capturedBody).toMatchObject({
        expectedUpdatedAt: '2026-10-15T10:00:00.000Z',
        decisionNumber: 'QD-CHECKLIST-2026',
        effectiveDate: '2026-10-15',
      });
      expect(result.id).toBe('11111111-2222-3333-4444-555555555555');
    } finally {
      api.put = originalPut;
    }
  });
});
