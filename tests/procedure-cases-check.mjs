// WF-CASE-01: kiểm tra logic thuần của trường hợp thủ tục (không đăng nhập, không mạng, không DOM).
// Run: node tests/procedure-cases-check.mjs
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false, logLevel: 'error',
  cacheDir: 'test-results/.vite-procedure-cases',
  optimizeDeps: { noDiscovery: true, include: [] },
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { middlewareMode: true, watch: null, hmr: false },
});
let checks = 0;
const eq = (label, actual, expected) => { assert.deepEqual(actual, expected, label); checks++; };
try {
  const cases = await server.ssrLoadModule('/src/lib/procedureCases.ts');
  const edits = await server.ssrLoadModule('/src/lib/procedureCaseEdits.ts');
  const evidence = await server.ssrLoadModule('/src/lib/documentEvidence.ts');
  const validation = await server.ssrLoadModule('/src/lib/procedureValidation.ts');

  // Kịch bản bàn giao BE mục 4: 5 giấy tờ chung, TH-1 thêm A01 (bắt buộc) + A02 (không), TH-2 thêm B01–B03.
  const item = (checklistId, caseCode = null, extra = {}) => ({ checklistId, itemName: checklistId, caseCode, isMandatory: true, submissionType: 'NOP', quantity: 1, ...extra });
  const checklist = [
    ...['C01', 'C02', 'C03', 'C04', 'C05'].map(id => item(id)),
    item('A01', 'TH-1'), item('A02', 'TH-1', { isMandatory: false, conditionNote: 'Trường hợp ủy quyền' }),
    item('B01', 'TH-2'), item('B02', 'TH-2'), item('B03', 'TH-2'),
  ];
  const procedureCases = [{ caseCode: 'TH-1', caseName: 'Trường hợp A' }, { caseCode: 'TH-2', caseName: 'Trường hợp B' }];
  const ids = list => list.map(x => x.checklistId);

  // Nhiều trường hợp: chỉ giấy tờ chung + đúng trường hợp
  eq('TH-1 = 5 chung + A01, A02', ids(cases.applicableItems(checklist, 'TH-1')), ['C01', 'C02', 'C03', 'C04', 'C05', 'A01', 'A02']);
  eq('TH-2 = 5 chung + B01–B03', ids(cases.applicableItems(checklist, 'TH-2')), ['C01', 'C02', 'C03', 'C04', 'C05', 'B01', 'B02', 'B03']);
  eq('mã phân biệt hoa/thường như BE (th-1 chỉ còn giấy tờ chung)', cases.applicableItems(checklist, 'th-1').length, 5);
  eq('bắt buộc khi chọn TH-1 = 6 (A02 không bắt buộc)', cases.countItems(cases.applicableItems(checklist, 'TH-1')).mandatory, 6);
  eq('cần chọn trường hợp khi từ 2 trường hợp', cases.requiresCaseChoice(procedureCases), true);
  eq('1 trường hợp: BE tự chọn, không hỏi', cases.requiresCaseChoice([{ caseCode: 'CASE-1', caseName: 'X' }]), false);
  eq('không có trường hợp', cases.requiresCaseChoice([]), false);
  eq('tên trường hợp', cases.caseDisplayName('TH-2', procedureCases), 'Trường hợp B');
  eq('mã không còn trong thủ tục → hiện mã', cases.caseDisplayName('TH-9', procedureCases), 'TH-9');
  eq('giấy tờ chung → không có tên trường hợp', cases.caseDisplayName(null, procedureCases), null);

  const groups = cases.groupByCase([...checklist, item('X01', 'TH-9')], procedureCases);
  eq('nhóm chung', ids(groups.common), ['C01', 'C02', 'C03', 'C04', 'C05']);
  eq('nhóm từng trường hợp', groups.cases.map(g => [g.caseCode, ids(g.items)]), [['TH-1', ['A01', 'A02']], ['TH-2', ['B01', 'B02', 'B03']]]);
  eq('giấy tờ gắn mã không tồn tại → orphans', ids(groups.orphans), ['X01']);
  eq('caseCode rỗng/khoảng trắng là giấy tờ chung', ids(cases.groupByCase([item('E1', ''), item('E2', '  ')], procedureCases).common), ['E1', 'E2']);
  eq('không có giấy tờ chung', cases.groupByCase(checklist.filter(x => x.caseCode), procedureCases).common.length, 0);
  eq('có giấy tờ riêng theo trường hợp', cases.hasCaseSpecificItems(checklist), true);
  eq('không có giấy tờ riêng', cases.hasCaseSpecificItems(checklist.filter(x => !x.caseCode), []), false);
  eq('mã gợi ý không trùng', cases.nextCaseCode([{ caseCode: 'TH-1' }, { caseCode: 'TH-3' }]), 'TH-4');
  eq('mã gợi ý bỏ qua mã đã có', cases.nextCaseCode([{ caseCode: 'TH-2' }]), 'TH-3');

  // Xem trước hồ sơ theo cách Workflow chụp snapshot: biểu mẫu chưa gắn giấy tờ thành dòng riêng; nhiều mẫu thay thế chỉ là một giấy tờ
  const forms = [
    { formCode: 'TK01', formName: 'Tờ khai mẫu 1', caseCode: null, isMandatory: true },
    { formCode: 'TK02', formName: 'Tờ khai mẫu 2', caseCode: null, isMandatory: true },
    { formCode: 'TK-B', formName: 'Đơn riêng B', caseCode: 'TH-2', isMandatory: true },
  ];
  const withForms = [item('TK', null, { formCodes: ['TK01', 'TK02'], itemName: 'Tờ khai' }), ...checklist];
  const previewA = cases.dossierPreview(withForms, forms, 'TH-1');
  eq('TH-1: tờ khai nhiều mẫu tính một dòng, không có mẫu riêng của TH-2', previewA.length, 8);
  const previewB = cases.dossierPreview(withForms, forms, 'TH-2');
  eq('TH-2: mẫu riêng chưa gắn giấy tờ thành dòng riêng của trường hợp', previewB.filter(x => !x.common).map(x => x.name), ['B01', 'B02', 'B03', 'Đơn riêng B']);
  eq('xuất trình được đánh dấu trong xem trước', cases.dossierPreview([item('P', null, { submissionType: 'XUAT_TRINH' })], [], null)[0].present, true);

  // Đổi mã trường hợp: cập nhật mọi chỗ trỏ mã cũ, không đụng trường hợp khác
  const procedure = {
    contentPayload: {
      cases: [{ caseCode: 'TH-1', caseName: 'A', steps: [] }, { caseCode: 'TH-2', caseName: 'B', steps: [] }],
      submissionMethods: [{ methodName: 'Trực tiếp', caseCode: 'TH-1', fees: [{ amount: 0, caseCode: 'TH-1' }] }, { methodName: 'Trực tuyến', caseCode: null }],
    },
    checklistSchema: checklist,
    formDefinitions: forms,
  };
  const renamed = edits.renameCase(procedure, 0, 'LAN-DAU');
  eq('đổi mã: trường hợp', renamed.contentPayload.cases.map(c => c.caseCode), ['LAN-DAU', 'TH-2']);
  eq('đổi mã: giấy tờ', renamed.checklistSchema.filter(x => x.caseCode === 'LAN-DAU').map(x => x.checklistId), ['A01', 'A02']);
  eq('đổi mã: giấy tờ TH-2 giữ nguyên', renamed.checklistSchema.filter(x => x.caseCode === 'TH-2').length, 3);
  eq('đổi mã: cách nộp và mức phí', [renamed.contentPayload.submissionMethods[0].caseCode, renamed.contentPayload.submissionMethods[0].fees[0].caseCode], ['LAN-DAU', 'LAN-DAU']);
  eq('đổi mã: không sửa dữ liệu gốc', procedure.checklistSchema[5].caseCode, 'TH-1');

  // Xóa trường hợp
  const toCommon = edits.removeCase(procedure, 1, 'common');
  eq('xóa TH-2 (chuyển về chung): còn 1 trường hợp', toCommon.contentPayload.cases.map(c => c.caseCode), ['TH-1']);
  eq('xóa TH-2 (chuyển về chung): B01–B03 thành giấy tờ chung', toCommon.checklistSchema.filter(x => x.caseCode === null).length, 8);
  eq('xóa TH-2: biểu mẫu riêng chuyển về áp dụng chung', toCommon.formDefinitions.find(f => f.formCode === 'TK-B').caseCode, null);
  const deleted = edits.removeCase(procedure, 1, 'delete');
  eq('xóa TH-2 (xóa luôn giấy tờ): còn 7 giấy tờ', ids(deleted.checklistSchema), ['C01', 'C02', 'C03', 'C04', 'C05', 'A01', 'A02']);
  const removedFirst = edits.removeCase(procedure, 0, 'common');
  eq('xóa TH-1: cách nộp và mức phí về áp dụng chung', [removedFirst.contentPayload.submissionMethods[0].caseCode, removedFirst.contentPayload.submissionMethods[0].fees[0].caseCode], [null, null]);
  eq('mã giấy tờ mới không trùng', edits.uniqueChecklistId([{ checklistId: 'GT-2' }, { checklistId: 'X' }]), 'GT-3');

  // Giấy tờ chỉ xuất trình: không bắt buộc tệp nếu công dân đã xác nhận (trạng thái COMPLETED)
  const contents = { submissions: [], supportingDocuments: [] };
  const present = { checklistId: 'p', itemName: 'CCCD', submissionType: 'XUAT_TRINH', quantity: 1, isMandatory: true, status: 'COMPLETED' };
  eq('xuất trình đã xác nhận, không tệp → đủ', evidence.hasChecklistEvidence(present, contents), true);
  eq('xuất trình chưa xác nhận → chưa đủ', evidence.hasChecklistEvidence({ ...present, status: 'PENDING' }, contents), false);
  eq('xuất trình nhưng gắn tờ khai → vẫn cần tờ khai', evidence.hasChecklistEvidence({ ...present, formTemplateId: '00000000-0000-0000-0000-000000000001' }, contents), false);
  eq('giấy tờ nộp: trạng thái COMPLETED không thay được tệp', evidence.hasChecklistEvidence({ ...present, submissionType: 'NOP' }, contents), false);
  const file = { checklistId: 'p', fileExists: true, submissionType: 'XUAT_TRINH', documentCopyType: 'ORIGINAL', quantity: 1 };
  eq('xuất trình có tệp → đủ (bằng chứng tệp)', evidence.hasFileEvidence({ ...present, status: 'PENDING' }, { submissions: [], supportingDocuments: [file] }), true);

  // Lỗi mã/tên trường hợp chuyển tới phần 2 (Thành phần hồ sơ); bước riêng vẫn ở phần 3 (Quy trình)
  eq('lỗi tên trường hợp → phần Thành phần hồ sơ', validation.procedureIssue('contentPayload.cases.0.caseName').step, 1);
  eq('lỗi mã trường hợp → phần Thành phần hồ sơ', validation.procedureIssue('contentPayload.cases.1.caseCode').step, 1);
  eq('lỗi bước riêng của trường hợp → phần Quy trình', validation.procedureIssue('contentPayload.cases.0.steps.0.stepName').step, 2);
  const base = {
    procedureCode: 'TEST-01', categoryId: 1, title: 'Thủ tục thử', contentPayload: { submissionMethods: [], legalReferences: [], results: [], cases: [{ caseCode: 'TH-1', caseName: 'A', steps: [] }] },
    checklistSchema: [{ checklistId: 'C01', caseCode: 'TH-9', submissionType: 'NOP', itemName: 'Giấy tờ', quantity: 1, isMandatory: true }], formDefinitions: [],
  };
  eq('giấy tờ gắn mã trường hợp không có → lỗi checklistSchema.0.caseCode', validation.getProcedureIssues(base).map(i => i.path).includes('checklistSchema.0.caseCode'), true);
  eq('trường hợp thiếu tên → lỗi', validation.getProcedureIssues({ ...base, checklistSchema: [], contentPayload: { ...base.contentPayload, cases: [{ caseCode: 'TH-1', caseName: '', steps: [] }] } }).some(i => i.path === 'contentPayload.cases.0.caseName' && i.step === 1), true);
  eq('dữ liệu hợp lệ', validation.getProcedureIssues({ ...base, checklistSchema: [{ ...base.checklistSchema[0], caseCode: 'TH-1' }] }).length, 0);

  // C1: mô phỏng đúng Workflow — biểu mẫu không ai tham chiếu nhưng trùng mã giấy tờ thì gắn vào giấy tờ, không thành dòng riêng
  const fallbackItems = [item('GT', null, { isMandatory: false, conditionNote: 'Nếu có', quantity: 1 }), item('X', null, { formCodes: ['TK01'] })];
  const fallbackForms = [{ formCode: 'GT', formName: 'Mẫu GT', caseCode: null, isMandatory: true, quantity: 2 }, { formCode: 'TK01', formName: 'Mẫu 1', caseCode: null, isMandatory: true }];
  const fallbackRows = cases.workflowRows(fallbackItems, fallbackForms, null);
  eq('C1: biểu mẫu trùng mã gắn vào giấy tờ, không tạo dòng mới', fallbackRows.map(r => r.key), ['c:GT', 'c:X']);
  eq('C1: giấy tờ không bắt buộc thành bắt buộc vì biểu mẫu bắt buộc trùng mã', [fallbackRows[0].mandatory, fallbackRows[0].requiredByForm], [true, true]);
  eq('C1: số lượng lấy lớn hơn giữa giấy tờ và biểu mẫu', fallbackRows[0].quantity, 2);
  eq('C2: phát hiện giấy tờ sẽ bị ép bắt buộc', [...cases.formForcedRequired(fallbackItems, fallbackForms, []).entries()], [['GT', 'Mẫu GT']]);
  eq('C2: đã tham chiếu qua formCodes thì không ép', cases.formForcedRequired([{ ...fallbackItems[0], formCodes: ['GT'] }], fallbackForms, []).size, 0);
  // B1: biểu mẫu chung chỉ được giấy tờ của TH-1 tham chiếu → ở TH-1 gắn vào giấy tờ, ở TH-2 thành dòng riêng (đúng như BE)
  const sharedForm = [{ formCode: 'CHUNG', formName: 'Mẫu chung', caseCode: null, isMandatory: true }];
  const caseItems = [item('A01', 'TH-1', { formCodes: ['CHUNG'] }), item('B01', 'TH-2')];
  eq('B1: TH-1 không có dòng biểu mẫu riêng', cases.workflowRows(caseItems, sharedForm, 'TH-1').map(r => r.key), ['c:A01']);
  eq('B1: TH-2 có dòng biểu mẫu riêng', cases.workflowRows(caseItems, sharedForm, 'TH-2').map(r => r.key), ['c:B01', 'f:CHUNG']);

  // B3: chuyển giấy tờ sang trường hợp khác bỏ liên kết biểu mẫu không áp dụng
  const moveForms = [{ formCode: 'C', caseCode: null }, { formCode: 'A', caseCode: 'TH-1' }, { formCode: 'B', caseCode: 'TH-2' }];
  const movedItem = edits.moveChecklistItem({ checklistId: 'x', caseCode: 'TH-1', formCodes: ['C', 'A'] }, 'TH-2', moveForms);
  eq('B3: giữ mẫu chung, bỏ mẫu của TH-1', [movedItem.item.caseCode, movedItem.item.formCodes, movedItem.droppedForms], ['TH-2', ['C'], ['A']]);
  eq('B3: chuyển về chung bỏ hết mẫu riêng', edits.moveChecklistItem({ checklistId: 'x', caseCode: 'TH-1', formCodes: ['A'] }, null, moveForms).item.formCodes, null);
  // B4: xóa trường hợp kèm xóa biểu mẫu riêng; giấy tờ còn lại không trỏ tới mẫu đã xóa
  const withCaseForm = { ...procedure, formDefinitions: [...forms, { formCode: 'TK01', formName: 'Trùng mã chung', caseCode: 'TH-2', isMandatory: true }], checklistSchema: [...checklist, item('B9', 'TH-2', { formCodes: ['TK-B'] })] };
  eq('B4: phát hiện trùng mã khi chuyển mẫu về chung', edits.caseFormConflicts(withCaseForm, 1), ['TK01']);
  const removedWithForms = edits.removeCase(withCaseForm, 1, 'common', 'delete');
  eq('B4: xóa biểu mẫu riêng của trường hợp', removedWithForms.formDefinitions.map(f => f.formCode), ['TK01', 'TK02']);
  eq('B4: giấy tờ chuyển về chung bỏ tham chiếu mẫu đã xóa', removedWithForms.checklistSchema.find(x => x.checklistId === 'B9').formCodes, null);

  // C3, C4: validation khớp Catalog
  const feeOrphan = { ...base, checklistSchema: [], contentPayload: { ...base.contentPayload, submissionMethods: [{ methodName: 'Trực tiếp', fees: [{ amount: 0, caseCode: 'TH-9' }] }] } };
  eq('C3: mức phí gắn trường hợp không tồn tại → lỗi', validation.getProcedureIssues(feeOrphan).some(i => i.path === 'contentPayload.submissionMethods.0.fees.0.caseCode'), true);
  const longName = { ...base, checklistSchema: [], contentPayload: { ...base.contentPayload, cases: [{ caseCode: 'TH-1', caseName: 'x'.repeat(10001), steps: [] }] } };
  eq('C4: tên trường hợp quá 10.000 ký tự → lỗi', validation.getProcedureIssues(longName).some(i => i.path === 'contentPayload.cases.0.caseName'), true);

  // Tình huống 1.001776: 5 mẫu thay thế (1, 1a–1d) để chung, không giấy tờ nào chọn → Workflow tách 5 mục riêng ở MỌI trường hợp
  const mauCodes = ['Mau1', 'Mau1a', 'Mau1b', 'Mau1c', 'Mau1d'];
  const mauForms = mauCodes.map(code => ({ formCode: code, formName: `Tờ khai (${code})`, caseCode: null, isMandatory: true }));
  const tcCases = [{ caseCode: 'TH-1', caseName: 'Hỗ trợ chăm sóc' }, { caseCode: 'TH-2', caseName: 'Trợ cấp hằng tháng' }];
  const tcItems = { contentPayload: { cases: tcCases }, checklistSchema: [item('CT', null), item('TK-DT', 'TH-2', { itemName: 'Tờ khai của đối tượng' })], formDefinitions: mauForms };
  const before = cases.standaloneForms(tcItems.checklistSchema, mauForms, tcCases);
  eq('1.001776: phát hiện 5 biểu mẫu chưa gắn', before.map(x => x.form.formCode), mauCodes);
  eq('1.001776: bị tách riêng ở cả 2 trường hợp', before[0].caseNames, ['Hỗ trợ chăm sóc', 'Trợ cấp hằng tháng']);
  const fixed = edits.attachFormsToItem(tcItems, 1, mauCodes);
  eq('gắn: giấy tờ TH-2 có 5 mẫu thay thế', fixed.checklistSchema[1].formCodes, mauCodes);
  eq('gắn: biểu mẫu chuyển sang TH-2', fixed.formDefinitions.map(f => f.caseCode), mauCodes.map(() => 'TH-2'));
  eq('sau khi gắn: không còn biểu mẫu tách riêng', cases.standaloneForms(fixed.checklistSchema, fixed.formDefinitions, tcCases).length, 0);
  eq('sau khi gắn: TH-1 chỉ 1 mục (không bị đòi 5 tờ khai)', cases.workflowRows(fixed.checklistSchema, fixed.formDefinitions, 'TH-1').length, 1);
  eq('sau khi gắn: TH-2 = 1 chung + 1 tờ khai (5 mẫu, điền 1 là đủ)', cases.workflowRows(fixed.checklistSchema, fixed.formDefinitions, 'TH-2').map(r => [r.key, r.forms.length]), [['c:CT', 0], ['c:TK-DT', 5]]);
  eq('sau khi gắn: dữ liệu hợp lệ với Catalog', validation.getProcedureIssues({ ...base, contentPayload: { ...base.contentPayload, cases: tcCases.map(c => ({ ...c, steps: [] })) }, checklistSchema: fixed.checklistSchema, formDefinitions: fixed.formDefinitions.map(f => ({ ...f, formType: 'DOCX_TEMPLATE', quantity: 1 })) }).map(i => i.path), []);

  // Xuất bản bản nháp: đổi lỗi kỹ thuật của BE thành mục dễ hiểu, chỉ tới đúng ô; lấy số từ dữ liệu đã nhập
  const publish = await server.ssrLoadModule('/src/lib/draftPublishChecks.ts');
  const draft = { contentPayload: { submissionMethods: [
    { methodName: 'Trực tiếp', feeAmount: 0, feeUnit: 'VND', estimatedDays: null, processingTime: { value: null, unit: null, text: 'Theo quy định' } },
    { methodName: 'Trực tuyến', feeAmount: null, feeUnit: null, estimatedDays: null, processingTime: { value: 5, unit: 'WORKING_DAY' }, fees: [{ amount: 20000, unit: 'VND' }, { amount: 10000, unit: 'VND' }] },
    { methodName: 'Bưu chính', feeAmount: 0, feeUnit: 'VND', estimatedDays: null, processingTime: { value: 4, unit: 'HOUR' } },
  ] } };
  const serverIssues = publish.issuesFromServerErrors({
    'contentPayload.submissionMethods[0].estimatedDays': ['x'], 'contentPayload.submissionMethods[1].estimatedDays': ['x'], 'contentPayload.submissionMethods[2].estimatedDays': ['x'],
  }, draft);
  eq('lỗi BE → nhãn dễ hiểu, không lộ tên trường', serverIssues.map(i => i.label), ['Cách nộp 1 (Trực tiếp) – Thời hạn giải quyết', 'Cách nộp 2 (Trực tuyến) – Thời hạn giải quyết', 'Cách nộp 3 (Bưu chính) – Thời hạn giải quyết']);
  eq('lỗi BE → tới ô "Số" của thời hạn ở phần 4', [serverIssues[0].path, serverIssues[0].step], ['contentPayload.submissionMethods.0.processingTime.value', 3]);
  eq('câu hướng dẫn không chứa tên trường kỹ thuật', serverIssues.every(i => !/estimatedDays|submissionMethods/.test(i.label + i.message)), true);
  eq('cách nộp 2 đã nhập 5 ngày làm việc → không còn lỗi (lấy đúng số đã nhập)', serverIssues[1].recheck(draft), false);
  const prepared = publish.prepareDraftPayloadForPublish(draft).contentPayload.submissionMethods[1];
  eq('lấy số ngày và mức phí thấp nhất từ dữ liệu đã nhập', [prepared.estimatedDays, prepared.feeAmount, prepared.feeUnit], [5, 10000, 'VND']);
  eq('thời hạn theo giờ hoặc chỉ ghi chữ: không tự điền, phải báo', publish.draftPublishIssues(draft).map(i => i.label), ['Cách nộp 1 (Trực tiếp) – Thời hạn giải quyết', 'Cách nộp 3 (Bưu chính) – Thời hạn giải quyết']);

  console.log(`${checks}/${checks} procedure case checks passed; 0 network requests.`);
} finally {
  await server.close();
}
