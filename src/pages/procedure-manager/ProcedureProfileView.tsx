import React from 'react';

export const ProcedureProfileView: React.FC = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
          HỒ SƠ CÁ NHÂN & PHÂN QUYỀN
        </h2>
        <p className="text-xs text-slate-500">
          Thông tin tài khoản Chuyên viên Quản lý thủ tục hành chính
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-red-800 to-red-950 text-xl font-black text-gold-300 shadow-md">
            HN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950">Lê Hoàng Nam</h3>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                Đang hoạt động
              </span>
            </div>
            <p className="text-xs text-slate-500">Trưởng bộ phận Quản lý Thủ tục & Chuẩn hóa Nghiệp vụ</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-xs space-y-3">
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500">Đơn vị công tác:</span>
            <span className="font-bold text-slate-900">Ủy ban nhân dân Phường An Khánh, TP. Thủ Đức</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500">Mã cán bộ:</span>
            <span className="font-mono font-bold text-red-900">CB-AK-0012</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500">Hộp thư công vụ:</span>
            <span className="font-mono text-slate-900">hoangnam.ankhanh@tphcm.gov.vn</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500">Vai trò hệ thống:</span>
            <span className="font-bold text-purple-900">PROCEDURE_MANAGER (Toàn quyền quản trị thủ tục)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
