import React from 'react';
import {
  BuildingOffice,
  ShieldCheck,
  IdentificationCard,
} from '@phosphor-icons/react';

export const OfficerProfileView: React.FC = () => {
  return (
    <section aria-label="Hồ sơ cá nhân cán bộ" className="space-y-6 max-w-4xl">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="size-20 rounded-2xl bg-red-800 text-white font-extrabold text-2xl grid place-items-center shadow-md">
            TH
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-950">Lê Thu Hà</h3>
            <p className="text-xs font-semibold text-slate-600">
              Cán bộ Bộ phận Tiếp nhận & Trả kết quả (Một cửa)
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck size={14} />
                Đang trong ca trực
              </span>
              <span>·</span>
              <span>Mã ngạch: 01.003 - Chuyên viên</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work info */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BuildingOffice size={20} className="text-red-800" />
            <h4 className="text-sm font-bold text-slate-900">Phân công quầy tiếp nhận</h4>
          </div>

          <dl className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Cơ quan:</dt>
              <dd className="font-bold text-slate-900">UBND Phường An Khánh, TP. Thủ Đức</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Vị trí trực:</dt>
              <dd className="font-bold text-red-800">Quầy số 02</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Lĩnh vực phụ trách:</dt>
              <dd className="font-medium text-slate-800">Hộ tịch, Chứng thực & Hôn nhân</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Lịch trực tuần:</dt>
              <dd className="font-medium text-slate-800">Thứ 2 đến Thứ 6 (Cả ngày)</dd>
            </div>
          </dl>
        </article>

        {/* Contact info */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IdentificationCard size={20} className="text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Thông tin liên hệ & Công vụ</h4>
          </div>

          <dl className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Email công vụ:</dt>
              <dd className="font-medium text-slate-900 font-mono">thuha.ankhanh@tphcm.gov.vn</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Điện thoại bàn quầy:</dt>
              <dd className="font-mono text-slate-800">(028) 3740 0122 - Máy lẻ 102</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <dt className="text-slate-500">Chữ ký số công vụ:</dt>
              <dd className="text-emerald-700 font-semibold">Đã cấp chứng thư số</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Lần đăng nhập cuối:</dt>
              <dd className="text-slate-500">07:28 Hôm nay (21/09/2026)</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
};
