import React from 'react';
import {
  Star,
  ShieldCheck,
  Clock,
  Sparkle,
  QrCode,
  Check,
} from '@phosphor-icons/react';
import { CITIZEN_FEEDBACK_DATA } from '@/data/mockManagerData';

export const CitizenFeedbackView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Criteria Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tốc độ tiền kiểm</span>
            <Clock size={18} className="text-red-800" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-900">4.88 / 5.0</span>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-red-800 h-full rounded-full" style={{ width: '97.6%' }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">98% phản hồi trong vòng 30 phút</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tính dễ hiểu của biểu mẫu</span>
            <Sparkle size={18} className="text-amber-600" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-900">4.82 / 5.0</span>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '96.4%' }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Góp ý trường cụ thể giúp sửa dễ dàng</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Thái độ phục vụ</span>
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-900">4.94 / 5.0</span>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: '98.8%' }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cán bộ hòa nhã, hướng dẫn tận tình</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tiện ích mã QR tại quầy</span>
            <QrCode size={18} className="text-indigo-600" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-900">4.91 / 5.0</span>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '98.2%' }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Không phải kê khai lại hồ sơ giấy</p>
          </div>
        </div>
      </div>

      {/* Citizen Reviews List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Ý kiến đóng góp và phản hồi từ công dân</h3>
            <p className="text-xs text-slate-500">
              Đánh giá thực tế từ người dân sau khi hoàn tất tiền kiểm và nộp hồ sơ tại UBND
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Điểm TB: 4.85 ★
          </span>
        </div>

        <div className="space-y-4">
          {CITIZEN_FEEDBACK_DATA.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-red-800 text-white font-bold text-xs shrink-0 shadow-xs">
                    {item.citizenName.slice(0, 1)}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.citizenName}</h4>
                    <p className="text-[11px] text-slate-500">
                      Mã hồ sơ: <span className="font-mono font-bold text-red-900">{item.applicationNumber}</span> • Thủ tục: <strong>{item.procedureName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      size={16}
                      weight={idx < item.rating ? 'fill' : 'regular'}
                      className={idx < item.rating ? 'text-amber-500' : 'text-slate-300'}
                    />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1.5">{item.createdAt}</span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 font-medium">
                "{item.comment}"
              </p>

              {item.officerResponse && (
                <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 text-xs text-red-950 flex items-start gap-2">
                  <Check size={16} className="text-red-700 shrink-0 mt-0.5" weight="bold" />
                  <div>
                    <strong className="text-red-900">Phản hồi từ Bộ phận Một cửa UBND:</strong> {item.officerResponse}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
