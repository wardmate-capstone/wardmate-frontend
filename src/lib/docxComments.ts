/**
 * Đọc và ghi bình luận Word (OpenXML `w:comment`) trực tiếp trong gói .docx trên trình duyệt.
 *
 * Lý do tự xử lý: thư viện soạn thảo @docx-editor.dev bản miễn phí từ chối tạo bình luận
 * ("comments and tracked changes require the pro review module"). Vì vậy cán bộ nhập nhận xét
 * trên giao diện WardMate, còn module này ghi bình luận chuẩn OpenXML vào tệp trước khi gọi
 * PUT annotate-docx. Mở tệp bằng Microsoft Word sẽ thấy bình luận ở lề phải như bình thường.
 *
 * Bình luận Word chỉ là ghi chú trên tờ khai, không phải yêu cầu bổ sung chính thức của hồ sơ.
 */
import type JSZip from 'jszip';

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const COMMENTS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments';
const COMMENTS_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml';
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const MAX_COMMENT_LENGTH = 1000;

/** Bình luận đã có trong tệp. `text` và `quote` là văn bản thuần, phải hiển thị dạng text. */
export interface DocxComment {
  id: string;
  author: string;
  initials: string;
  date?: string;
  text: string;
  /** Đoạn văn bản được bình luận; rỗng khi tệp không có vùng neo. */
  quote: string;
}

/** Bình luận cán bộ vừa nhập, chưa ghi vào tệp. */
export interface DocxCommentDraft {
  key: string;
  quote: string;
  text: string;
  createdAt: string;
  /** paraId của đoạn đầu/cuối vùng chọn, lấy từ editor để neo chính xác khi có. */
  fromParaId?: string;
  toParaId?: string;
}

export class DocxCommentError extends Error {}

async function openZip(data: Uint8Array) {
  const { default: Zip } = await import('jszip');
  return Zip.loadAsync(data);
}

function parseXml(text: string) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new DocxCommentError('Tệp Word có cấu trúc XML không hợp lệ.');
  return doc;
}

function serializeXml(doc: Document) {
  return XML_DECLARATION + new XMLSerializer().serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, '');
}

async function readPart(zip: JSZip, path: string) {
  const file = zip.file(path);
  return file ? parseXml(await file.async('string')) : null;
}

function wAttr(el: Element, name: string) {
  return el.getAttributeNS(W, name) ?? el.getAttribute(`w:${name}`) ?? '';
}

/** Đường dẫn phần comments.xml theo quan hệ của document.xml (mặc định word/comments.xml). */
function commentsPath(rels: Document | null) {
  const rel = rels && Array.from(rels.getElementsByTagNameNS(REL_NS, 'Relationship')).find(r => r.getAttribute('Type') === COMMENTS_REL);
  const target = rel?.getAttribute('Target');
  if (!target) return { path: 'word/comments.xml', exists: false };
  const path = target.startsWith('/') ? target.slice(1) : `word/${target}`.replace(/\/\.\//g, '/');
  return { path, exists: true };
}

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(-2).map(part => part[0]).join('').toLocaleUpperCase('vi') || '?';
}

function textOf(el: Element) {
  return Array.from(el.getElementsByTagNameNS(W, 'p'))
    .map(p => Array.from(p.getElementsByTagNameNS(W, 't')).map(t => t.textContent ?? '').join(''))
    .join('\n')
    .trim();
}

/** Đọc toàn bộ bình luận trong tệp, kèm đoạn văn bản được neo. */
export async function readDocxComments(data: Uint8Array): Promise<DocxComment[]> {
  const zip = await openZip(data);
  const rels = await readPart(zip, 'word/_rels/document.xml.rels');
  const part = commentsPath(rels);
  const comments = await readPart(zip, part.path);
  if (!comments) return [];
  const body = await readPart(zip, 'word/document.xml');
  const quotes = new Map<string, string>();
  if (body) {
    const active = new Set<string>();
    for (const el of Array.from(body.getElementsByTagNameNS(W, '*'))) {
      if (el.localName === 'commentRangeStart') { active.add(wAttr(el, 'id')); quotes.set(wAttr(el, 'id'), ''); }
      else if (el.localName === 'commentRangeEnd') active.delete(wAttr(el, 'id'));
      else if (active.size && (el.localName === 't' || el.localName === 'p')) {
        const piece = el.localName === 't' ? el.textContent ?? '' : ' ';
        active.forEach(id => quotes.set(id, (quotes.get(id) ?? '') + piece));
      }
    }
  }
  return Array.from(comments.getElementsByTagNameNS(W, 'comment')).map(el => {
    const id = wAttr(el, 'id');
    const author = wAttr(el, 'author') || 'Không rõ tác giả';
    return {
      id,
      author,
      initials: wAttr(el, 'initials') || initialsOf(author),
      date: wAttr(el, 'date') || undefined,
      text: textOf(el),
      quote: (quotes.get(id) ?? '').replace(/\s+/g, ' ').trim(),
    };
  });
}

// ---------------------------------------------------------------------------
// Neo bình luận vào văn bản
// ---------------------------------------------------------------------------

