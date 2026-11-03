import { useCallback, useEffect, useState } from 'react';
import {
  ArrowsClockwise,
  Check,
  Copy,
  Eye,
  WarningCircle,
  Broadcast,
  EnvelopeSimple,
  ShieldCheck,
  Funnel,
} from '@phosphor-icons/react';
import { Button, Badge, Modal, TableSkeletonRows } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { copyToClipboard } from '@/lib/clipboard';
import {
  notificationAdminApi,
  notificationAdminError,
  type DeliveryAdminDto,
  type DeliveryAuditDto,
  type DeliveryPage,
} from '@/lib/api/notificationAdmin';

const STATE_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  Sent: 'success',
  Pending: 'warning',
  Dispatching: 'warning',
  Failed: 'danger',
  Dead: 'danger',
  Suppressed: 'neutral',
  Unknown: 'neutral',
};

const STATE_LABELS: Record<string, string> = {
  Sent: 'Đã gửi thành công',
  Pending: 'Đang chờ phát',
  Dispatching: 'Đang điều phối gửi',
  Failed: 'Gửi thất bại',
  Dead: 'Ngừng thử (Dead)',
  Suppressed: 'Đã hủy bỏ',
  Unknown: 'Không xác định',
};

const CHANNEL_LABELS: Record<string, string> = {
  IN_APP: 'Thông báo ứng dụng',
  EMAIL: 'Thư điện tử (Email)',
  SMS: 'Tin nhắn SMS (Đã gỡ)',
};

