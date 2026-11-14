import { useEffect, useState } from 'react';
import { loadAvatarObjectUrl } from '@/lib/api/avatar';
import { cn } from '@/lib/utils';

export type UserAvatarProps = {
  /** Đường dẫn ảnh (avatarUrl từ IAM); null/undefined thì hiện chữ cái đầu */
  url?: string | null;
  /** Chữ cái đầu hiển thị khi chưa có ảnh hoặc ảnh chưa tải xong */
  initials: string;
  /** Kích thước, màu nền, bo góc… của khung (giữ đúng kiểu từng nơi đang dùng) */
  className?: string;
  /** Mô tả ảnh cho trình đọc màn hình; bỏ trống khi tên đã hiện ngay bên cạnh */
  alt?: string;
};

/**
 * Ảnh đại diện có token (PROFILE-AVATAR-01): tải ảnh qua API rồi hiển thị; trong lúc tải,
 * khi chưa có ảnh hoặc không được xem (404) thì hiện chữ cái đầu như trước.
 */
export function UserAvatar({ url, initials, className, alt = '' }: UserAvatarProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setSrc(null);
    if (!url) return;
    loadAvatarObjectUrl(url)
      .then((objectUrl) => { if (active) setSrc(objectUrl); })
      .catch(() => { if (active) setSrc(null); });
    return () => { active = false; };
  }, [url]);

  return (
    <span className={cn('relative grid shrink-0 place-items-center overflow-hidden', className)}>
      {src ? <img src={src} alt={alt} className="size-full object-cover" draggable={false} onError={() => setSrc(null)} /> : <span aria-hidden={alt ? undefined : true}>{initials}</span>}
    </span>
  );
}