interface CharRef { t: Element; offset: number }

/** Các ký tự không phải khoảng trắng của đoạn văn, kèm vị trí trong từng w:t của chính đoạn đó. */
function paragraphChars(p: Element) {
  const chars: CharRef[] = [];
  let text = '';
  for (const t of Array.from(p.getElementsByTagNameNS(W, 't'))) {
    // Bỏ đoạn lồng (hộp văn bản) và w:t không nằm trong w:r.
    if (closestW(t, 'p') !== p || (t.parentNode as Element | null)?.localName !== 'r') continue;
    const value = t.textContent ?? '';
    for (let i = 0; i < value.length; i++) {
      if (/\s/.test(value[i])) continue;
      chars.push({ t, offset: i });
      text += value[i];
    }
  }
  return { chars, text };
}

function closestW(el: Element, localName: string) {
  let node = el.parentNode as Element | null;
  while (node && node.nodeType === 1) {
    if (node.namespaceURI === W && node.localName === localName) return node;
    node = node.parentNode as Element | null;
  }
  return null;
}

const compact = (value: string) => value.replace(/\s+/g, '');

function paragraphsOf(doc: Document) {
  const body = doc.getElementsByTagNameNS(W, 'body')[0];
  return body ? Array.from(body.getElementsByTagNameNS(W, 'p')) : [];
}

function paraIdOf(p: Element) {
  return p.getAttribute('w14:paraId') ?? '';
}

/** Tìm vị trí bắt đầu/kết thúc của đoạn trích trong document.xml. */
function locate(paragraphs: Element[], draft: DocxCommentDraft) {
  const lines = draft.quote.split(/\r?\n/).map(compact).filter(Boolean);
  if (!lines.length) return null;
  const first = lines[0];
  const last = lines[lines.length - 1];
  const hinted = draft.fromParaId ? paragraphs.findIndex(p => paraIdOf(p) === draft.fromParaId) : -1;
  const order = hinted >= 0 ? [hinted, ...paragraphs.keys()] : [...paragraphs.keys()];
  for (const index of order) {
    const start = paragraphChars(paragraphs[index]);
    if (lines.length === 1) {
      const at = start.text.indexOf(first);
      if (at >= 0) return { start: start.chars[at], end: start.chars[at + first.length - 1] };
      continue;
    }
    // Vùng chọn nhiều đoạn: dòng đầu phải là phần cuối của đoạn bắt đầu.
    if (!start.text.endsWith(first)) continue;
    const from = start.chars[start.text.length - first.length];
    const hintedEnd = draft.toParaId ? paragraphs.findIndex(p => paraIdOf(p) === draft.toParaId) : -1;
    const candidates = hintedEnd > index ? [hintedEnd] : paragraphs.slice(index + 1, index + lines.length + 3).map((_, k) => index + 1 + k);
    for (const endIndex of candidates) {
      const end = paragraphChars(paragraphs[endIndex]);
      if (end.text.startsWith(last)) return { start: from, end: end.chars[last.length - 1] };
    }
  }
  return null;
}

function hasContent(run: Element) {
  return Array.from(run.childNodes).some(node => node.nodeType === 1 && (node as Element).localName !== 'rPr');
}

function textElement(doc: Document, value: string) {
  const t = doc.createElementNS(W, 'w:t');
  t.setAttributeNS(XML_NS, 'xml:space', 'preserve');
  t.textContent = value;
  return t;
}

/** Tách w:r tại một ký tự của w:t; trả về hai run mới và w:t tương ứng ở mỗi bên. */
function splitRun(t: Element, offset: number) {
  const run = t.parentNode as Element;
  const doc = run.ownerDocument;
  const left = run.cloneNode(false) as Element;
  const right = run.cloneNode(false) as Element;
  let leftT: Element | null = null;
  let rightT: Element | null = null;
  let target = left;
  for (const child of Array.from(run.childNodes)) {
    if (child.nodeType === 1 && (child as Element).localName === 'rPr') {
      left.appendChild(child.cloneNode(true));
      right.appendChild(child.cloneNode(true));
      continue;
    }
    if (child === t) {
      const value = t.textContent ?? '';
      if (offset > 0) left.appendChild((leftT = textElement(doc, value.slice(0, offset))));
      if (offset < value.length) right.appendChild((rightT = textElement(doc, value.slice(offset))));
      target = right;
      continue;
    }
    target.appendChild(child);
  }
  run.parentNode!.insertBefore(left, run);
  run.parentNode!.insertBefore(right, run);
  run.parentNode!.removeChild(run);
  return { left, right, leftT, rightT };
}

function marker(doc: Document, localName: string, id: string) {
  const el = doc.createElementNS(W, `w:${localName}`);
  el.setAttributeNS(W, 'w:id', id);
  return el;
}

