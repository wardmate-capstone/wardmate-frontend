import type { ProcedureDetail } from '@/lib/api/procedures';

export function contentFromApi(procedure: ProcedureDetail): ProcedureContent {
  const payload = procedure.contentPayload;
  return {
    overview: procedure.targetAudience,
    methods: payload.submissionMethods.map(item => ({ method: item.methodName, processingTime: `${item.estimatedDays} ngày`, fee: item.feeAmount === 0 ? 'Miễn phí' : `${item.feeAmount.toLocaleString('vi-VN')} ${item.feeUnit}`, notes: item.note ?? '' })),
    legalBases: payload.legalReferences.map(item => ({ number: item.documentNumber, title: item.documentName, url: '' })),
    receivingAgencies: procedure.executingAgency ? [{ name: procedure.executingAgency, address: payload.receivingAddress, url: '' }] : [],
    cases: payload.cases,
    checklist: (procedure.checklistSchema ?? []).map(item => ({ ...item, caseCode: item.caseCode ?? undefined, conditionNote: item.conditionNote ?? undefined })),
  };
}

export type ProcedureStep = {
  stepOrder: number;
  stepName: string;
  executor: string;
  actionDetails: string;
};

export type ProcedureCase = {
  caseCode: string;
  caseName: string;
  description?: string;
  steps: ProcedureStep[];
};

export type ChecklistItem = {
  checklistId: string;
  caseCode?: string;
  submissionType: 'NOP' | 'XUAT_TRINH' | string;
  itemName: string;
  documentCopyType: 'ORIGINAL' | 'CERTIFIED_COPY' | 'REGULAR_COPY' | string;
  quantity: number;
  conditionNote?: string;
  isMandatory: boolean;
  templateUrl?: string;
  templateFormat?: 'DOCX' | 'PDF';
};

// Frontend-only schema. Reconcile with the backend content_payload and checklist_schema contract later.
export type ProcedureContent = {
  overview: string;
  methods: { method: string; processingTime: string; fee: string; notes: string }[];
  legalBases: { number: string; title: string; url: string }[];
  receivingAgencies: { name: string; address: string; url: string }[];
  cases: ProcedureCase[];
  checklist: ChecklistItem[];
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseProcedureContent(payload: unknown, checklistSchema?: unknown): {
  content: ProcedureContent; status: 'ready' | 'empty' | 'partial' | 'invalid';
} {
  const content: ProcedureContent = {
    overview: '',
    methods: [],
    legalBases: [],
    receivingAgencies: [],
    cases: [],
    checklist: [],
  };
  if ((payload === null || payload === undefined || payload === '') &&
      (checklistSchema === null || checklistSchema === undefined || checklistSchema === '')) {
    return { content, status: 'empty' };
  }
  let source: unknown = payload;
  if (typeof source === 'string') {
    try { source = JSON.parse(source); } catch { return { content, status: 'invalid' }; }
  }
  if (!isRecord(source) || (source.schemaVersion !== 1 && source.schemaVersion !== undefined)) {
    return { content, status: 'invalid' };
  }
  let partial = false;
  function text(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    partial = true;
    return '';
  }
  function rows(value: unknown): Record<string, unknown>[] {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) { partial = true; return []; }
    return value.filter((row) => {
      if (isRecord(row)) return true;
      partial = true;
      return false;
    });
  }
  function link(value: unknown) {
    const raw = text(value);
    if (!raw) return '';
    try {
      const parsed = new URL(raw);
      if (['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password) return parsed.href;
    } catch { /* Invalid URL is omitted; never inject raw HTML or script URLs. */ }
    partial = true;
    return '';
  }
  content.overview = text(source.overview);
  content.methods = rows(source.methods).flatMap((row) => {
    const method = text(row.method);
    if (!method) { partial = true; return []; }
    return [{ method, processingTime: text(row.processingTime), fee: text(row.fee), notes: text(row.notes) }];
  });
  content.legalBases = rows(source.legalBases).flatMap((row) => {
    const title = text(row.title);
    if (!title) { partial = true; return []; }
    return [{ title, number: text(row.number), url: link(row.url) }];
  });
  content.receivingAgencies = rows(source.receivingAgencies).flatMap((row) => {
    const name = text(row.name);
    if (!name) { partial = true; return []; }
    return [{ name, address: text(row.address), url: link(row.url) }];
  });

  // Parse Cases & Steps
  const rawCases = rows(source.cases || (source.content_payload as Record<string, unknown> | undefined)?.cases);
  content.cases = rawCases.flatMap((c, cIdx) => {
    const caseName = text(c.caseName) || `Trường hợp ${cIdx + 1}`;
    const caseCode = text(c.caseCode) || `CASE_${cIdx + 1}`;
    const description = text(c.description);
    const steps = rows(c.steps).map((s, sIdx) => ({
      stepOrder: typeof s.stepOrder === 'number' ? s.stepOrder : sIdx + 1,
      stepName: text(s.stepName) || `Bước ${sIdx + 1}`,
      executor: text(s.executor) || 'Cán bộ tiếp nhận',
      actionDetails: text(s.actionDetails),
    }));
    return [{ caseCode, caseName, description, steps }];
  });

  // Parse Checklist schema (có thể nằm trong checklistSchema độc lập hoặc trong content_payload)
  let checklistSource = checklistSchema;
  if (!checklistSource && source.checklist_schema) checklistSource = source.checklist_schema;
  if (!checklistSource && source.checklist) checklistSource = source.checklist;
  if (typeof checklistSource === 'string') {
    try { checklistSource = JSON.parse(checklistSource); } catch { /* ignore */ }
  }

  content.checklist = rows(checklistSource).flatMap((item, idx) => {
    const itemName = text(item.itemName || item.name);
    if (!itemName) { partial = true; return []; }
    return [{
      checklistId: text(item.checklistId || item.id) || `chk-${idx + 1}`,
      caseCode: text(item.caseCode) || undefined,
      submissionType: text(item.submissionType).toUpperCase() === 'XUAT_TRINH' ? 'XUAT_TRINH' : 'NOP',
      itemName,
      documentCopyType: text(item.documentCopyType).toUpperCase() || 'ORIGINAL',
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      conditionNote: text(item.conditionNote || item.notes),
      isMandatory: item.isMandatory !== false,
      templateUrl: link(item.templateUrl),
      templateFormat: (text(item.templateFormat).toUpperCase() === 'PDF' ? 'PDF' : 'DOCX') as 'DOCX' | 'PDF',
    }];
  });

  const hasContent = content.overview ||
    content.methods.length ||
    content.legalBases.length ||
    content.receivingAgencies.length ||
    content.cases.length ||
    content.checklist.length;

  return { content, status: partial ? 'partial' : hasContent ? 'ready' : 'empty' };
}
