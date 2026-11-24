import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { checklistQuantityLabel, formatQuantityLines, hasFourColumnLegal, legalIssueDate, methodFeeLabel, methodTimeLabel } from '@/lib/procedureDisplay';
import type { submissionMethodSchema } from '@/lib/api/procedures';
import type { z } from 'zod';
import { ProcedureFormPicker } from './ProcedureFormPicker';
import { IdentificationCard, Buildings, Clock, ClipboardText } from '@phosphor-icons/react';

type Row = Record<string, unknown>;
type Method = z.infer<typeof submissionMethodSchema>;

const TABS = ['Thông tin chung', 'Thành phần hồ sơ', 'Quy trình', 'Thời hạn & lệ phí', 'Biểu mẫu', 'Căn cứ pháp lý', 'Thông tin khác'] as const;
const SUBMISSION_LABELS: Record<string, string> = { NOP: 'Nộp', XUAT_TRINH: 'Xuất trình' };

const record = (value: unknown): Row => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {});
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value.map(record) : []);
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '');
const list = (value: unknown) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);

/** Một ô thông tin trong thẻ nhóm; không có giá trị thì không vẽ. */
function Item({ label, value, wide, highlight, boxed }: { label: string; value: ReactNode; wide?: boolean; highlight?: boolean; boxed?: boolean }) {
  if (value === '' || value === null || value === undefined || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className={`space-y-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`break-words text-sm leading-relaxed ${highlight ? 'font-semibold text-slate-900 text-[15px]' : 'text-slate-800 font-medium'} ${boxed ? 'rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5 text-slate-700 whitespace-pre-line' : 'whitespace-pre-line'}`}>
        {Array.isArray(value) ? (
          <ul className="mt-1 space-y-1 pl-4 list-disc text-slate-700 text-sm">
            {value.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function Group({ title, icon, badge, children }: { title: string; icon?: ReactNode; badge?: string; children: ReactNode[] }) {
  const validChildren = children.filter(Boolean);
  if (!validChildren.length) return null;
  return (
    <section className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all hover:border-slate-300">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-slate-700">
          {icon && <span className="text-slate-600 flex items-center">{icon}</span>}
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
        </div>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
            {badge}
          </span>
        )}
      </div>
      <dl className="p-4 sm:p-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">{validChildren}</dl>
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="py-6 text-center text-[13px] text-slate-500">{children}</p>;

/**
 * Chế độ xem chi tiết thủ tục: trang đọc thay cho form ~100 ô bị khóa (L20, đề xuất 2).
 * Giữ 7 phần như form sửa; mỗi phần chỉ hiện mục có nội dung. Phần Biểu mẫu dùng lại bộ chọn mẫu (xem/tải mẫu, mở sửa).
 */
export function ProcedureReadView({ value, onEditForms, onEditChecklist }: {
  value: Row;
  onEditForms?: () => void;
  onEditChecklist?: () => void;
}) {
  const [step, setStep] = useState(0);
  const removedForms = useRef<Record<string, Row>>({});
  const content = record(value.contentPayload);
  const cases = rows(content.cases);
  const caseName = (code: unknown) => cases.find((item) => text(item.caseCode) === text(code))?.caseName as string | undefined;
  const forms = rows(value.formDefinitions);
  const formName = (code: string) => text(forms.find((item) => text(item.formCode) === code)?.formName) || code;
  const results = rows(content.resultDetails).length
    ? rows(content.resultDetails).map((item) => [text(item.name), text(item.code) && `mã ${text(item.code)}`, text(item.validity) && `hiệu lực ${text(item.validity)}`, text(item.note)].filter(Boolean).join(' · '))
    : list(content.results);
  const checklist = rows(value.checklistSchema);
  const methods = rows(content.submissionMethods) as unknown as Method[];
  const steps = (items: unknown) => rows(items).sort((a, b) => Number(a.stepOrder ?? 0) - Number(b.stepOrder ?? 0));
  const legal = rows(content.legalReferences).filter((item) => text(item.documentName) || text(item.documentNumber));
  const legalFourColumns = hasFourColumnLegal(legal.map((item) => ({ issueDate: text(item.issueDate), authority: text(item.authority) })));
  const sections = rows(content.additionalSections).filter((item) => text(item.title) || text(item.content));

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-3" aria-label="Các phần nội dung thủ tục">
        {TABS.map((label, index) => (
          <button
            type="button"
            key={label}
            onClick={() => setStep(index)}
            aria-pressed={step === index}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${step === index ? 'bg-red-800 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <span className="tabular-nums opacity-70">{index + 1}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <Group title="Định danh thủ tục" icon={<IdentificationCard size={18} className="text-blue-600" />}>{[
            <Item key="code" label="Mã thủ tục" value={<span className="inline-flex items-center px-2.5 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs">{text(value.procedureCode)}</span>} />,
            <Item key="cat" label="Lĩnh vực" value={<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">{text(value.categoryName)}</span>} />,
            <Item key="title" label="Tên thủ tục" value={text(value.title)} wide highlight />,
            <Item key="level" label="Cấp thực hiện" value={<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">{text(value.levelOfImplementation) || list(content.levels).join(', ')}</span>} />,
            <Item key="target" label="Đối tượng thực hiện" value={text(value.targetAudience)} />,
            <Item key="type" label="Loại thủ tục" value={text(content.procedureType)} />,
          ]}</Group>
          <Group title="Cơ quan & pháp lý ban hành" icon={<Buildings size={18} className="text-amber-600" />}>{[
            <Item key="issuer" label="Cơ quan ban hành" value={text(value.issuingAuthority)} />,
            <Item key="exec" label="Cơ quan thực hiện" value={text(value.executingAgency)} />,
            <Item key="decision" label="Số quyết định" value={<span className="font-semibold text-slate-900">{text(content.decisionNumber)}</span>} />,
            <Item key="address" label="Địa chỉ tiếp nhận" value={text(content.receivingAddress)} />,
            <Item key="competent" label="Cơ quan có thẩm quyền" value={list(content.competentAuthorities)} />,
            <Item key="agencies" label="Cơ quan thực hiện (nhiều cơ quan)" value={list(content.executingAgencies)} />,
            <Item key="authorized" label="Cơ quan được ủy quyền" value={list(content.authorizedAgencies)} />,
            <Item key="coord" label="Cơ quan phối hợp" value={list(content.coordinatingAgencies)} />,
            <Item key="addresses" label="Các địa chỉ tiếp nhận khác" value={list(content.receivingAddresses)} wide />,
          ]}</Group>
          <Group title="Thời hạn, lệ phí & kết quả" icon={<Clock size={18} className="text-indigo-600" />}>{[
            <Item key="time" label="Tóm tắt thời hạn" value={<span className="inline-block rounded-md border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-xs font-semibold text-indigo-700">{text(value.processingTimeSummary) || 'Theo quy định'}</span>} />,
            <Item key="fee" label="Tóm tắt lệ phí" value={<span className="inline-block rounded-md border border-emerald-100 bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-700">{text(value.feeSummary) || 'Miễn phí'}</span>} />,
            <Item key="results" label="Kết quả giải quyết" value={results} wide />,
          ]}</Group>
          <Group title="Yêu cầu, điều kiện & mô tả" icon={<ClipboardText size={18} className="text-purple-600" />}>{[
            <Item key="req" label="Yêu cầu, điều kiện thực hiện" value={text(content.requirements)} wide boxed />,
            <Item key="desc" label="Mô tả" value={text(content.description)} wide boxed />,
            <Item key="kw" label="Từ khóa" value={list(content.keywords).length ? <div className="mt-1 flex flex-wrap gap-1.5">{list(content.keywords).map((kw, i) => <span key={i} className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200/70">{kw}</span>)}</div> : null} wide />,
          ]}</Group>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {onEditChecklist && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-[13px] text-slate-600">Cập nhật riêng danh mục giấy tờ theo quyết định mới mà không đổi các phần khác.</p>
              <Button size="small" variant="outline" onClick={onEditChecklist}>Cập nhật danh mục giấy tờ (Checklist)</Button>
            </div>
          )}
          {!checklist.length ? <Empty>Thủ tục chưa khai thành phần hồ sơ.</Empty> : (
            <div className="admin-table-wrap overflow-x-auto">
              <table>
                <thead><tr><th>Tên giấy tờ</th><th>Hình thức</th><th className="whitespace-nowrap min-w-[130px]">Số lượng</th><th>Bắt buộc</th><th>Trường hợp</th><th>Mẫu kèm theo</th></tr></thead>
                <tbody>
                  {checklist.map((item, index) => (
                    <tr key={text(item.checklistId) || index}>
                      <td className="min-w-56">
                        <p className="font-medium text-slate-900">{text(item.itemName)}</p>
                        {(text(item.conditionNote) || text(item.note)) && <p className="mt-0.5 text-xs text-slate-500">{[text(item.conditionNote), text(item.note)].filter(Boolean).join(' · ')}</p>}
                      </td>
                      <td className="whitespace-nowrap">{SUBMISSION_LABELS[text(item.submissionType)] ?? text(item.submissionType)}</td>
                      <td className="whitespace-nowrap">
                        {formatQuantityLines(checklistQuantityLabel(item as Parameters<typeof checklistQuantityLabel>[0])).map((line, lIdx) => (
                          <span key={lIdx} className="block whitespace-nowrap">{line}</span>
                        ))}
                      </td>
                      <td className="whitespace-nowrap">{item.isMandatory ? 'Có' : 'Không'}</td>
                      <td>{text(item.caseCode) ? caseName(item.caseCode) || text(item.caseCode) : 'Áp dụng chung'}</td>
                      <td>{list(item.formCodes).map(formName).join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {step === 2 && (() => {
        const common = steps(content.commonSteps);
        const stepList = (items: Row[]) => (
          <ol className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="rounded-lg border border-slate-200 p-3">
                <p className="text-[13px] font-semibold text-slate-900">Bước {text(item.stepOrder) || i + 1}{text(item.stepName) ? `: ${text(item.stepName)}` : ''}</p>
                {text(item.executor) && <p className="mt-0.5 text-xs text-slate-500">Thực hiện: {text(item.executor)}</p>}
                {text(item.actionDetails) && <p className="mt-1.5 whitespace-pre-line text-[13px] text-slate-700">{text(item.actionDetails)}</p>}
              </li>
            ))}
          </ol>
        );
        if (!text(content.stepsText) && !common.length && !cases.length) return <Empty>Thủ tục chưa khai quy trình thực hiện.</Empty>;
        return (
          <div className="space-y-6">
            {text(content.stepsText) && <dl><Item label="Trình tự thực hiện" value={text(content.stepsText)} /></dl>}
            {!!common.length && <section className="space-y-3"><h3 className="text-[13px] font-semibold text-slate-800">Bước chung</h3>{stepList(common)}</section>}
            {cases.map((item, i) => (
              <section key={i} className="space-y-3">
                <h3 className="text-[13px] font-semibold text-slate-800">Trường hợp {text(item.caseCode)}{text(item.caseName) ? `: ${text(item.caseName)}` : ''}</h3>
                {steps(item.steps).length ? stepList(steps(item.steps)) : <p className="text-[13px] text-slate-500">Chưa tách bước cho trường hợp này.</p>}
              </section>
            ))}
          </div>
        );
      })()}

      {step === 3 && (!methods.length ? <Empty>Thủ tục chưa khai cách thức nộp, thời hạn và lệ phí.</Empty> : (
        <div className="admin-table-wrap overflow-x-auto">
          <table>
            <thead><tr><th>Cách thức nộp</th><th>Thời hạn giải quyết</th><th>Phí, lệ phí</th><th>Trường hợp</th></tr></thead>
            <tbody>
              {methods.map((method, i) => (
                <tr key={i}>
                  <td className="min-w-40">
                    <p className="font-medium text-slate-900">{method.methodName}</p>
                    {method.note?.trim() && <p className="mt-0.5 text-xs text-slate-500">{method.note.trim()}</p>}
                  </td>
                  <td>{methodTimeLabel(method) ?? 'Không quy định'}</td>
                  <td>{methodFeeLabel(method) ?? 'Không quy định'}</td>
                  <td>{method.caseCode ? caseName(method.caseCode) || method.caseCode : 'Áp dụng chung'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {step === 4 && (
        <ProcedureFormPicker
          removedForms={removedForms.current}
          onEdit={onEditForms}
          cases={cases.map((item) => ({ code: text(item.caseCode), name: text(item.caseName) }))}
          value={value.formDefinitions}
          disabled
          change={() => undefined}
        />
      )}

      {/* PROC-LEGAL-01: có ngày/cơ quan ban hành → bảng 4 cột Cổng DVC; không thì giữ 2 cột như cũ */}
      {step === 5 && (!legal.length ? <Empty>Thủ tục chưa khai căn cứ pháp lý.</Empty> : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              {legalFourColumns ? (
                <tr><th scope="col" className="p-3">Số ký hiệu</th><th scope="col" className="p-3">Trích yếu</th><th scope="col" className="p-3 whitespace-nowrap">Ngày ban hành</th><th scope="col" className="p-3 whitespace-nowrap min-w-[140px]">Cơ quan ban hành</th></tr>
              ) : (
                <tr><th scope="col" className="p-3">Tên văn bản pháp lý</th><th scope="col" className="p-3">Mã văn bản</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {legal.map((item, i) => legalFourColumns ? (
                <tr key={i}><td className="p-3 font-medium">{text(item.documentNumber)}</td><td className="p-3">{text(item.documentName)}</td><td className="p-3 whitespace-nowrap">{legalIssueDate(text(item.issueDate))}</td><td className="p-3 whitespace-nowrap">{text(item.authority)}</td></tr>
              ) : (
                <tr key={i}><td className="p-3">{text(item.documentName)}</td><td className="p-3 font-medium whitespace-nowrap">{text(item.documentNumber)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {step === 6 && (!sections.length ? <Empty>Không có thông tin khác.</Empty> : (
        <dl className="space-y-4">
          {sections.map((item, i) => <Item key={i} label={text(item.title) || `Mục ${i + 1}`} value={text(item.content)} />)}
        </dl>
      ))}

      <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">Đang xem nội dung thủ tục. Bấm “Chỉnh sửa” ở đầu trang để sửa.</p>
    </div>
  );
}
