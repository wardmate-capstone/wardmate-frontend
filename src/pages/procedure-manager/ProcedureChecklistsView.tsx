import React, { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { ProcedureChecklistTemplate } from '@/types/procedureManager';

export const ProcedureChecklistsView: React.FC = () => {
  const [templates] = useState<ProcedureChecklistTemplate[]>([
    {
      id: 'chk-cmn-1',
      order: 1,
      documentName: 'Thẻ Căn cước / CCCD (Bản chính hoặc VNeID mức 2)',
      description: 'Giấy tờ tùy thân bắt buộc để xác thực danh tính công dân',
      isMandatory: true,
      allowUpload: true,
      maxFiles: 2,
      allowedFormats: ['jpg', 'png', 'pdf'],
      instruction: 'Chụp rõ 2 mặt thẻ Căn cước, không lóa sáng'
    },
    {
      id: 'chk-cmn-2',
      order: 2,
      documentName: 'Tờ khai hành chính theo mẫu quy định',
      description: 'Tờ khai hoàn tất hoặc xuất ra từ E-form WardMate',
      isMandatory: true,
      allowUpload: true,
      maxFiles: 1,
      allowedFormats: ['pdf'],
      instruction: 'Khai đầy đủ, có chữ ký của người nộp hồ sơ'
    },
    {
      id: 'chk-cmn-3',
      order: 3,
      documentName: 'Văn bản ủy quyền hợp pháp',
      description: 'Áp dụng đối với trường hợp ủy quyền người khác nộp thay',
      isMandatory: false,
      allowUpload: true,
      maxFiles: 2,
      allowedFormats: ['pdf', 'jpg'],
      instruction: 'Được công chứng hoặc chứng thực chữ ký theo luật'
    },
    {
      id: 'chk-cmn-4',
      order: 4,
      documentName: 'Giấy chứng nhận quyền sử dụng đất / Tài sản',
      description: 'Sổ hồng, Sổ đỏ hoặc hợp đồng mua bán hợp pháp',
      isMandatory: true,
      allowUpload: true,
      maxFiles: 5,
      allowedFormats: ['pdf', 'jpg'],
      instruction: 'Đủ các trang, có dấu đỏ cơ quan có thẩm quyền'
    }
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-[-.02em] text-slate-950 sm:text-3xl">
            MẪU THÀNH PHẦN HỒ SƠ DÙNG CHUNG (CHECKLIST REPOSITORY)
          </h1>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-900"
        >
          <Plus size={16} weight="bold" />
          <span>+ Thêm thành phần mẫu</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((tpl) => (
          <div key={tpl.id} className="admin-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="grid size-7 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white">
                #{tpl.order}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                tpl.isMandatory ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
              }`}>
                {tpl.isMandatory ? 'Bắt buộc chuẩn' : 'Tùy chọn'}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-950">{tpl.documentName}</h3>
            <p className="text-xs text-slate-600">{tpl.description}</p>

            <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 space-y-1">
              <p>Định dạng: <strong>{tpl.allowedFormats.join(', ').toUpperCase()}</strong></p>
              <p>Tối đa: <strong>{tpl.maxFiles} tệp</strong></p>
              <p className="text-slate-500">Hướng dẫn: {tpl.instruction}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
