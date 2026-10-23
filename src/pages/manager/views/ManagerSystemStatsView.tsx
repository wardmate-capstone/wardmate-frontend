import { ManagerAnalyticsView } from '@/components/analytics/ManagerAnalyticsView';
export function ManagerSystemStatsView({ section }: { section: 'stats-dossiers' | 'stats-procedures' }) {
  return <ManagerAnalyticsView key={section} section={section} />;
}
