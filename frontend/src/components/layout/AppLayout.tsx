import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  BarChart3,
  SlidersHorizontal,
  Menu,
  X,
  Search,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/utils/apiClient';
import { useTasks } from '@/hooks/useTasks';
import Modal from '@/components/ui/Modal';
import CategoryLabel, { CategoryPicker } from '@/components/ui/CategoryLabel';
import type { SubjectCategory, UserProfile } from '@/types';
import { CATEGORY_CONFIG } from '@/config/constants';
import { deadlineLabel, hoursToReadable } from '@/utils/dateUtils';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/tasks',     label: 'Tasks',          icon: CheckSquare },
  { to: '/schedule',  label: 'Calendar & Sync', icon: Calendar },
  { to: '/plan',      label: 'Study Plans',    icon: BookOpen },
  { to: '/analytics', label: 'Analytics',      icon: BarChart3 },
] as const;

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/schedule': 'Schedule & Google Calendar',
  '/plan': 'Study Plans & Roadmaps',
  '/analytics': 'Study Analytics',
};

const TIME_SLOTS: Array<{ id: 'morning' | 'afternoon' | 'evening' | 'night'; label: string; window: string }> = [
  { id: 'morning', label: 'Morning', window: '08:00 – 12:00' },
  { id: 'afternoon', label: 'Afternoon', window: '13:30 – 17:30' },
  { id: 'evening', label: 'Evening', window: '18:30 – 21:30' },
  { id: 'night', label: 'Night', window: '21:30 – 23:30' },
];

