import React, { useState } from "react";
import { CheckCircle, PaperPlaneRight } from "@phosphor-icons/react";
import { mockCitizenFeedbacks, mockSatisfactionMetrics } from "../mockData";
import { toast } from "@/components/ui/Toast";

interface ManagerFeedbackViewProps {
  section: "feedback-reports" | "satisfaction-level";
}

export const ManagerFeedbackView: React.FC<ManagerFeedbackViewProps> = ({
  section,
}) => {
  const [filterCategory] = useState<string>("All");
  const [feedbacks, setFeedbacks] = useState(mockCitizenFeedbacks);
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const filteredFeedbacks = feedbacks.filter((item) => {
    if (filterCategory === "All") return true;
    return item.category === filterCategory;
  });

  const handleSendReply = (id: string) => {
    const text = replyText[id];
    if (!text || !text.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi công dân");
      return;
    }

    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === id ? { ...fb, status: "Đã xử lý", resolvedNote: text } : fb,
      ),
    );
    setActiveReplyId(null);
    toast.success("Đã gửi phản hồi chính thức tới công dân thành công.");
  };

  return (
    <div className="space-y-6">
      {/* 1. BÁO CÁO PHẢN HỒI */}
      {section === "feedback-reports" && (
        <div className="space-y-6">
          {/* <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
            {/* <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ý kiến Đóng góp & Phản ánh của Công dân
              </h2>
              <p className="text-xs text-slate-500">
                Tiếp nhận từ cổng Dịch vụ công và mã QR khảo sát tại quầy tiếp nhận
              </p>
            </div> */}

          {/* <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-10 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="All">Tất cả chủ đề</option>
                <option value="Thái độ phục vụ">Thái độ phục vụ</option>
                <option value="Thời gian xử lý">Thời gian xử lý</option>
                <option value="Tiện ích số">Tiện ích số</option>
              </select>
            </div> */}
          {/* </div> */}

          <div className="space-y-4">
            {filteredFeedbacks.map((fb) => (
              <div key={fb.id} className="admin-card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="size-8 rounded-full bg-red-100 text-red-900 font-bold text-xs flex items-center justify-center">
                      {fb.citizenName.split(" ").slice(-1)[0][0]}
                    </span>
                    <div>
                      <strong className="text-xs text-slate-900 block">
                        {fb.citizenName}
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        {fb.phone} · Thủ tục: {fb.procedure}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex text-amber-500 text-sm">
                      {"★".repeat(fb.rating)}
                    </span>
                    <span
                      className={`admin-status-badge ${
                        fb.status === "Đã xử lý" ? "is-success" : "is-info"
                      }`}
                    >
                      {fb.status}
                    </span>
                    <span className="text-xs text-slate-400">{fb.date}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg">
                  "{fb.comment}"
                </p>

                {fb.resolvedNote && (
                  <div className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start gap-2">
                    <CheckCircle
                      size={16}
                      className="text-emerald-700 shrink-0 mt-0.5"
                    />
                    <div>
                      <strong className="block mb-0.5">
                        Xử lý từ cơ quan:
                      </strong>
                      <span>{fb.resolvedNote}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {activeReplyId === fb.id ? (
                    <div className="w-full space-y-2 pt-2 border-t border-slate-100">
                      <textarea
                        rows={2}
                        placeholder="Nhập nội dung phản hồi chính thức từ UBND phường..."
                        value={replyText[fb.id] || ""}
                        onChange={(e) =>
                          setReplyText({
                            ...replyText,
                            [fb.id]: e.target.value,
                          })
                        }
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs text-slate-600 rounded hover:bg-slate-100"
                          onClick={() => setActiveReplyId(null)}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className="admin-primary-action text-xs"
                          onClick={() => handleSendReply(fb.id)}
                        >
                          <PaperPlaneRight size={14} /> Gửi phản hồi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(fb.id)}
                      className="text-xs font-bold text-red-800 hover:text-red-950 px-2 py-1"
                    >
                      {fb.resolvedNote
                        ? "Chỉnh sửa phản hồi"
                        : "Phản hồi công dân"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. MỨC ĐỘ HÀI LÒNG */}
      {section === "satisfaction-level" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">
                Chỉ số hài lòng chung
              </span>
              <strong className="text-2xl text-emerald-700 block mt-1">
                99.1%
              </strong>
              <small className="text-slate-500">
                1.240 người tham gia khảo sát
              </small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">
                Đánh giá Rất hài lòng (5★)
              </span>
              <strong className="text-2xl text-slate-900 block mt-1">
                84.5%
              </strong>
              <small className="text-emerald-700 font-semibold">
                +3.2% so với quý II
              </small>
            </div>
            <div className="admin-card p-4">
              <span className="text-xs text-slate-500 block">
                Đánh giá Hài lòng (4★)
              </span>
              <strong className="text-2xl text-blue-700 block mt-1">
                14.6%
              </strong>
              <small className="text-slate-500">
                Không có phản ánh tiêu cực
              </small>
            </div>
          </div>

          <div className="admin-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Khảo sát Chi tiết theo 4 Tiêu chí Chuẩn của Bộ Nội vụ
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Đánh giá đo lường sự hài lòng của người dân (SIPAS) cấp xã, phường
            </p>

            <div className="space-y-4">
              {mockSatisfactionMetrics.map((item) => (
                <div
                  key={item.criteria}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-xs text-slate-900">
                      {item.criteria}
                    </strong>
                    <span className="text-xs font-bold text-emerald-800">
                      {item.score}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: item.score }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 block">
                    Dựa trên {item.responses.toLocaleString()} phiếu khảo sát
                    điện tử
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
