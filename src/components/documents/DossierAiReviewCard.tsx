import React, { useState } from 'react';
import { formatTime } from '@/lib/dateFormat';
import {
  Sparkle,
  CheckCircle,
  WarningCircle,
  Info,
  ArrowsClockwise,
  ArrowRight,
  FileText,
  FileDoc,
  ShieldCheck,
  CaretDown,
  CaretUp,
  Clock,
  ChatText,
} from '@phosphor-icons/react';
import { Button, Badge } from '@/components/ui';
import type { DossierAssistResultDto } from '@/lib/api/aiOcr';

interface DossierAiReviewCardProps {
  result: DossierAssistResultDto | null;
  loading: boolean;
  error: string | null;
  retryCountdown: number | null;
  onRunReview: () => void;
  onApplyComment?: (comment: string) => void;
  canReview: boolean;
  disabled?: boolean;
}

export const DossierAiReviewCard: React.FC<DossierAiReviewCardProps> = ({
  result,
  loading,
  error,
  retryCountdown,
  onRunReview,
  onApplyComment,
  canReview,
  disabled = false,
}) => {
  const [showFilesList, setShowFilesList] = useState(false);

  if (!canReview) return null;

  return (
    <div className="rounded-2xl border border-purple-200/80 bg-gradient-to-b from-purple-50/40 via-white to-white p-5 shadow-xs transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-800 shadow-xs">
            <Sparkle size={20} weight="fill" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Trợ lý AI kiểm tra hồ sơ Một cửa</span>
              <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 uppercase tracking-wide">
                Đối soát Word & Giấy tờ
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Tự động đọc tờ khai Word, đối chiếu chéo CCCD và phát hiện sai sót giấy tờ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {retryCountdown && retryCountdown > 0 ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 animate-pulse">
              <Clock size={16} weight="bold" />
              <span>Chờ hạn mức: {retryCountdown}s</span>
            </div>
          ) : (
            <Button
              type="button"
              size="small"
              variant="primary"
              disabled={loading || disabled}
              onClick={onRunReview}
              className="gap-1.5 bg-purple-700 hover:bg-purple-800 text-white shadow-xs"
            >
              <ArrowsClockwise size={15} className={loading ? 'animate-spin' : ''} weight="bold" />
              <span>{loading ? 'Đang phân tích...' : result ? 'Kiểm tra lại toàn bộ' : 'Bắt đầu kiểm tra AI'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Loading state banner */}
      {loading && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50/80 p-4 text-xs text-purple-900">
          <ArrowsClockwise size={20} className="animate-spin text-purple-700 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-semibold">AI đang phân tích tờ khai Word và các tài liệu đính kèm...</p>
            <p className="text-purple-700/80 text-[11px]">
              Quá trình đọc dữ liệu và đối chiếu chéo có thể mất từ 10 đến 45 giây. Vui lòng giữ nguyên màn hình.
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && !loading && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
          <WarningCircle size={18} weight="fill" className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Chưa thể hoàn tất kiểm tra: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Result Section */}
      {result && !loading && (
        <div className="mt-5 space-y-4 text-xs">
          {/* Assessment Banner */}
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border p-4 ${
              result.overallAssessment === 'NO_ISSUES_FOUND'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950'
                : result.overallAssessment === 'NEEDS_ATTENTION'
                ? 'border-amber-200 bg-amber-50/80 text-amber-950'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {result.overallAssessment === 'NO_ISSUES_FOUND' ? (
                <CheckCircle size={24} weight="fill" className="text-emerald-600 shrink-0" />
              ) : result.overallAssessment === 'NEEDS_ATTENTION' ? (
                <WarningCircle size={24} weight="fill" className="text-amber-600 shrink-0" />
              ) : (
                <Info size={24} weight="fill" className="text-slate-500 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {result.overallAssessment === 'NO_ISSUES_FOUND'
                      ? 'Không phát hiện vấn đề bất thường'
                      : result.overallAssessment === 'NEEDS_ATTENTION'
                      ? 'Cần lưu ý kiểm tra đối chiếu'
                      : 'Chưa đủ dữ liệu để đối chiếu'}
                  </span>
                  <Badge
                    variant={
                      result.overallAssessment === 'NO_ISSUES_FOUND'
                        ? 'success'
                        : result.overallAssessment === 'NEEDS_ATTENTION'
                        ? 'warning'
                        : 'neutral'
                    }
                    className="text-[10px]"
                  >
                    {result.overallAssessment}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-700 leading-relaxed font-normal">
                  {result.summary}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 shrink-0 self-end sm:self-center">
              Quét lúc: {formatTime(result.analyzedAt)}
            </div>
          </div>

          {/* Missing items or Issues */}
          {(result.missingItems.length > 0 || result.issues.length > 0) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5">
              {result.missingItems.length > 0 && (
                <div>
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <WarningCircle size={15} weight="fill" className="text-amber-700" />
                    <span>Giấy tờ thành phần còn thiếu ({result.missingItems.length}):</span>
                  </h4>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5 text-amber-800">
                    {result.missingItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.issues.length > 0 && (
                <div className={result.missingItems.length > 0 ? 'pt-2 border-t border-amber-200/60' : ''}>
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Info size={15} weight="bold" className="text-amber-700" />
                    <span>Các điểm nghi vấn cần kiểm tra ({result.issues.length}):</span>
                  </h4>
                  <ul className="mt-1 list-disc pl-5 space-y-0.5 text-amber-800">
                    {result.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Cross Checks Table */}
          {result.crossChecks.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={16} weight="fill" className="text-purple-700" />
                  <span>Bảng đối chiếu chéo thông tin ({result.crossChecks.length} trường)</span>
                </span>
                <span className="text-[11px] text-slate-500">So sánh Đơn Word và Giấy tờ scan</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Trường thông tin</th>
                      <th className="px-3 py-2">Trong tờ khai Word</th>
                      <th className="px-3 py-2">Trên giấy tờ kèm theo</th>
                      <th className="px-3 py-2 text-center">Kết quả đối chiếu</th>
                      <th className="px-3 py-2">Ghi chú AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.crossChecks.map((check, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                          {check.field}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-[160px] break-words">
                          {check.valueInForm || <span className="text-slate-400 italic">(Để trống)</span>}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 max-w-[180px] break-words">
                          {check.valueInDocument ? (
                            <div>
                              <span>{check.valueInDocument}</span>
                              {check.sourceDocument && (
                                <span className="block text-[10px] text-slate-400 mt-0.5">
                                  [{check.sourceDocument}]
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">(Không tìm thấy)</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {check.result === 'MATCH' ? (
                            <Badge variant="success" className="text-[11px]">Khớp</Badge>
                          ) : check.result === 'MISMATCH' ? (
                            <Badge variant="danger" className="text-[11px]">Lệch thông tin</Badge>
                          ) : (
                            <Badge variant="neutral" className="text-[11px]">Chưa có giấy tờ</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-[11px] max-w-[200px]">
                          {check.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Suggested Administrative Comment Box */}
          {result.suggestedComment && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-purple-900 flex items-center gap-1.5">
                  <ChatText size={16} weight="fill" className="text-purple-700" />
                  <span>Gợi ý nhận xét hành chính cho Cán bộ Một cửa</span>
                </span>
                {onApplyComment && (
                  <Button
                    type="button"
                    size="small"
                    variant="outline"
                    className="text-purple-800 border-purple-300 hover:bg-purple-100 font-semibold gap-1 text-xs"
                    onClick={() => onApplyComment(result.suggestedComment!)}
                  >
                    <span>Chèn vào ô nhận xét</span>
                    <ArrowRight size={13} weight="bold" />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-slate-800 border border-purple-100 leading-relaxed shadow-2xs">
                {result.suggestedComment}
              </p>
              <p className="text-[11px] text-slate-500 italic">
                * Cán bộ có thể bấm nút trên để đưa nội dung vào ô nhận xét và chủ động sửa đổi trước khi gửi cho công dân.
              </p>
            </div>
          )}

          {/* Files analyzed accordion toggle */}
          {result.files.length > 0 && (
            <div className="border-t border-slate-200 pt-2">
              <button
                type="button"
                onClick={() => setShowFilesList(prev => !prev)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                <span>Danh sách {result.files.length} tệp đã xử lý trong hồ sơ</span>
                {showFilesList ? <CaretUp size={12} /> : <CaretDown size={12} />}
              </button>

              {showFilesList && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {result.files.map(f => (
                    <div
                      key={f.id}
                      className={`flex items-start justify-between gap-2 p-2 rounded-lg border ${
                        f.analyzed ? 'border-slate-200 bg-slate-50' : 'border-amber-200 bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {f.kind === 'SUBMISSION' ? (
                          <FileDoc size={14} className="text-blue-600 shrink-0" />
                        ) : (
                          <FileText size={14} className="text-slate-500 shrink-0" />
                        )}
                        <span className="truncate text-slate-800 font-medium" title={f.fileName}>
                          {f.fileName}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px]">
                        {f.analyzed ? (
                          <span className="text-emerald-700 font-semibold">Đã quét</span>
                        ) : (
                          <span className="text-amber-800" title={f.skipReason || ''}>
                            Bỏ qua
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Disclaimer text */}
          <div className="pt-2 text-[11px] text-slate-400 italic text-center">
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
