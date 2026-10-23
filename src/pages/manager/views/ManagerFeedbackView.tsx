import { ManagerAnalyticsView } from '@/components/analytics/ManagerAnalyticsView';
export function ManagerFeedbackView({ section }: { section: 'feedback-reports' | 'satisfaction-level' }) {
  return <ManagerAnalyticsView key={section} section={section} />;
}