export default function AppLayout() {
  const { tasks, createTask } = useTasks();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<SubjectCategory>('study');
  const [quickDeadline, setQuickDeadline] = useState(defaultTomorrow);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  const qc = useQueryClient();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: async () => (await apiClient.get('/auth/me')).data.data,
  });

  const [studyHoursPerDay, setStudyHoursPerDay] = useState<number>(6);
  const [preferredTimes, setPreferredTimes] = useState<Array<'morning' | 'afternoon' | 'evening' | 'night'>>(['morning', 'evening']);
  const [currentSemester, setCurrentSemester] = useState<number>(6);

  useEffect(() => {
    if (profile) {
      setStudyHoursPerDay(profile.studyHoursPerDay ?? 6);
      setPreferredTimes(
        profile.preferredStudyTimes?.length
          ? profile.preferredStudyTimes
          : ['morning', 'evening']
      );
      setCurrentSemester(profile.currentSemester ?? 6);
    }
  }, [profile]);

  const savePrefsMutation = useMutation({
    mutationFn: async () =>
      (
        await apiClient.patch('/auth/me', {
          studyHoursPerDay,
          preferredStudyTimes: preferredTimes,
          currentSemester,
        })
      ).data.data,
    onSuccess: (updated) => {
      qc.setQueryData(['user-profile'], updated);
      toast.success('Study preferences saved');
      setPrefsOpen(false);
    },
    onError: () => toast.error('Could not save preferences'),
  });

  function togglePreferredTime(slot: 'morning' | 'afternoon' | 'evening' | 'night') {
    setPreferredTimes((prev) => {
      if (prev.includes(slot)) {
        return prev.length > 1 ? prev.filter((s) => s !== slot) : prev;
      }
      return [...prev, slot];
    });
  }

  async function handleQuickAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim() || !quickDeadline) return;
    setQuickSubmitting(true);
    try {
      await createTask({
        title: quickTitle.trim(),
        deadline: quickDeadline,
        subject: CATEGORY_CONFIG[quickCategory]?.label ?? 'General',
        category: quickCategory,
        estimatedHours: 1,
        priority: 'medium',
        difficulty: 3,
        tags: [],
      });
      setQuickTitle('');
      setQuickCategory('study');
      setQuickDeadline(defaultTomorrow());
      setQuickAddOpen(false);
    } finally {
      setQuickSubmitting(false);
    }
  }

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'TaskTrack AI';

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  const filteredSearchTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayFormatted = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8FC] text-black">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Purple, White & Black Workspace Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-purple-100/90 transition-transform duration-150 ease-out lg:static lg:translate-x-0 relative',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Folio Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-purple-100 shrink-0">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-purple-400 font-bold text-sm shadow-xs border border-purple-900/50">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-black tracking-tight leading-none">
                TaskTrack <span className="text-purple-600">AI</span>
              </span>
              <span className="text-[11px] text-purple-900/70 mt-1 font-medium">
                Study &amp; Task Workspace
              </span>
            </div>
          </NavLink>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-purple-400 hover:bg-purple-50 hover:text-purple-900 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Task Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setQuickAddOpen(true);
            }}
            className="btn-primary w-full justify-center py-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive =
              location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            const badgeCount = to === '/tasks' ? pendingTasks.length : null;

            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-purple-100 text-purple-950 font-semibold border-r-2 border-purple-700'
                    : 'text-purple-950/70 hover:text-black hover:bg-purple-50'
                )}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={clsx(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-purple-700' : 'text-purple-400'
                    )}
                  />
                  <span className="truncate">{label}</span>
                </span>
                {badgeCount !== null && badgeCount > 0 && (
                  <span
                    className={clsx(
                      'text-xs tabular-nums px-2 py-0.5 rounded-md font-semibold font-mono',
                      isActive ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-900'
                    )}
                  >
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Preferences & Date Status */}
        <div className="px-4 py-3.5 border-t border-purple-100 bg-purple-50/40 text-xs text-purple-900/70 space-y-2">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setPrefsOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white hover:bg-purple-50 border border-purple-200 text-xs text-black transition-colors shadow-xs"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
              <span>Study Capacity</span>
            </span>
            <span className="tabular-nums text-[11px] text-purple-900 font-semibold font-mono">
              {profile?.studyHoursPerDay ?? studyHoursPerDay}h/day
            </span>
          </button>
          <div className="px-1 flex items-center justify-between text-[11px]">
            <span className="text-purple-950 truncate font-medium">{todayFormatted}</span>
            <span className="text-purple-700 font-mono tabular-nums shrink-0">
              {pendingTasks.length} open
            </span>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="flex items-center justify-between gap-4 px-6 sm:px-8 h-15 bg-white border-b border-purple-100/90 shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-purple-900 hover:bg-purple-50 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-black truncate">{pageTitle}</span>
            <span aria-hidden="true" className="hidden md:inline text-purple-300">·</span>
            <span className="hidden md:inline text-xs text-purple-900/70 font-medium truncate">
              {todayFormatted}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs text-purple-900 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="hidden sm:inline">Search entries...</span>
            </button>

            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FAF8FC]">
          <Outlet />
        </main>
      </div>

      {/* Quick Add Task Modal */}
      <Modal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="New Task"
      >
        <form onSubmit={handleQuickAddSubmit} className="space-y-4">
          <div>
            <label className="label">Task Title</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Finish Linear Algebra Problem Set 4"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Category</label>
            <CategoryPicker
              compact
              value={quickCategory}
              onChange={setQuickCategory}
            />
          </div>

          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input tabular-nums"
              value={quickDeadline}
              onChange={(e) => setQuickDeadline(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={() => setQuickAddOpen(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quickSubmitting || !quickTitle.trim() || !quickDeadline}
              className="btn-primary"
            >
              {quickSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Study Capacity & Schedule Preferences Modal */}
      <Modal
        isOpen={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        title="Study Capacity & Schedule Preferences"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Available Study Hours per Day</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={14}
                step={0.5}
                value={studyHoursPerDay}
                onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
                className="flex-1 accent-purple-700"
              />
              <span className="w-16 text-right text-sm tabular-nums text-black font-mono px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 font-semibold">
                {studyHoursPerDay}h / day
              </span>
            </div>
            <p className="text-[11px] text-purple-900/70 mt-1">
              Used by the Earliest-Deadline-First Schedule Optimizer to allocate daily study blocks.
            </p>
          </div>

          <div>
            <label className="label">Preferred Study Windows</label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => {
                const active = preferredTimes.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => togglePreferredTime(slot.id)}
                    className={clsx(
                      'p-2.5 rounded-xl border text-left transition-all',
                      active
                        ? 'bg-purple-900 border-purple-950 text-white font-semibold shadow-xs'
                        : 'bg-white border-purple-200 text-purple-950 hover:bg-purple-50'
                    )}
                  >
                    <div className="text-xs font-semibold">{slot.label}</div>
                    <div
                      className={clsx(
                        'text-[11px] tabular-nums mt-0.5 font-mono',
                        active ? 'text-purple-200' : 'text-purple-400'
                      )}
                    >
                      {slot.window}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Current Semester</label>
            <input
              type="number"
              min={1}
              max={12}
              value={currentSemester}
              onChange={(e) => setCurrentSemester(Number(e.target.value))}
              className="input tabular-nums font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
            <button
              type="button"
              onClick={() => setPrefsOpen(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => savePrefsMutation.mutate()}
              disabled={savePrefsMutation.isPending}
              className="btn-primary"
            >
              {savePrefsMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-white border border-purple-200 shadow-2xl overflow-hidden z-10 animate-scale-in">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-100">
              <Search className="w-4 h-4 text-purple-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, subject, or category..."
                className="w-full text-sm text-black placeholder-purple-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-purple-400 hover:text-black hover:bg-purple-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredSearchTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-purple-900/60 font-medium">
                  No matching entries found.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredSearchTasks.slice(0, 6).map((task) => (
                    <button
                      key={task._id}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/tasks?edit=${task._id}`);
                      }}
                      className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-purple-50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-black font-semibold truncate">
                            {task.title}
                          </span>
                          <CategoryLabel category={task.category} />
                        </div>
                        <div className="text-[11px] text-purple-900/70 mt-0.5 font-medium">
                          {task.subject} · {deadlineLabel(task.deadline)} · {hoursToReadable(task.estimatedHours)}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
