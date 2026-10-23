import { ManagerAnalyticsView } from '@/components/analytics/ManagerAnalyticsView';
export function ManagerPerformanceView({ section }: { section: 'perf-processing-time' | 'perf-completion-rate' | 'perf-supplement-rate' | 'perf-officers' }) {
  return <ManagerAnalyticsView key={section} section={section} />;
}
