import { ManagerAnalyticsView } from '@/components/analytics/ManagerAnalyticsView';
export function ManagerPerformanceView({ section }: { section: 'perf-officers' }) {
  return <ManagerAnalyticsView key={section} section={section} />;
}
