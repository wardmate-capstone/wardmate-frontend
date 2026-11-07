import { useState } from 'react';
import {
  Sparkle,
  WarningCircle,
  ArrowsClockwise,
  ShieldCheck,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import { Button, Badge } from '@/components/ui';
import { aiOcrApi, type DocumentVerificationDto } from '@/lib/api/aiOcr';

interface DocumentAiVerificationProps {
  applicationId: string;
  documentId: string;
  fileName: string;
  expectedType?: string | null;
  disabled?: boolean;
}

export function DocumentAiVerificationCard({
  applicationId,
  documentId,
  fileName,
  expectedType,
  disabled = false,
}: DocumentAiVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentVerificationDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  async function handleVerify() {
    if (loading || disabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await aiOcrApi.verifyDocument({
        applicationId,
        documentId,
        expectedType,
      });
      setResult(data);
      setExpanded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chưa kiểm tra được bằng AI.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {!result && !loading && !error && (
        <Button
          type="button"
          size="small"
          variant="outline"
          disabled={disabled || loading}
          onClick={() => void handleVerify()}
          className="gap-1.5 text-xs font-semibold text-purple-700 border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-300"
          title={`Kiểm tra sơ bộ bằng AI: ${fileName}`}
        >
          <Sparkle size={15} weight="fill" className="text-purple-600 shrink-0" aria-hidden />
          <span>Kiểm tra sơ bộ bằng AI</span>
        </Button>
      )}

      {loading && (
        <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50/60 px-3 py-1.5 text-xs text-purple-800">
          <ArrowsClockwise size={15} className="animate-spin text-purple-600 shrink-0" aria-hidden />
          <span>AI đang kiểm tra giấy tờ...</span>
        </div>
      )}

      {error && (() => {
        const isServerUnavailable =
          error.includes('bảo trì') ||
          error.includes('nâng cấp') ||
          error.includes('503') ||
          error.includes('502') ||
          error.includes('chưa sẵn sàng');

        return (
          <div
            className={`space-y-1.5 rounded-lg border p-2.5 text-xs ${
              isServerUnavailable
                ? 'border-amber-200 bg-amber-50/80 text-amber-900'
                : 'border-red-200 bg-red-50/80 text-red-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold">
                <WarningCircle
                  size={15}
                  className={`shrink-0 ${isServerUnavailable ? 'text-amber-600' : 'text-red-600'}`}
                  aria-hidden
                />
                <span>
                  {isServerUnavailable ? 'Dịch vụ AI đang bảo trì' : 'Chưa kiểm tra được bằng AI'}
                </span>
              </div>
              <Button
                type="button"
                size="small"
                variant="ghost"
                className={`h-6 px-2 text-xs hover:bg-black/5 ${
                  isServerUnavailable ? 'text-amber-800' : 'text-red-700'
                }`}
                onClick={() => void handleVerify()}
              >
                Thử lại
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">{error}</p>
            {isServerUnavailable && (
              <p className="text-[10px] text-amber-700 italic border-t border-amber-200/60 pt-1">
                * Bạn có thể tự đối chiếu giấy tờ và tiếp tục xử lý hồ sơ bình thường.
              </p>
            )}
          </div>
        );
      })()}

      {result && (
        <div
          className={`overflow-hidden rounded-xl border text-xs transition-colors ${
            result.isValid
              ? 'border-emerald-200 bg-emerald-50/40'
              : 'border-amber-200 bg-amber-50/40'
          }`}
        >
          <div className="flex items-center justify-between gap-2 p-2.5 sm:px-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-lg ${
                  result.isValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {result.isValid ? (
                  <ShieldCheck size={16} weight="fill" aria-hidden />
                ) : (
                  <WarningCircle size={16} weight="fill" aria-hidden />
                )}
              </span>
              <span className="font-bold text-slate-800">
                {result.isValid ? 'AI đánh giá: Hợp lệ' : 'AI lưu ý: Cần kiểm tra lại'}
              </span>
              <Badge
                variant={result.isValid ? 'success' : 'warning'}
                className="text-[10px] px-1.5 py-0"
              >
                Độ tin cậy: {Math.round(result.confidence * 100)}%
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="small"
                variant="ghost"
                className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900"
                onClick={() => void handleVerify()}
                title="Quét kiểm tra lại"
              >
                <ArrowsClockwise size={13} aria-hidden />
              </Button>
              <Button
                type="button"
                size="small"
                variant="ghost"
                className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? 'Thu gọn kết quả tiền kiểm' : 'Mở rộng kết quả tiền kiểm'}
              >
                {expanded ? <CaretUp size={13} /> : <CaretDown size={13} />}
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="border-t border-slate-200/60 px-3 py-2 space-y-1.5 bg-white/70">
              <div className="flex flex-wrap items-baseline gap-1.5 text-[11px] text-slate-700">
                <span className="font-semibold text-slate-500">Loại giấy tờ nhận diện:</span>
                <span className="font-semibold text-slate-900">
                  {result.documentTypeDetected || 'Không xác định rõ'}
                </span>
              </div>

              {result.expectedType && (
                <div className="flex flex-wrap items-baseline gap-1.5 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-500">Đối chiếu với giấy tờ:</span>
                  <span className="text-slate-800">{result.expectedType}</span>
                </div>
              )}

              {result.qualityIssues && result.qualityIssues.length > 0 && (
                <div className="mt-1 space-y-1 rounded-lg border border-amber-200/80 bg-amber-50/80 p-2">
                  <span className="font-semibold text-amber-900 text-[11px] block">
                    Vấn đề chất lượng / sai khác:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                    {result.qualityIssues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-[10px] text-slate-400 italic mt-1">
                * Kết quả kiểm tra bằng AI chỉ mang tính gợi ý về chất lượng tệp. Thẩm định pháp lý
                cuối cùng do Cán bộ Một cửa quyết định.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
