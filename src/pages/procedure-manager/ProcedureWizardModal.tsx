import React, { useState } from 'react';
import {
  X,
  Check,
  CaretLeft,
  CaretRight,
  Plus,
  Trash,
  Info,
  CheckCircle,
  ListChecks,
  Path,
  CurrencyCircleDollar,
  FileText,
  Scales,
  Sparkle
} from '@phosphor-icons/react';
import { ProcedureItem, ProcedureCondition, ProcedureChecklistTemplate, ProcedureStep } from '@/types/procedureManager';
import { mockProcedureCategories, mockLegalDocuments } from '@/data/mockProcedureManagerData';

interface ProcedureWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedure: ProcedureItem) => void;
  initialProcedure?: ProcedureItem | null;
}

export const ProcedureWizardModal: React.FC<ProcedureWizardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProcedure
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [code, setCode] = useState(initialProcedure?.code || 'HT-07');
  const [title, setTitle] = useState(initialProcedure?.title || '');
  const [categoryId, setCategoryId] = useState(initialProcedure?.categoryId || 'cat-hotich');
  const [description, setDescription] = useState(initialProcedure?.description || '');
  const [targetAudience, setTargetAudience] = useState(initialProcedure?.targetAudience || 'Công dân Việt Nam cư trú tại địa bàn phường.');
  const [receivingAuthority, setReceivingAuthority] = useState(initialProcedure?.receivingAuthority || 'Ủy ban nhân dân Cấp Xã / Phường');
  const [receivingLocation, setReceivingLocation] = useState(initialProcedure?.receivingLocation || 'Bộ phận Tiếp nhận và Trả kết quả (Một cửa) UBND Phường An Khánh');
  const [resultDescription, setResultDescription] = useState(initialProcedure?.resultDescription || 'Giấy chứng nhận bản chính');
  
  // Step 2: Conditions
  const [conditions, setConditions] = useState<ProcedureCondition[]>(
    initialProcedure?.conditions || [
      { id: 'c1', order: 1, content: 'Đúng cơ quan có thẩm quyền giải quyết theo địa giới hành chính.', isMandatory: true },
      { id: 'c2', order: 2, content: 'Người thực hiện có đủ năng lực hành vi dân sự.', isMandatory: true }
    ]
  );
  const [newConditionText, setNewConditionText] = useState('');

  // Step 3: Checklist
  const [checklist, setChecklist] = useState<ProcedureChecklistTemplate[]>(
    initialProcedure?.checklistTemplates || [
      {
        id: 'chk1',
        order: 1,
        documentName: 'Thẻ Căn cước / CCCD bản chính',
        description: 'Bản chính còn thời hạn sử dụng',
        isMandatory: true,
        allowUpload: true,
        maxFiles: 2,
        allowedFormats: ['jpg', 'png', 'pdf'],
        instruction: 'Chụp rõ nét hai mặt thẻ Căn cước'
      }
    ]
  );

  // Step 4: Steps
  const [steps, setSteps] = useState<ProcedureStep[]>(
    initialProcedure?.steps || [
      { id: 's1', stepNumber: 1, title: 'Nộp hồ sơ tiền kiểm trực tuyến', description: 'Công dân nộp hồ sơ trên cổng WardMate', responsibleParty: 'CITIZEN' },
      { id: 's2', stepNumber: 2, title: 'Cán bộ Một cửa tiền kiểm', description: 'Cán bộ đối chiếu thành phần và duyệt', responsibleParty: 'OFFICER' },
      { id: 's3', stepNumber: 3, title: 'Mang bản chính đến đối chiếu tại quầy', description: 'Tiếp nhận hồ sơ giấy chính thức', responsibleParty: 'UBND' }
    ]
  );

  // Step 5: Time & Fee
  const [processingTimeDays, setProcessingTimeDays] = useState(initialProcedure?.processingTimeDays ?? 1);
  const [isFeeFree, setIsFeeFree] = useState(initialProcedure?.isFeeFree ?? true);
  const [feeAmount, setFeeAmount] = useState(initialProcedure?.feeAmount ?? 0);
  const [feeNotes, setFeeNotes] = useState(initialProcedure?.feeNotes || 'Miễn lệ phí đối với công dân cư trú trên địa bàn.');

  if (!isOpen) return null;

  const stepsList = [
    { num: 1, label: 'Thông tin chung', icon: Info },
    { num: 2, label: 'Điều kiện thực hiện', icon: CheckCircle },
    { num: 3, label: 'Thành phần hồ sơ', icon: ListChecks },
    { num: 4, label: 'Quy trình thực hiện', icon: Path },
    { num: 5, label: 'Thời gian & lệ phí', icon: CurrencyCircleDollar },
    { num: 6, label: 'Biểu mẫu', icon: FileText },
    { num: 7, label: 'Văn bản pháp lý', icon: Scales },
    { num: 8, label: 'Kiểm tra & xuất bản', icon: Sparkle }
  ];

  const handleAddCondition = () => {
    if (!newConditionText.trim()) return;
    setConditions([
      ...conditions,
      {
        id: `c_${Date.now()}`,
        order: conditions.length + 1,
        content: newConditionText.trim(),
        isMandatory: true
      }
    ]);
    setNewConditionText('');
  };

  const handleDeleteCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id).map((c, idx) => ({ ...c, order: idx + 1 })));
  };

  const handleFinish = (publishDirectly: boolean) => {
    const selectedCat = mockProcedureCategories.find(c => c.id === categoryId);
    const newProc: ProcedureItem = {
      id: initialProcedure?.id || `proc_${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      categoryId,
      categoryName: selectedCat?.name || 'Hộ tịch',
      version: initialProcedure?.version || 'V1',
      status: publishDirectly ? 'PUBLISHED' : 'DRAFT',
      updatedAt: '21/09/2026',
      updatedBy: 'Lê Hoàng Nam',
      description,
      targetAudience,
      receivingAuthority,
      receivingLocation,
      resultDescription,
      processingTimeDays,
      timeUnit: 'NGAY_LAM_VIEC',
      feeAmount: isFeeFree ? 0 : feeAmount,
      isFeeFree,
      feeNotes,
      workingHoursNotes: 'Buổi sáng: 07:30 - 11:30, Buổi chiều: 13:00 - 17:00',
      conditions,
      checklistTemplates: checklist,
      steps,
      forms: initialProcedure?.forms || [],
      legalDocuments: initialProcedure?.legalDocuments || [mockLegalDocuments[0]],
      hasForms: (initialProcedure?.forms?.length || 0) > 0,
      isChecklistComplete: checklist.length > 0
    };

    onSave(newProc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-red-900 text-white font-extrabold text-sm">
              WM
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">
                {initialProcedure ? 'Chỉnh sửa Thủ tục Hành chính' : 'Tạo mới Thủ tục Hành chính (8 bước chuẩn)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Bước {currentStep}/8: {stepsList[currentStep - 1].label}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="shrink-0 overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-6 py-3">
          <div className="flex items-center gap-1.5 min-w-max">
            {stepsList.map((st) => (
              <button
                key={st.num}
                type="button"
                onClick={() => setCurrentStep(st.num)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  currentStep === st.num
                    ? 'bg-red-800 text-white shadow-sm'
                    : currentStep > st.num
                    ? 'bg-red-100 text-red-900'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span className="size-4 rounded-full bg-white/20 text-[10px] grid place-items-center">
                  {st.num}
                </span>
                <span>{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Thông tin chung */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Mã thủ tục *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: HT-01, CT-02"
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-mono font-bold text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Danh mục lĩnh vực *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:outline-none"
                  >
                    {mockProcedureCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Tên thủ tục hành chính *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Đăng ký kết hôn cho công dân trong nước"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Mô tả ngắn gọn về thủ tục</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục đích, phạm vi áp dụng..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Đối tượng thực hiện</label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Kết quả thực hiện</label>
                  <input
                    type="text"
                    value={resultDescription}
                    onChange={(e) => setResultDescription(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Cơ quan tiếp nhận</label>
                  <input
                    type="text"
                    value={receivingAuthority}
                    onChange={(e) => setReceivingAuthority(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Địa điểm tiếp nhận</label>
                  <input
                    type="text"
                    value={receivingLocation}
                    onChange={(e) => setReceivingLocation(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Điều kiện thực hiện */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Thiết lập các tiêu chí bắt buộc hoặc lưu ý mà công dân phải đáp ứng để được tiếp nhận hồ sơ.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newConditionText}
                  onChange={(e) => setNewConditionText(e.target.value)}
                  placeholder="Nhập nội dung điều kiện thực hiện..."
                  className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-xs focus:border-red-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="inline-flex items-center gap-1 rounded-xl bg-red-800 px-4 text-xs font-bold text-white hover:bg-red-900"
                >
                  <Plus size={16} weight="bold" />
                  <span>Thêm</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {conditions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-red-900">{c.order}.</span>
                      <span className="font-semibold text-slate-900">{c.content}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCondition(c.id)}
                      className="p-1 text-slate-400 hover:text-red-700"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Thành phần hồ sơ (Checklist) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Xây dựng danh mục giấy tờ yêu cầu công dân chuẩn bị và nộp tiền kiểm trên hệ thống.
              </p>

              <div className="space-y-3">
                {checklist.map((chk, idx) => (
                  <div key={chk.id} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-red-900">Giấy tờ #{idx + 1}</span>
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">Bắt buộc</span>
                    </div>
                    <input
                      type="text"
                      value={chk.documentName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChecklist(checklist.map(item => item.id === chk.id ? { ...item, documentName: val } : item));
                      }}
                      placeholder="Tên giấy tờ (VD: Thẻ CCCD, Tờ khai...)"
                      className="h-9 w-full rounded-xl border border-slate-300 px-3 text-xs font-bold text-slate-950 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={chk.instruction}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChecklist(checklist.map(item => item.id === chk.id ? { ...item, instruction: val } : item));
                      }}
                      placeholder="Hướng dẫn chuẩn bị cho công dân..."
                      className="h-8 w-full rounded-xl border border-slate-200 px-3 text-[11px] text-slate-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setChecklist([
                    ...checklist,
                    {
                      id: `chk_${Date.now()}`,
                      order: checklist.length + 1,
                      documentName: 'Giấy tờ bổ sung',
                      description: 'Mô tả giấy tờ',
                      isMandatory: true,
                      allowUpload: true,
                      maxFiles: 2,
                      allowedFormats: ['pdf', 'jpg'],
                      instruction: 'Bản chính chụp rõ nét'
                    }
                  ]);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-red-300 bg-red-50/50 px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-50"
              >
                <Plus size={16} weight="bold" />
                <span>Thêm thành phần hồ sơ mới</span>
              </button>
            </div>
          )}

          {/* Step 4: Quy trình thực hiện (Step Builder) */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Các bước tiếp nhận, xử lý nghiệp vụ giữa Công dân, Cán bộ và UBND xã/phường.
              </p>

              <div className="space-y-3">
                {steps.map((st, idx) => (
                  <div key={st.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={st.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSteps(steps.map(s => s.id === st.id ? { ...s, title: val } : s));
                        }}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSteps([
                    ...steps,
                    {
                      id: `s_${Date.now()}`,
                      stepNumber: steps.length + 1,
                      title: 'Bước xử lý tiếp theo',
                      description: 'Mô tả nội dung bước',
                      responsibleParty: 'OFFICER'
                    }
                  ]);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-red-300 bg-red-50/50 px-4 py-2 text-xs font-bold text-red-800 hover:bg-red-50"
              >
                <Plus size={16} weight="bold" />
                <span>Thêm bước quy trình</span>
              </button>
            </div>
          )}

          {/* Step 5: Thời gian & lệ phí */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-900">Thời gian giải quyết (ngày làm việc)</label>
                <input
                  type="number"
                  value={processingTimeDays}
                  onChange={(e) => setProcessingTimeDays(Number(e.target.value))}
                  min={0}
                  className="h-10 w-36 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-900 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500">* Nhập 0 nếu giải quyết ngay trong ngày làm việc.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="feeFreeCheck"
                    checked={isFeeFree}
                    onChange={(e) => setIsFeeFree(e.target.checked)}
                    className="size-4 rounded text-red-800 focus:ring-red-500"
                  />
                  <label htmlFor="feeFreeCheck" className="text-xs font-bold text-slate-900">
                    Thủ tục này được miễn toàn bộ lệ phí
                  </label>
                </div>

                {!isFeeFree && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Mức lệ phí thu (VNĐ)</label>
                    <input
                      type="number"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(Number(e.target.value))}
                      className="h-10 w-48 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Ghi chú lệ phí / Căn cứ miễn giảm</label>
                  <input
                    type="text"
                    value={feeNotes}
                    onChange={(e) => setFeeNotes(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Biểu mẫu */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Đính kèm các biểu mẫu tải về cho người dân hoặc sử dụng trong quy trình in giấy hẹn / tờ khai.
              </p>
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                <FileText size={36} className="mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-700">Kéo thả tệp PDF trống, file Word (.docx) hoặc Mẫu điền sẵn</p>
                <p className="text-[11px] text-slate-400">Hỗ trợ dung lượng tối đa 15MB cho mỗi biểu mẫu</p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Chọn tệp từ máy tính
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Văn bản pháp lý */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Chọn các Luật, Nghị định, Thông tư làm căn cứ áp dụng cho thủ tục này.
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {mockLegalDocuments.map((doc) => (
                  <label key={doc.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="size-4 rounded text-red-800" />
                    <div>
                      <span className="font-mono text-xs font-extrabold text-red-900">{doc.docNumber}</span>
                      <p className="text-xs font-bold text-slate-950">{doc.title}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 8: Kiểm tra & xuất bản */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle size={20} weight="fill" className="text-emerald-700" />
                  <span>Sẵn sàng hoàn tất kiểm tra nghiệp vụ</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Thủ tục <strong>{code} - {title || 'Thủ tục mới'}</strong> đã được cấu hình đầy đủ {conditions.length} điều kiện, {checklist.length} thành phần hồ sơ và {steps.length} bước xử lý.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
                <p>Mã thủ tục: <strong className="font-mono">{code}</strong></p>
                <p>Tên thủ tục: <strong>{title}</strong></p>
                <p>Thời gian giải quyết: <strong>{processingTimeDays === 0 ? 'Trong ngày' : `${processingTimeDays} ngày`}</strong></p>
                <p>Lệ phí: <strong>{isFeeFree ? 'Miễn phí' : `${feeAmount.toLocaleString('vi-VN')} VNĐ`}</strong></p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex h-16 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 px-6">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                <CaretLeft size={16} />
                <span>Quay lại</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFinish(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Lưu bản nháp
            </button>

            {currentStep < 8 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2 text-xs font-bold text-white hover:bg-red-900"
              >
                <span>Tiếp tục</span>
                <CaretRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-800"
              >
                <Check size={16} weight="bold" />
                <span>Xuất bản công khai</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
