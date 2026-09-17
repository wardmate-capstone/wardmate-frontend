import { FormEvent, useState } from 'react';
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
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const initialProfile = {
  fullName: 'Nguyễn Minh Anh',
  birthDate: '1992-08-15',
  phone: '090 000 0128',
  email: 'minhanh@example.com',
  address: 'Phường Minh Khai, Thành phố Hà Nội',
};

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);

  function startEditing() {
    setDraft(profile);
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setIsEditing(false);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfile(draft);
    setIsEditing(false);
    toast.success('Đã lưu thay đổi thông tin cá nhân.');
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
      </div>
    </div>
  );
}
