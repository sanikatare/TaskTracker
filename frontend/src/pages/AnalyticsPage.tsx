import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import apiClient from '@/utils/apiClient';
import type { Analytics } from '@/types';
import { DAYS_OF_WEEK } from '@/config/constants';
import { hoursToReadable } from '@/utils/dateUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#64748B',
        font: { family: '"Times New Roman", Times, serif', size: 11, weight: '500' as const },
        padding: 14,
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      backgroundColor: '#0F172A',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#FFFFFF',
      bodyColor: '#E2E8F0',
      titleFont: { family: '"Times New Roman", Times, serif', weight: '600' as const, size: 12 },
      bodyFont: { family: '"Times New Roman", Times, serif', weight: 'normal' as const, size: 11 },
      padding: 10,
      boxPadding: 5,
      cornerRadius: 8,
      displayColors: true,
      usePointStyle: true,
    },
  },
  scales: {
    x: {
      ticks: { color: '#64748B', font: { family: '"Times New Roman", Times, serif', weight: 'normal' as const, size: 11 } },
      grid: { color: '#F1F5F9', drawBorder: false },
      border: { display: false },
    },
    y: {
      ticks: { color: '#64748B', font: { family: '"Times New Roman", Times, serif', weight: 'normal' as const, size: 11 } },
      grid: { color: '#F1F5F9', drawBorder: false },
      border: { display: false },
    },
  },
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['analytics'],
    queryFn: async () => (await apiClient.get('/analytics')).data.data,
  });

  if (isLoading) {
    return (
      <div className="page-shell space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      </div>
    );
  }

  const weekLabels = (analytics?.weeklyProgress ?? []).map(
    (w) => DAYS_OF_WEEK[new Date(w.date).getDay()]
  );

  const weeklyChartData = {
    labels: weekLabels,
    datasets: [
      {
        label: 'Completed Blocks',
        data: (analytics?.weeklyProgress ?? []).map((w) => w.completed),
        backgroundColor: '#7E22CE',
        borderRadius: 6,
      },
      {
        label: 'Planned Blocks',
        data: (analytics?.weeklyProgress ?? []).map((w) => w.planned),
        backgroundColor: '#000000',
        borderRadius: 6,
      },
    ],
  };

  const studyHoursData = {
    labels: weekLabels,
    datasets: [
      {
        label: 'Study Hours',
        data: (analytics?.weeklyProgress ?? []).map((w) => w.studyHours),
        fill: true,
        backgroundColor: 'rgba(126, 34, 206, 0.12)',
        borderColor: '#7E22CE',
        borderWidth: 2,
        tension: 0.35,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#7E22CE',
        pointBorderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 5,
      },
    ],
  };

  const subjectLabels = Object.keys(analytics?.tasksBySubject ?? {});
  const subjectColors = [
    '#581C87',
    '#7E22CE',
    '#9333EA',
    '#A855F7',
    '#C084FC',
    '#000000',
  ];
  const doughnutData = {
    labels: subjectLabels,
    datasets: [
      {
        data: Object.values(analytics?.tasksBySubject ?? {}),
        backgroundColor: subjectColors.slice(0, subjectLabels.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const completionRate = analytics?.completionRate ?? 0;

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          Quantitative breakdown of task completion, logged study hours, and subject allocation
        </p>
      </div>

      {/* Top KPI Strip (Tabular Numerals) */}
      <div className="card grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-purple-100">
        <div className="p-5">
          <div className="text-xs font-bold text-purple-900/70">Completion Rate</div>
          <div className="stat-number mt-2 text-black">{completionRate.toFixed(0)}%</div>
          <div className="text-xs text-purple-900/60 mt-1 font-mono tabular-nums font-medium">
            {analytics?.completedTasks ?? 0} of {analytics?.totalTasks ?? 0} tasks completed
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs font-bold text-purple-900/70">Total Study Hours</div>
          <div className="stat-number mt-2 text-black">
            {hoursToReadable(analytics?.totalStudyHours ?? 0)}
          </div>
          <div className="text-xs text-purple-900/60 mt-1 font-medium">Logged across study sessions</div>
        </div>

        <div className="p-5">
          <div className="text-xs font-bold text-purple-900/70">Avg. Focus Score</div>
          <div className="stat-number mt-2 text-black">
            {(analytics?.avgProductivityScore ?? 0).toFixed(1)}
            <span className="text-sm font-semibold text-purple-400">/10</span>
          </div>
          <div className="text-xs text-purple-900/60 mt-1 font-medium">Self-reported & inferred</div>
        </div>

        <div className="p-5">
          <div className="text-xs font-bold text-purple-900/70">Study Streak</div>
          <div className="stat-number mt-2 text-black">{analytics?.streakDays ?? 0}d</div>
          <div className="text-xs text-purple-900/60 mt-1 font-medium">Consecutive active days</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Completions */}
        <div className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-black">
              Weekly Block Execution
            </h2>
            <p className="text-xs text-purple-900/60 mt-0.5 font-medium">
              Completed vs. planned study blocks over the past 7 days
            </p>
          </div>
          <div className="h-60">
            <Bar
              data={weeklyChartData}
              options={{
                ...CHART_DEFAULTS,
                scales: {
                  ...CHART_DEFAULTS.scales,
                  y: {
                    ...CHART_DEFAULTS.scales.y,
                    beginAtZero: true,
                    ticks: { ...CHART_DEFAULTS.scales.y.ticks, stepSize: 1 },
                  },
                },
              } as never}
            />
          </div>
        </div>

        {/* Daily Study Hours */}
        <div className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-black">Daily Study Hours</h2>
            <p className="text-xs text-purple-900/60 mt-0.5 font-medium">
              Focused hours logged per day over the past week
            </p>
          </div>
          <div className="h-60">
            <Line
              data={studyHoursData}
              options={{
                ...CHART_DEFAULTS,
                plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
                scales: {
                  ...CHART_DEFAULTS.scales,
                  y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true },
                },
              } as never}
            />
          </div>
        </div>

        {/* Tasks by Subject */}
        <div className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-black">
              Workload by Subject
            </h2>
            <p className="text-xs text-purple-900/60 mt-0.5 font-medium">
              Task distribution across enrolled courses
            </p>
          </div>
          {subjectLabels.length > 0 ? (
            <div className="h-56 flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  ...CHART_DEFAULTS,
                  scales: undefined,
                  cutout: '66%',
                  plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: {
                      position: 'right' as const,
                      labels: {
                        ...CHART_DEFAULTS.plugins.legend.labels,
                        padding: 12,
                      },
                    },
                  },
                } as never}
              />
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-purple-900/60 font-medium">
              No subject data available yet.
            </div>
          )}
        </div>

        {/* Task Status Breakdown */}
        <div className="card p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-black">Status Distribution</h2>
            <p className="text-xs text-purple-900/60 mt-0.5 font-medium">
              Breakdown of tasks by current workflow stage
            </p>
          </div>
          <div className="space-y-4 mt-4">
            {[
              {
                label: 'Completed',
                value: analytics?.completedTasks ?? 0,
                color: '#000000',
              },
              {
                label: 'Pending & In Progress',
                value:
                  (analytics?.totalTasks ?? 0) -
                  (analytics?.completedTasks ?? 0) -
                  (analytics?.skippedTasks ?? 0),
                color: '#7E22CE',
              },
              {
                label: 'Skipped',
                value: analytics?.skippedTasks ?? 0,
                color: '#D8B4FE',
              },
            ].map((item) => {
              const total = Math.max(1, analytics?.totalTasks ?? 1);
              const pct = Math.max(0, (item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-bold text-black">{item.label}</span>
                    <span className="font-mono tabular-nums text-purple-950 font-semibold">
                      {item.value} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="progress-bar h-2 bg-purple-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