function anchorComment(doc: Document, start: CharRef, end: CharRef, id: string) {
  // Tách phía sau trước để tham chiếu của điểm bắt đầu vẫn đúng khi cùng một w:t.
  const tail = splitRun(end.t, end.offset + 1);
  if (!hasContent(tail.right)) tail.right.parentNode!.removeChild(tail.right);
  const startT = start.t === end.t ? tail.leftT! : start.t;
  const head = splitRun(startT, start.offset);
  if (!hasContent(head.left)) head.left.parentNode!.removeChild(head.left);
  const endRun = start.t === end.t ? head.right : tail.left;

  head.right.parentNode!.insertBefore(marker(doc, 'commentRangeStart', id), head.right);
  const reference = doc.createElementNS(W, 'w:r');
  reference.appendChild(marker(doc, 'commentReference', id));
  const after = endRun.nextSibling;
  endRun.parentNode!.insertBefore(marker(doc, 'commentRangeEnd', id), after);
  endRun.parentNode!.insertBefore(reference, after);
}

function commentElement(doc: Document, id: string, author: string, date: string, text: string) {
  const comment = doc.createElementNS(W, 'w:comment');
  comment.setAttributeNS(W, 'w:id', id);
  comment.setAttributeNS(W, 'w:author', author);
  comment.setAttributeNS(W, 'w:date', date);
  comment.setAttributeNS(W, 'w:initials', initialsOf(author));
  text.split(/\r?\n/).forEach((line, index) => {
    const p = doc.createElementNS(W, 'w:p');
    if (index === 0) {
      const ref = doc.createElementNS(W, 'w:r');
      ref.appendChild(doc.createElementNS(W, 'w:annotationRef'));
      p.appendChild(ref);
    }
    const run = doc.createElementNS(W, 'w:r');
    run.appendChild(textElement(doc, line));
    p.appendChild(run);
    comment.appendChild(p);
  });
  return comment;
}

function nextId(...docs: (Document | null)[]) {
  let max = -1;
  for (const doc of docs) {
    if (!doc) continue;
    for (const el of Array.from(doc.getElementsByTagNameNS(W, '*'))) {
      if (!['comment', 'commentRangeStart', 'commentRangeEnd', 'commentReference'].includes(el.localName)) continue;
      const value = Number(wAttr(el, 'id'));
      if (Number.isInteger(value)) max = Math.max(max, value);
    }
  }
  return max + 1;
}

/**
 * Ghi các bình luận nháp vào tệp. Không ghi được bất kỳ bình luận nào thì báo lỗi và không trả
 * tệp, tránh lưu một phần.
 */
export async function addDocxComments(data: Uint8Array, drafts: readonly DocxCommentDraft[], author: string): Promise<Uint8Array> {
  if (!drafts.length) return data;
  const zip = await openZip(data);
  const doc = await readPart(zip, 'word/document.xml');
  if (!doc) throw new DocxCommentError('Tệp Word thiếu phần nội dung chính.');
  const rels = await readPart(zip, 'word/_rels/document.xml.rels');
  if (!rels) throw new DocxCommentError('Tệp Word thiếu bảng quan hệ của nội dung chính.');
  const part = commentsPath(rels);
  const comments = (await readPart(zip, part.path)) ?? parseXml(`<w:comments xmlns:w="${W}"/>`);

  const paragraphs = paragraphsOf(doc);
  let id = nextId(doc, comments);
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  for (const draft of drafts) {
    const found = locate(paragraphs, draft);
    if (!found) {
      throw new DocxCommentError(`Không tìm thấy đoạn “${draft.quote.slice(0, 60)}” trong tờ khai. Hãy xóa bình luận này rồi bôi đen lại.`);
    }
    anchorComment(doc, found.start, found.end, String(id));
    comments.documentElement.appendChild(commentElement(comments, String(id), author, date, draft.text));
    id++;
  }

  zip.file('word/document.xml', serializeXml(doc));
  zip.file(part.path, serializeXml(comments));
  if (!part.exists) {
    const root = rels.documentElement;
    const ids = new Set(Array.from(root.getElementsByTagNameNS(REL_NS, 'Relationship')).map(r => r.getAttribute('Id')));
    let n = 1;
    while (ids.has(`rIdWmComments${n}`)) n++;
    const rel = rels.createElementNS(REL_NS, 'Relationship');
    rel.setAttribute('Id', `rIdWmComments${n}`);
    rel.setAttribute('Type', COMMENTS_REL);
    rel.setAttribute('Target', 'comments.xml');
    root.appendChild(rel);
    zip.file('word/_rels/document.xml.rels', serializeXml(rels));
  }
  const types = await readPart(zip, '[Content_Types].xml');
  if (!types) throw new DocxCommentError('Tệp Word thiếu khai báo kiểu nội dung.');
  const partName = `/${part.path}`;
  const hasOverride = Array.from(types.getElementsByTagNameNS(CT_NS, 'Override')).some(o => o.getAttribute('PartName')?.toLowerCase() === partName.toLowerCase());
  if (!hasOverride) {
    const override = types.createElementNS(CT_NS, 'Override');
    override.setAttribute('PartName', partName);
    override.setAttribute('ContentType', COMMENTS_TYPE);
    types.documentElement.appendChild(override);
    zip.file('[Content_Types].xml', serializeXml(types));
  }
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE', mimeType: DOCX_TYPE });
}
