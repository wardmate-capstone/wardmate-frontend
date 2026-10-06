import { Button } from "./Button";

export function ProcedureFeedback({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: string;
  retry?: () => void;
}) {
  if (loading)
    return (
      <p role="status" className="rounded-xl bg-slate-50 p-5">
        Đang tải dữ liệu thủ tục…
      </p>
    );
  if (!error) return null;
  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900"
    >
      <p className="whitespace-pre-wrap">{error}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
