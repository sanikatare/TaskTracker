export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const AI_BASE_URL  = import.meta.env.VITE_AI_BASE_URL  || 'http://localhost:8000';

export const ENDPOINTS = {
  AUTH_LOGIN:     '/auth/login',
  AUTH_REGISTER:  '/auth/register',
  AUTH_ME:        '/auth/me',
  AUTH_LOGOUT:    '/auth/logout',
  TASKS:          '/tasks',
  TASK_BY_ID:     (id: string) => `/tasks/${id}`,
  TASK_COMPLETE:  (id: string) => `/tasks/${id}/complete`,
  TASK_SKIP:      (id: string) => `/tasks/${id}/skip`,
  SCHEDULE:         '/schedule',
  SCHEDULE_GENERATE:'/schedule/generate',
  SCHEDULE_SYNC:    '/schedule/sync-calendar',
  ANALYTICS:        '/analytics',
  ANALYTICS_WEEKLY: '/analytics/weekly',
  AI_PREDICT:       '/predict-time',
  AI_RECOMMEND:     '/recommend',
  AI_SCHEDULE:      '/optimize-schedule',
  AI_PLAN:          '/generate-plan',
  CALENDAR_AUTH:    '/calendar/auth',
  CALENDAR_SYNC:    '/calendar/sync',
} as const;

export const PRIORITY_CONFIG = {
  high: {
    label: 'High',
    color: '#6B21A8',
    bg: 'badge-high',
    weight: 3,
    dotClass: 'bg-purple-700',
    badgeClass: 'bg-purple-900 text-white border-purple-950 font-semibold',
    activeBadgeClass: 'bg-black text-white border-black font-semibold',
    accentBorderClass: 'border-l-purple-700',
  },
  medium: {
    label: 'Medium',
    color: '#9333EA',
    bg: 'badge-medium',
    weight: 2,
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-medium',
    activeBadgeClass: 'bg-purple-800 text-white border-purple-800 font-medium',
    accentBorderClass: 'border-l-purple-500',
  },
  low: {
    label: 'Low',
    color: '#000000',
    bg: 'badge-low',
    weight: 1,
    dotClass: 'bg-black',
    badgeClass: 'bg-slate-100 text-black border-slate-300 font-normal',
    activeBadgeClass: 'bg-black text-white border-black font-normal',
    accentBorderClass: 'border-l-black',
  },
} as const;

export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#6B21A8' },
  in_progress: { label: 'In Progress', color: '#9333EA' },
  completed:   { label: 'Completed',   color: '#000000' },
  skipped:     { label: 'Skipped',     color: '#64748B' },
} as const;

export const CATEGORY_CONFIG = {
  study: {
    label: 'Study',
    icon: 'book-open',
    color: '#7E22CE',
    dotClass: 'bg-purple-600',
    textClass: 'text-purple-900',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    activeClass: 'bg-purple-800 text-white border-purple-800',
  },
  work: {
    label: 'Work',
    icon: 'briefcase',
    color: '#581C87',
    dotClass: 'bg-purple-800',
    textClass: 'text-purple-950',
    bgClass: 'bg-purple-100/70',
    borderClass: 'border-purple-300',
    activeClass: 'bg-black text-white border-black',
  },
  personal: {
    label: 'Personal',
    icon: 'user',
    color: '#9333EA',
    dotClass: 'bg-purple-500',
    textClass: 'text-purple-800',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    activeClass: 'bg-purple-700 text-white border-purple-700',
  },
  programming: {
    label: 'Programming',
    icon: 'code-2',
    color: '#3B0764',
    dotClass: 'bg-black',
    textClass: 'text-black',
    bgClass: 'bg-purple-100/60',
    borderClass: 'border-purple-300',
    activeClass: 'bg-black text-white border-black',
  },
  math: {
    label: 'Mathematics',
    icon: 'calculator',
    color: '#6B21A8',
    dotClass: 'bg-purple-700',
    textClass: 'text-purple-900',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    activeClass: 'bg-purple-900 text-white border-purple-900',
  },
  science: {
    label: 'Science',
    icon: 'flask',
    color: '#7E22CE',
    dotClass: 'bg-purple-600',
    textClass: 'text-purple-900',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    activeClass: 'bg-purple-800 text-white border-purple-800',
  },
  lab: {
    label: 'Lab Work',
    icon: 'microscope',
    color: '#6B21A8',
    dotClass: 'bg-purple-700',
    textClass: 'text-purple-900',
    bgClass: 'bg-purple-100/50',
    borderClass: 'border-purple-300',
    activeClass: 'bg-purple-900 text-white border-purple-900',
  },
  theory: {
    label: 'Theory',
    icon: 'book-open',
    color: '#9333EA',
    dotClass: 'bg-purple-600',
    textClass: 'text-purple-800',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    activeClass: 'bg-purple-700 text-white border-purple-700',
  },
  project: {
    label: 'Project',
    icon: 'folder-kanban',
    color: '#000000',
    dotClass: 'bg-black',
    textClass: 'text-black',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-300',
    activeClass: 'bg-black text-white border-black',
  },
  other: {
    label: 'Other',
    icon: 'more-horizontal',
    color: '#4B5563',
    dotClass: 'bg-slate-700',
    textClass: 'text-slate-800',
    bgClass: 'bg-slate-100',
    borderClass: 'border-slate-300',
    activeClass: 'bg-black text-white border-black',
  },
} as const;

export const CHART_COLORS = {
  primary: '#7E22CE',
  light:   '#C084FC',
  navy:    '#3B0764',
  silver:  '#E9D5FF',
  success: '#9333EA',
  warning: '#6B21A8',
  danger:  '#000000',
};

export const CHART_GRADIENT_BLUE  = ['rgba(126,34,206,0.8)', 'rgba(126,34,206,0.1)'];
export const CHART_GRADIENT_GOLD  = ['rgba(147,51,234,0.8)', 'rgba(147,51,234,0.1)'];

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Very Hard',
};
