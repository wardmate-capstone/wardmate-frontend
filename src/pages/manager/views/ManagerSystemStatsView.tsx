import { ManagerAnalyticsView } from '@/components/analytics/ManagerAnalyticsView';
export function ManagerSystemStatsView({ section }: { section: 'stats-dossiers' | 'stats-procedures' | 'stats-searches' | 'stats-forms' }) {
  return <ManagerAnalyticsView key={section} section={section} />;
}
