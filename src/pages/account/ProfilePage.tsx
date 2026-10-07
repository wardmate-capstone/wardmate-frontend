import { FormEvent, useState, useEffect } from 'react';
import {
  CalendarBlank,
  CaretRight,
  Check,
  EnvelopeSimple,
  House,
  IdentificationCard,
  MapPin,
  NotePencil,
  Phone,
  User,
  X,
  Star,
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { toast } from '@/components/ui/Toast';
import { CitizenFeedbackModal } from '@/components/feedback/CitizenFeedbackModal';
import type { CitizenFeedback } from '@/types/feedback';

import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/authStore';
import { updateMyProfile, authErrorMessage } from '@/lib/api';

function formatDate(value: string) {
  if (!value) return '';
  if (!value.includes('-')) return value;
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function ProfilePage() {
  const { profile: apiProfile, refetch } = useUserProfile();
  const user = useAuthStore((s) => s.user);

  const currentProfile = {
    fullName: apiProfile?.fullName || user?.username || '',
    birthDate: apiProfile?.dateOfBirth || '',
    phone: apiProfile?.phoneNumber || '',
    email: user?.email || '',
    address: apiProfile?.permanentAddress || '',
  };

  const [profile, setProfile] = useState(currentProfile);
  const [draft, setDraft] = useState(currentProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [myApplications] = useState<Array<{
    code: string;
    procedure: string;
    statusLabel: string;
    badgeClass: string;
    updatedAt: string;
    nextStep: string;
    canFeedback: boolean;
  }>>([]);

  // Cập nhật khi apiProfile load xong
  useEffect(() => {
    if (apiProfile || user) {
      const updated = {
        fullName: apiProfile?.fullName || user?.username || '',
        birthDate: apiProfile?.dateOfBirth || '',
        phone: apiProfile?.phoneNumber || '',
        email: user?.email || '',
        address: apiProfile?.permanentAddress || '',
      };
      setProfile(updated);
      setDraft(updated);
    }
  }, [apiProfile, user]);

  // Feedback modal state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<{ procedure: string; code?: string }>({
    procedure: 'Chứng thực bản sao từ bản chính',
    code: '',
  });

  function handleOpenFeedback(procedure: string, code?: string) {
    setFeedbackTarget({ procedure, code });
    setIsFeedbackOpen(true);
  }

  function handleSubmitFeedback(data: CitizenFeedback) {
    toast.success(`Cảm ơn bạn đã đánh giá ${data.rating} sao!`);
  }

  function startEditing() {
    setDraft(profile);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setIsEditing(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await updateMyProfile({
        fullName: draft.fullName.trim(),
        phoneNumber: draft.phone.trim() || null,
        dateOfBirth: (draft.birthDate.trim() || null) as unknown as import('@/types/profile').ProfileInput['dateOfBirth'],
        permanentAddress: draft.address.trim() || null,
      });
      setProfile(draft);
      setIsEditing(false);
      await refetch();
      toast.success('Đã lưu thay đổi thông tin cá nhân.');
    } catch (err) {
      toast.error(authErrorMessage(err));
    }
  }

  return (
    <div className="account-page">
      <div className="account-shell">
        <nav className="account-breadcrumb" aria-label="Đường dẫn">
          <Link to="/"><House size={16} aria-hidden="true" /> Trang chủ</Link>
          <CaretRight size={14} aria-hidden="true" />
          <span aria-current="page">Tài khoản</span>
        </nav>

        <header className="account-page-heading">
          <div><h1>Thông tin tài khoản</h1><p>Quản lý thông tin cá nhân dùng trong quá trình chuẩn bị hồ sơ.</p></div>
          {!isEditing && <button type="button" onClick={startEditing} className="account-edit-action"><NotePencil size={18} aria-hidden="true" /> Chỉnh sửa</button>}
        </header>

        <div className="account-grid">
          <aside className="account-identity" aria-label="Tóm tắt tài khoản">
            <div className="account-avatar" aria-hidden="true">MA</div>
            <h2>{profile.fullName}</h2>
            <p>{profile.email}</p>
            <span className="account-active-status"><Check size={14} weight="bold" aria-hidden="true" /> Đang hoạt động</span>
            <div className="account-identity-divider" />
            <div className="account-id-row">
              <IdentificationCard size={20} aria-hidden="true" />
              <div><small>Số định danh</small><strong>•••• •••• 0128</strong></div>
            </div>
          </aside>

          <section className="account-panel" aria-labelledby="account-details-title">
            <div className="account-panel-heading">
              <div><h2 id="account-details-title">Thông tin cá nhân</h2><p>Kiểm tra thông tin trước khi sử dụng cho hồ sơ.</p></div>
              {isEditing && <span className="account-editing-status"><NotePencil size={15} aria-hidden="true" /> Đang chỉnh sửa</span>}
            </div>

            {isEditing ? (
              <form className="account-form" onSubmit={handleSave}>
                <div className="account-form-section">
                  <h3>Thông tin cơ bản</h3>
                  <div className="account-form-grid">
                    <div className="account-field account-field-wide"><label htmlFor="profile-full-name">Họ và tên</label><input id="profile-full-name" value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} autoComplete="name" required /></div>
                    <div className="account-field"><label htmlFor="profile-birth-date">Ngày sinh</label><input id="profile-birth-date" type="date" value={draft.birthDate} onChange={(event) => setDraft({ ...draft, birthDate: event.target.value })} required /></div>
                    <div className="account-field"><label htmlFor="profile-phone">Số điện thoại</label><input id="profile-phone" type="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} autoComplete="tel" required /></div>
                    <div className="account-field account-field-wide"><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} autoComplete="email" required /></div>
                    <div className="account-field account-field-wide"><label htmlFor="profile-address">Địa chỉ liên hệ</label><textarea id="profile-address" rows={3} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} autoComplete="street-address" required /></div>
                  </div>
                </div>
                <div className="account-form-actions">
                  <button type="button" onClick={cancelEditing} className="account-cancel-action"><X size={18} aria-hidden="true" /> Hủy</button>
                  <button type="submit" className="account-save-action"><Check size={18} aria-hidden="true" /> Lưu thông tin</button>
                </div>
              </form>
            ) : (
              <dl className="account-details">
                <div className="account-detail-row"><span className="account-detail-icon"><User size={20} aria-hidden="true" /></span><div><dt>Họ và tên</dt><dd>{profile.fullName}</dd></div></div>
                <div className="account-detail-row"><span className="account-detail-icon"><CalendarBlank size={20} aria-hidden="true" /></span><div><dt>Ngày sinh</dt><dd>{formatDate(profile.birthDate)}</dd></div></div>
                <div className="account-detail-row"><span className="account-detail-icon"><Phone size={20} aria-hidden="true" /></span><div><dt>Số điện thoại</dt><dd>{profile.phone}</dd></div></div>
                <div className="account-detail-row"><span className="account-detail-icon"><EnvelopeSimple size={20} aria-hidden="true" /></span><div><dt>Email</dt><dd>{profile.email}</dd></div></div>
                <div className="account-detail-row account-detail-wide"><span className="account-detail-icon"><MapPin size={20} aria-hidden="true" /></span><div><dt>Địa chỉ liên hệ</dt><dd>{profile.address}</dd></div></div>
              </dl>
            )}
          </section>
        </div>

        {/* Section: Hồ sơ của tôi & Đánh giá dịch vụ */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs" aria-labelledby="my-applications-title">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 id="my-applications-title" className="text-lg font-bold text-slate-900">
                Hồ sơ tiền kiểm gần đây
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi tiến độ tiền kiểm và đánh giá mức độ hài lòng về chất lượng phục vụ
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenFeedback('Chứng thực bản sao từ bản chính', 'HS-2026-00094')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
            >
              <Star size={16} weight="fill" className="text-amber-500" aria-hidden="true" />
              <span>Đánh giá dịch vụ</span>
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {myApplications.map((app) => (
              <div key={app.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{app.procedure}</span>
                    <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600">
                      {app.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Cập nhật: {app.updatedAt} · {app.nextStep}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${app.badgeClass}`}>
                    {app.statusLabel}
                  </span>
                  {app.canFeedback && (
                    <button
                      type="button"
                      onClick={() => handleOpenFeedback(app.procedure, app.code)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-900 transition-colors"
                      title="Gửi đánh giá mức độ hài lòng"
                    >
                      <Star size={14} weight="fill" className="text-amber-500" aria-hidden="true" />
                      <span>Đánh giá</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Citizen Feedback Modal */}
        <CitizenFeedbackModal
          open={isFeedbackOpen}
          onOpenChange={setIsFeedbackOpen}
          procedureName={feedbackTarget.procedure}
          applicationCode={feedbackTarget.code}
          onSubmitFeedback={handleSubmitFeedback}
        />
      </div>
    </div>
  );
}