export function NotificationDeliveriesView() {
  const [data, setData] = useState<DeliveryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filterState, setFilterState] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Detail & Audit Modal
  const [selectedItem, setSelectedItem] = useState<DeliveryAdminDto | null>(null);
  const [auditList, setAuditList] = useState<DeliveryAuditDto[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Replay Modal
  const [replayItem, setReplayItem] = useState<DeliveryAdminDto | null>(null);
  const [replayReason, setReplayReason] = useState('');
  const [ackDuplicate, setAckDuplicate] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationAdminApi.list({
        page,
        pageSize: 15,
        state: filterState || undefined,
        channel: filterChannel || undefined,
      });
      setData(res);
    } catch (err) {
      setError(notificationAdminError(err));
    } finally {
      setLoading(false);
    }
  }, [page, filterState, filterChannel]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCopy = async (id: string, text: string) => {
    if (await copyToClipboard(text, 'Đã sao chép ID.')) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenDetail = async (item: DeliveryAdminDto) => {
    setSelectedItem(item);
    setLoadingAudit(true);
    try {
      const audits = await notificationAdminApi.audit(item.id, 1, 20);
      setAuditList(audits);
    } catch {
      toast.error('Không thể tải lịch sử kiểm toán của lượt phát này.');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleConfirmReplay = async () => {
    if (!replayItem) return;
    if (!replayReason.trim()) {
      toast.error('Vui lòng nhập lý do phát lại thông báo.');
      return;
    }
    if (!ackDuplicate) {
      toast.error('Vui lòng xác nhận rủi ro trùng lặp thông báo.');
      return;
    }

    setReplayLoading(true);
    try {
      await notificationAdminApi.replay(replayItem.id, {
        expectedRevision: replayItem.revision,
        reason: replayReason.trim(),
        acknowledgeDuplicateRisk: true,
      });
      toast.success('Đã gửi yêu cầu phát lại thông báo.');
      setReplayItem(null);
      setReplayReason('');
      setAckDuplicate(false);
      void loadData();
    } catch (err) {
      toast.error(notificationAdminError(err));
    } finally {
      setReplayLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Funnel size={16} className="text-slate-500" />
            <span>Bộ lọc:</span>
          </div>

          <select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setPage(1);
            }}
            className="min-h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:outline-red-700"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Sent">Đã gửi (Sent)</option>
            <option value="Pending">Đang chờ (Pending)</option>
            <option value="Dispatching">Đang điều phối (Dispatching)</option>
            <option value="Failed">Thất bại (Failed)</option>
            <option value="Dead">Ngừng thử (Dead)</option>
            <option value="Suppressed">Đã hủy (Suppressed)</option>
            <option value="Unknown">Không xác định (Unknown)</option>
          </select>

          <select
            value={filterChannel}
            onChange={(e) => {
              setFilterChannel(e.target.value);
              setPage(1);
            }}
            className="min-h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:outline-red-700"
          >
            <option value="">Tất cả kênh</option>
            <option value="IN_APP">Ứng dụng (IN_APP)</option>
            <option value="EMAIL">Email (EMAIL)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {data && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              Tổng số: <strong className="text-slate-800">{data.total}</strong> lượt phát
            </span>
          )}
          <Button
            size="small"
            variant="outline"
            disabled={loading}
            onClick={() => void loadData()}
            className="gap-1.5 text-xs"
          >
            <ArrowsClockwise size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <span>{error}</span>
          <Button size="small" variant="outline" onClick={() => void loadData()}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3 min-w-[140px]">Mã thông báo</th>
                <th className="px-4 py-3 min-w-[120px]">Kênh gửi</th>
                <th className="px-4 py-3 min-w-[120px]">Trạng thái</th>
                <th className="px-4 py-3 text-center min-w-[90px]">Số lần thử</th>
                <th className="px-4 py-3 min-w-[150px]">Thời gian cập nhật</th>
                <th className="px-4 py-3 min-w-[200px]">Nội dung / Trạng thái chi tiết</th>
                <th className="px-4 py-3 text-right min-w-[100px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <TableSkeletonRows
                  columns={7}
                  rows={6}
                  cellClassName="px-4 py-3.5"
                  columnWidths={['w-32 font-mono', 'w-24', 'w-28', 'w-16 mx-auto', 'w-36', 'w-60', 'ml-auto w-20']}
                  lastCellClassName="text-right"
                />
              )}

              {!loading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 px-6 text-center">
                    <div className="mx-auto max-w-md space-y-3">
                      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <Broadcast size={24} weight="duotone" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-800">
                          {filterState || filterChannel
                            ? 'Không có bản ghi phù hợp với bộ lọc'
                            : 'Chưa có thông báo nào trong hệ thống'}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {filterState || filterChannel
                            ? 'Thử xóa hoặc chọn lại bộ lọc trạng thái và kênh gửi để xem các lượt gửi khác.'
                            : 'Hiện chưa có thông báo nào được gửi đi. Khi công dân nộp hồ sơ hoặc cán bộ xử lý giấy tờ, nhật ký gửi thông báo (qua Ứng dụng & Email) sẽ tự động xuất hiện tại đây.'}
                        </p>
                      </div>
                      {filterState || filterChannel ? (
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => {
                            setFilterState('');
                            setFilterChannel('');
                            setPage(1);
                          }}
                          className="text-xs"
                        >
                          Xóa bộ lọc
                        </Button>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                            <ShieldCheck size={14} weight="fill" className="text-emerald-600" />
                            <span>Dịch vụ thông báo hoạt động bình thường</span>
                          </span>
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => void loadData()}
                            className="gap-1 text-xs"
                          >
                            <ArrowsClockwise size={13} className={loading ? 'animate-spin' : ''} />
                            <span>Kiểm tra lại dữ liệu</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                data?.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span title={row.id}>{row.id.slice(0, 8)}...</span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(row.id, row.id)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Sao chép toàn bộ ID"
                        >
                          {copiedId === row.id ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {row.channel === 'EMAIL' ? (
                          <EnvelopeSimple size={15} className="text-blue-600" />
                        ) : (
                          <Broadcast size={15} className="text-purple-600" />
                        )}
                        <span className="font-semibold text-slate-800">
                          {CHANNEL_LABELS[row.channel] || row.channel}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={STATE_VARIANTS[row.state] || 'neutral'} className="text-[10px]">
                        {STATE_LABELS[row.state] || row.state}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {row.attempts}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {new Date(row.updatedAt).toLocaleString('vi-VN')}
                    </td>

                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                      {row.errorCode ? (
                        <span className="text-red-700 font-mono text-[11px]">{row.errorCode}</span>
                      ) : row.sentAt ? (
                        <span className="text-emerald-700">Đã gửi: {new Date(row.sentAt).toLocaleTimeString('vi-VN')}</span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="small"
                          variant="ghost"
                          onClick={() => void handleOpenDetail(row)}
                          className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-100"
                          title="Xem chi tiết và lịch sử kiểm toán"
                        >
                          <Eye size={14} className="mr-1" />
                          <span>Chi tiết</span>
                        </Button>

                        {row.state !== 'Suppressed' && row.channel !== 'SMS' && (
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => {
                              setReplayItem(row);
                              setReplayReason('');
                              setAckDuplicate(false);
                            }}
                            className="h-7 px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                            title="Thử gửi lại thông báo này"
                            aria-label="Replay"
                          >
                            <span>Gửi lại</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <span>
              Tổng cộng: <strong>{data.total}</strong> lượt phát (Trang {data.page} /{' '}
              {Math.max(1, Math.ceil(data.total / data.pageSize))})
            </span>
            <div className="flex gap-1.5">
              <Button
                size="small"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                size="small"
                variant="outline"
                disabled={page * data.pageSize >= data.total || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail & Audit */}
      <Modal
        open={Boolean(selectedItem)}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        title="Chi tiết lượt phát thông báo"
      >
        {selectedItem && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-slate-800">
              <div>
                <span className="font-semibold text-slate-500 block">Mã Delivery:</span>
                <span className="font-mono text-[11px] break-all">{selectedItem.id}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Kênh phát:</span>
                <span className="font-semibold">{selectedItem.channel}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Trạng thái:</span>
                <Badge variant={STATE_VARIANTS[selectedItem.state] || 'neutral'}>
                  {STATE_LABELS[selectedItem.state] || selectedItem.state}
                </Badge>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Số lần đã thử:</span>
                <span className="font-bold">{selectedItem.attempts}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Mã nhà cung cấp:</span>
                <span>{selectedItem.provider || 'Mặc định hệ thống'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Revision:</span>
                <span className="font-mono text-[10px] break-all">{selectedItem.revision}</span>
              </div>
            </div>

            {/* Audit log section */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-slate-600" />
                <span>Lịch sử kiểm toán (Audit History)</span>
              </h4>

              {loadingAudit ? (
                <div className="py-4 text-center text-slate-500">Đang tải lịch sử kiểm toán...</div>
              ) : auditList.length === 0 ? (
                <p className="text-slate-500 italic py-2">Chưa có bản ghi kiểm toán nào.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {auditList.map((aud) => (
                    <div key={aud.id} className="p-2.5 bg-white text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-800">{aud.action}</span>
                        <span>{new Date(aud.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="text-slate-600">
                        Chuyển trạng thái:{' '}
                        <span className="font-medium text-slate-700">{aud.beforeState}</span> →{' '}
                        <span className="font-bold text-red-800">{aud.afterState}</span>
                      </div>
                      {aud.reason && (
                        <p className="text-slate-700 italic bg-slate-50 p-1.5 rounded">
                          Lý do: {aud.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Replay */}
      <Modal
        open={Boolean(replayItem)}
        onOpenChange={(open) => !open && setReplayItem(null)}
        title="Thử gửi lại thông báo"
      >
        {replayItem && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <WarningCircle size={16} className="text-amber-700" />
                <span>Cảnh báo gửi lặp thông báo</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Hệ thống sẽ thực hiện gửi lại thông báo này. Nếu người nhận đã nhận được trước đó, thao tác này có thể gửi thêm một tin nhắn tương tự.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block">Lý do gửi lại:</label>
              <textarea
                rows={3}
                value={replayReason}
                onChange={(e) => setReplayReason(e.target.value)}
                placeholder="Nhập lý do gửi lại (ví dụ: người dân phản ánh chưa nhận được thư)..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-red-700"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={ackDuplicate}
                onChange={(e) => setAckDuplicate(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-red-700 focus:ring-red-600"
              />
              <span className="text-[11px] text-slate-700 leading-normal">
                Tôi xác nhận đã hiểu và đồng ý gửi lại thông báo cho người nhận.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                disabled={replayLoading}
                onClick={() => setReplayItem(null)}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                disabled={replayLoading || !replayReason.trim() || !ackDuplicate}
                onClick={() => void handleConfirmReplay()}
              >
                {replayLoading ? 'Đang gửi...' : 'Xác nhận gửi lại'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
