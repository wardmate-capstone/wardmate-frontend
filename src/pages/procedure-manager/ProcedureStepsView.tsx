import React, { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { ProcedureStep } from '@/types/procedureManager';

export const ProcedureStepsView: React.FC = () => {
  const [standardSteps] = useState<ProcedureStep[]>([
    {
      id: 'st-std-1',
      stepNumber: 1,
      title: 'Tra cứu & Kê khai trực tuyến trên WardMate',
      description: 'Công dân tra cứu thủ tục, điền biểu mẫu E-form và nộp hồ sơ tiền kiểm trực tuyến.',
      responsibleParty: 'CITIZEN',
      estimatedDuration: '15 phút'
    },
    {
      id: 'st-std-2',
      stepNumber: 2,
      title: 'Tiền kiểm hồ sơ tại Bộ phận Một cửa',
      description: 'Cán bộ kiểm tra tính đầy đủ, hợp lệ của giấy tờ và đối chiếu thông tin cá nhân.',
      responsibleParty: 'OFFICER',
      estimatedDuration: '2 - 4 giờ làm việc'
    },
    {
      id: 'st-std-3',
      stepNumber: 3,
      title: 'Đối chiếu hồ sơ giấy tại quầy',
      description: 'Công dân mang bản gốc đến quầy Một cửa để cán bộ kiểm tra con dấu, chữ ký và nhận biên nhận.',
      responsibleParty: 'UBND',
      estimatedDuration: '10 phút'
    },
    {
      id: 'st-std-4',
      stepNumber: 4,
      title: 'Phê duyệt & Trả kết quả giải quyết',
      description: 'Lãnh đạo UBND phường ký duyệt và cấp trả kết quả theo giấy hẹn.',
      responsibleParty: 'UBND',
      estimatedDuration: 'Theo quy định'
    }
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
            QUY TRÌNH THỰC HIỆN MẪU (STANDARD STEP FLOWS)
          </h2>
          <p className="text-xs text-slate-500">
            Mẫu quy trình phối hợp 4 bước chuẩn hóa giữa Người dân, Cán bộ Một cửa và UBND phường
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-900"
        >
          <Plus size={16} weight="bold" />
          <span>+ Thêm bước mẫu</span>
        </button>
      </div>

      <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-red-200">
        {standardSteps.map((s) => (
          <div key={s.id} className="relative">
            <span className="absolute -left-8 top-1.5 grid size-7 place-items-center rounded-full bg-red-800 text-xs font-bold text-white shadow ring-4 ring-white">
              {s.stepNumber}
            </span>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                  Chủ thể: {s.responsibleParty}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Thời lượng: {s.estimatedDuration}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-950">{s.title}</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
