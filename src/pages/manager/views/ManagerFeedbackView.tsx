import React from "react";

interface ManagerFeedbackViewProps {
  section: "feedback-reports" | "satisfaction-level";
}

export const ManagerFeedbackView: React.FC<ManagerFeedbackViewProps> = ({
  section,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. BÁO CÁO PHẢN HỒI */}
      {section === "feedback-reports" && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu phản ánh & đóng góp ý kiến từ công dân.
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API tiếp nhận ý kiến đóng góp & phản ánh của công dân sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}

      {/* 2. MỨC ĐỘ HÀI LÒNG */}
      {section === "satisfaction-level" && (
        <div className="admin-card p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Chưa có dữ liệu khảo sát đo lường mức độ hài lòng (SIPAS).
            </p>
            <p className="mt-2 text-xs text-slate-400 italic">
              ⚠️ API thống kê chỉ số mức độ hài lòng của công dân sẽ được tích hợp sau.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
