// Frontend-only schema v1. Reconcile with the backend content_payload contract later.
export type ProcedureContent = {
  overview: string;
  methods: { method: string; processingTime: string; fee: string; notes: string }[];
  legalBases: { number: string; title: string; url: string }[];
  receivingAgencies: { name: string; address: string; url: string }[];
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseProcedureContent(payload: unknown): {
  content: ProcedureContent; status: 'ready' | 'empty' | 'partial' | 'invalid';
} {
  const content: ProcedureContent = { overview: '', methods: [], legalBases: [], receivingAgencies: [] };
  if (payload === null || payload === undefined || payload === '') return { content, status: 'empty' };
  let source: unknown = payload;
  if (typeof source === 'string') {
    try { source = JSON.parse(source); } catch { return { content, status: 'invalid' }; }
  }
  if (!isRecord(source) || source.schemaVersion !== 1) return { content, status: 'invalid' };
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
  const hasContent = content.overview || content.methods.length || content.legalBases.length || content.receivingAgencies.length;
  return { content, status: partial ? 'partial' : hasContent ? 'ready' : 'empty' };
}
