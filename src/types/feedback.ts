export interface CitizenFeedback {
  id: string;
  procedureName?: string;
  applicationCode?: string;
  rating: number; // 1 to 5
  aspects: string[]; // Selected quality criteria
  comment: string;
  createdAt: string;
}

export const FEEDBACK_RATING_LABELS: Record<number, string> = {
  1: 'Rất không hài lòng',
  2: 'Chưa hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

export const DEFAULT_FEEDBACK_ASPECTS: string[] = [
  'Thủ tục rõ ràng, minh bạch',
  'Thời gian tiền kiểm nhanh chóng',
  'Hướng dẫn bổ sung dễ hiểu',
  'Giao diện trực quan, dễ dùng',
  'Cán bộ hướng dẫn tận tình',
  'Tiết kiệm thời gian đi lại',
];
