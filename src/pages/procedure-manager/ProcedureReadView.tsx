import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui';
import { checklistQuantityLabel, hasFourColumnLegal, legalIssueDate, methodFeeLabel, methodTimeLabel } from '@/lib/procedureDisplay';
import type { submissionMethodSchema } from '@/lib/api/procedures';
import type { z } from 'zod';
import { ProcedureFormPicker } from './ProcedureFormPicker';

type Row = Record<string, unknown>;
type Method = z.infer<typeof submissionMethodSchema>;

const TABS = ['Thông tin chung', 'Thành phần hồ sơ', 'Quy trình', 'Thời hạn & lệ phí', 'Biểu mẫu', 'Căn cứ pháp lý', 'Thông tin khác'] as const;
const SUBMISSION_LABELS: Record<string, string> = { NOP: 'Nộp', XUAT_TRINH: 'Xuất trình' };

const record = (value: unknown): Row => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {});
const rows = (value: unknown): Row[] => (Array.isArray(value) ? value.map(record) : []);
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '');
const list = (value: unknown) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);

/** Một dòng thông tin; không có giá trị thì không vẽ (trang đọc chỉ hiện mục đã khai). */
function Item({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  if (value === '' || value === null || value === undefined || (Array.isArray(value) && !value.length)) return null;
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line break-words text-[13px] text-slate-900">
        {Array.isArray(value) ? <ul className="list-disc space-y-0.5 pl-4">{value.map((item, i) => <li key={i}>{item}</li>)}</ul> : value}
      </dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode[] }) {
  if (!children.some(Boolean)) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
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
          <Group title="Định danh thủ tục">{[
            <Item key="code" label="Mã thủ tục" value={<span className="font-mono">{text(value.procedureCode)}</span>} />,
            <Item key="cat" label="Lĩnh vực" value={text(value.categoryName)} />,
            <Item key="title" label="Tên thủ tục" value={text(value.title)} wide />,
            <Item key="level" label="Cấp thực hiện" value={text(value.levelOfImplementation) || list(content.levels).join(', ')} />,
            <Item key="target" label="Đối tượng thực hiện" value={text(value.targetAudience)} />,
            <Item key="type" label="Loại thủ tục" value={text(content.procedureType)} />,
          ]}</Group>
          <Group title="Cơ quan & pháp lý ban hành">{[
            <Item key="issuer" label="Cơ quan ban hành" value={text(value.issuingAuthority)} />,
            <Item key="exec" label="Cơ quan thực hiện" value={text(value.executingAgency)} />,
            <Item key="decision" label="Số quyết định" value={text(content.decisionNumber)} />,
            <Item key="address" label="Địa chỉ tiếp nhận" value={text(content.receivingAddress)} />,
            <Item key="competent" label="Cơ quan có thẩm quyền" value={list(content.competentAuthorities)} />,
            <Item key="agencies" label="Cơ quan thực hiện (nhiều cơ quan)" value={list(content.executingAgencies)} />,
            <Item key="authorized" label="Cơ quan được ủy quyền" value={list(content.authorizedAgencies)} />,
            <Item key="coord" label="Cơ quan phối hợp" value={list(content.coordinatingAgencies)} />,
            <Item key="addresses" label="Các địa chỉ tiếp nhận khác" value={list(content.receivingAddresses)} wide />,
          ]}</Group>
          <Group title="Yêu cầu, điều kiện & mô tả">{[
            <Item key="req" label="Yêu cầu, điều kiện thực hiện" value={text(content.requirements)} wide />,
            <Item key="desc" label="Mô tả" value={text(content.description)} wide />,
            <Item key="kw" label="Từ khóa" value={list(content.keywords).join(', ')} wide />,
          ]}</Group>
          <Group title="Thời hạn, lệ phí & kết quả">{[
            <Item key="fee" label="Tóm tắt lệ phí" value={text(value.feeSummary)} />,
            <Item key="time" label="Tóm tắt thời hạn" value={text(value.processingTimeSummary)} />,
            <Item key="results" label="Kết quả giải quyết" value={results} wide />,
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
                <thead><tr><th>Tên giấy tờ</th><th>Hình thức</th><th>Số lượng</th><th>Bắt buộc</th><th>Trường hợp</th><th>Mẫu kèm theo</th></tr></thead>
                <tbody>
                  {checklist.map((item, index) => (
                    <tr key={text(item.checklistId) || index}>
                      <td className="min-w-56">
                        <p className="font-medium text-slate-900">{text(item.itemName)}</p>
                        {(text(item.conditionNote) || text(item.note)) && <p className="mt-0.5 text-xs text-slate-500">{[text(item.conditionNote), text(item.note)].filter(Boolean).join(' · ')}</p>}
                      </td>
                      <td className="whitespace-nowrap">{SUBMISSION_LABELS[text(item.submissionType)] ?? text(item.submissionType)}</td>
                      <td>{checklistQuantityLabel(item as Parameters<typeof checklistQuantityLabel>[0])}</td>
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
                <tr><th scope="col" className="p-3">Số ký hiệu</th><th scope="col" className="p-3">Trích yếu</th><th scope="col" className="p-3 whitespace-nowrap">Ngày ban hành</th><th scope="col" className="p-3">Cơ quan ban hành</th></tr>
              ) : (
                <tr><th scope="col" className="p-3">Tên văn bản pháp lý</th><th scope="col" className="p-3">Mã văn bản</th></tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {legal.map((item, i) => legalFourColumns ? (
                <tr key={i}><td className="p-3 font-medium">{text(item.documentNumber)}</td><td className="p-3">{text(item.documentName)}</td><td className="p-3 whitespace-nowrap">{legalIssueDate(text(item.issueDate))}</td><td className="p-3">{text(item.authority)}</td></tr>
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
