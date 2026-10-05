import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  BookOpen,
  SkipForward,
  AlertTriangle,
  X,
  Archive,
  ArchiveRestore,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import Modal from '@/components/ui/Modal';
import TaskCheckButton from '@/components/ui/TaskCheckButton';
import CategoryLabel, { CategoryPicker } from '@/components/ui/CategoryLabel';
import type {
  Task,
  CreateTaskForm,
  UpdateTaskForm,
  Priority,
  SubjectCategory,
  TaskStatus,
} from '@/types';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  CATEGORY_CONFIG,
  DIFFICULTY_LABELS,
} from '@/config/constants';
import {
  deadlineLabel,
  deadlineUrgency,
  hoursToReadable,
  formatDate,
  timeAgo,
  hoursUntilArchive,
} from '@/utils/dateUtils';
import clsx from 'clsx';

type SortField = 'deadline' | 'priority' | 'estimatedHours' | 'difficulty';

const PRIORITY_ORDER: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

function TaskForm({
  initial,
  isEdit,
  onSubmit,
  onClose,
}: {
  initial?: Partial<Task>;
  isEdit?: boolean;
  onSubmit: (f: CreateTaskForm & { status?: TaskStatus }) => Promise<void>;
  onClose: () => void;
}) {
  const defaultDeadline = useMemo(() => {
    if (initial?.deadline) {
      return initial.deadline.split('T')[0];
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    return tomorrow.toISOString().split('T')[0];
  }, [initial?.deadline]);

  const [form, setForm] = useState<CreateTaskForm & { status: TaskStatus }>({
    title: initial?.title ?? '',
    subject: initial?.subject ?? '',
    category: initial?.category ?? 'study',
    description: initial?.description ?? '',
    deadline: defaultDeadline,
    estimatedHours: initial?.estimatedHours ?? 2,
    priority: initial?.priority ?? 'medium',
    difficulty: initial?.difficulty ?? 3,
    tags: initial?.tags ?? [],
    status: initial?.status ?? 'pending',
  });

  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(', '));
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim() || !form.deadline) return;
    setSubmitting(true);
    try {
      const parsedTags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onSubmit({ ...form, tags: parsedTags });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div>
        <label className="label">Task Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="e.g. Implement B+ Tree Range Scans"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="label">Subject / Course</label>
        <input
          className="input"
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
          placeholder="e.g. Database Systems, Internship Prep, Personal"
          required
        />
      </div>

      <div>
        <label className="label">Category Label</label>
        <CategoryPicker
          value={form.category}
          onChange={(c) => update('category', c)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Due Date</label>
          <input
            type="date"
            className="input font-mono tabular-nums"
            value={form.deadline}
            onChange={(e) => update('deadline', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Estimated Effort (hours)</label>
          <input
            type="number"
            className="input font-mono tabular-nums"
            value={form.estimatedHours}
            onChange={(e) => update('estimatedHours', Number(e.target.value))}
            min={0.5}
            max={100}
            step={0.5}
            required
          />
        </div>
      </div>

      {/* Priority Segmented Selector */}
      <div>
        <label className="label">Priority</label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-purple-100/60 border border-purple-200/80 rounded-xl">
          {(['low', 'medium', 'high'] as Priority[]).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            const isSelected = form.priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => update('priority', p)}
                className={clsx(
                  'py-1.5 px-3 rounded-lg text-xs font-medium transition-all inline-flex items-center justify-center gap-1.5 border',
                  isSelected
                    ? clsx(cfg.badgeClass, 'shadow-xs font-semibold')
                    : 'border-transparent text-purple-900/70 hover:text-black hover:bg-white/60'
                )}
              >
                <span
                  className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dotClass)}
                  aria-hidden="true"
                />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Difficulty (1–5)</label>
          <select
            className="input"
            value={form.difficulty}
            onChange={(e) =>
              update('difficulty', Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
            }
          >
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} — {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        {isEdit ? (
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => update('status', e.target.value as TaskStatus)}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              className="input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. lab-2, midterm, group"
            />
          </div>
        )}
      </div>

      {isEdit && (
        <div>
          <label className="label">Tags (comma-separated)</label>
          <input
            className="input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. lab-2, midterm, group"
          />
        </div>
      )}

      <div>
        <label className="label">Notes & Deliverables (optional)</label>
        <textarea
          className="input resize-none h-20"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Key requirements, chapters, or submission instructions..."
        />
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-purple-100">
        <button className="btn-ghost" onClick={onClose} type="button">
          Cancel
        </button>
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const terms = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (terms.length === 0) return <>{text}</>;

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-purple-100 text-purple-900 rounded px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function PriorityBadge({
  priority,
  active = false,
  onClick,
}: {
  priority: Priority;
  active?: boolean;
  onClick?: () => void;
}) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
  const level = cfg.weight; // 3 = High, 2 = Medium, 1 = Low

  const badgeContent = (
    <>
      <span
        className="inline-flex items-end gap-[2px] h-2.5 shrink-0"
        aria-hidden="true"
      >
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={clsx(
              'w-[2.5px] rounded-full transition-colors',
              bar === 1 ? 'h-1.5' : bar === 2 ? 'h-2' : 'h-2.5',
              bar <= level
                ? active
                  ? 'bg-white'
                  : cfg.dotClass
                : active
                ? 'bg-white/35'
                : 'bg-current/20'
            )}
          />
        ))}
      </span>
      <span>{cfg.label}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        title={`Filter by ${cfg.label} Priority`}
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] leading-4 border transition-all whitespace-nowrap shrink-0 cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30',
          active ? cfg.activeBadgeClass : cfg.badgeClass
        )}
      >
        {badgeContent}
      </button>
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] leading-4 border whitespace-nowrap shrink-0',
        cfg.badgeClass
      )}
    >
      {badgeContent}
    </span>
  );
}

function TaskRow({
  task,
  searchQuery = '',
  isArchiveView,
  activePriorityFilter = 'all',
  onToggleComplete,
  onStatusChange,
  onCategoryClick,
  onPriorityClick,
  onEdit,
  onSkip,
  onArchive,
  onRestore,
  onReopen,
  onDelete,
  onOpenPlan,
}: {
  task: Task;
  searchQuery?: string;
  isArchiveView?: boolean;
  activePriorityFilter?: Priority | 'all';
  onToggleComplete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onCategoryClick: (category: SubjectCategory) => void;
  onPriorityClick: (priority: Priority) => void;
  onEdit: () => void;
  onSkip: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onReopen: () => void;
  onDelete: () => void;
  onOpenPlan: () => void;
}) {
  const urgency = deadlineUrgency(task.deadline);
  const isCompleted = task.status === 'completed';
  const remainingArchiveHours = hoursUntilArchive(task);
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-purple-50/70 transition-colors group border-l-[3px]',
        isCompleted
          ? 'opacity-75 bg-purple-50/30 border-l-purple-300'
          : priorityCfg.accentBorderClass
      )}
    >
      {/* Left: Checkbox + Title + Badges + Metadata */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <TaskCheckButton
          checked={isCompleted}
          onToggle={isArchiveView ? onReopen : onToggleComplete}
          label={`Mark ${task.title} complete`}
          title={isArchiveView ? 'Reopen task as pending' : isCompleted ? 'Completed' : 'Mark complete'}
          className="mt-0.5"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onEdit}
              className={clsx(
                'text-sm font-semibold text-left hover:text-purple-700 transition-colors',
                isCompleted ? 'line-through text-purple-400' : 'text-black'
              )}
            >
              <HighlightMatch text={task.title} query={searchQuery} />
            </button>
            <PriorityBadge
              priority={task.priority}
              active={activePriorityFilter === task.priority}
              onClick={() => onPriorityClick(task.priority)}
            />
            <CategoryLabel
              category={task.category}
              onClick={() => onCategoryClick(task.category)}
            />
          </div>

          {task.description && (
            <p className="text-xs text-purple-900/60 mt-0.5 line-clamp-1 font-medium">
              <HighlightMatch text={task.description} query={searchQuery} />
            </p>
          )}

          {/* Unboxed Metadata Line */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-purple-900/60 mt-1.5 font-medium">
            <span className="font-semibold text-black">
              <HighlightMatch text={task.subject} query={searchQuery} />
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={clsx(
                'font-mono tabular-nums inline-flex items-center gap-1 font-semibold',
                !isCompleted && urgency === 'critical'
                  ? 'text-purple-950 font-bold'
                  : !isCompleted && urgency === 'warning'
                  ? 'text-purple-800 font-semibold'
                  : 'text-purple-900/60'
              )}
            >
              {!isCompleted && urgency === 'critical' && (
                <AlertTriangle className="w-3 h-3 text-purple-700 shrink-0" />
              )}
              {isCompleted
                ? `Completed ${
                    task.completedAt
                      ? timeAgo(task.completedAt)
                      : formatDate(task.deadline, 'MMM d')
                  }`
                : `${deadlineLabel(task.deadline)} (${formatDate(task.deadline, 'MMM d')})`}
            </span>

            {!isArchiveView && isCompleted && remainingArchiveHours !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className="inline-flex items-center gap-1 text-purple-400 font-mono tabular-nums"
                  title="Completed tasks automatically move to Archive after 24 hours"
                >
                  <Clock className="w-3 h-3" />
                  <span>Auto-archives in {remainingArchiveHours}h</span>
                </span>
              </>
            )}

            {isArchiveView && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-purple-400 font-mono tabular-nums">
                  Archived after 24h
                </span>
              </>
            )}

            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-black font-semibold">
              Est. {hoursToReadable(task.estimatedHours)}
            </span>
            {task.aiPredictedHours && task.aiPredictedHours !== task.estimatedHours && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-purple-700 font-semibold">
                  AI Pred. {hoursToReadable(task.aiPredictedHours)}
                </span>
              </>
            )}
            {task.tags?.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-purple-400">
                  {task.tags.slice(0, 3).join(' / ')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Interactive Status Control & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-8 sm:pl-0">
        {isArchiveView ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRestore}
              className="btn-secondary py-1 px-2.5 text-xs font-semibold"
              title="Restore task to active Completed list for 24h"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
              <span>Restore</span>
            </button>
            <button
              type="button"
              onClick={onReopen}
              className="btn-ghost py-1 px-2.5 text-xs font-semibold"
              title="Reopen task as Pending"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen</span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-purple-400 hover:text-black hover:bg-purple-100 transition-colors"
              title="Delete task permanently"
              aria-label="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
              aria-label="Task status"
              className={clsx(
                'text-xs rounded-xl px-2.5 py-1.5 border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400/20',
                task.status === 'completed'
                  ? 'bg-purple-50 text-purple-900 border-purple-200 font-semibold'
                  : task.status === 'in_progress'
                  ? 'bg-purple-100 text-purple-950 border-purple-300 font-semibold'
                  : task.status === 'skipped'
                  ? 'bg-purple-50/50 text-purple-400 border-purple-100'
                  : 'bg-white text-black border-purple-200 font-medium'
              )}
            >
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenPlan}
                className="p-1.5 rounded-lg text-purple-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                title="AI Study Plan"
                aria-label="Open AI Study Plan"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 rounded-lg text-purple-400 hover:text-black hover:bg-purple-50 transition-colors"
                title="Edit task"
                aria-label="Edit task"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              {isCompleted && (
                <button
                  type="button"
                  onClick={onArchive}
                  className="p-1.5 rounded-lg text-purple-400 hover:text-black hover:bg-purple-50 transition-colors"
                  title="Move to Archive now"
                  aria-label="Archive task"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}
              {task.status !== 'completed' && task.status !== 'skipped' && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="p-1.5 rounded-lg text-purple-400 hover:text-black hover:bg-purple-50 transition-colors"
                  title="Skip & reschedule"
                  aria-label="Skip task"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-lg text-purple-400 hover:text-black hover:bg-purple-100 transition-colors"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const {
    tasks,
    activeTasks,
    archivedTasks,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    skipTask,
    archiveTask,
    deleteTask,
  } = useTasks();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<SubjectCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortField>('deadline');

  // Keyboard shortcut: press '/' anywhere outside an input to focus the top search bar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'SELECT'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync URL query params (?new=1, ?edit=<id>, or ?view=archive)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get('view') === 'archive') {
      setShowArchive(true);
      searchParams.delete('view');
      setSearchParams(searchParams, { replace: true });
    }
    const editId = searchParams.get('edit');
    if (editId && tasks.length > 0) {
      const target = tasks.find((t) => t._id === editId);
      if (target) {
        setEditingTask(target);
      }
      searchParams.delete('edit');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, tasks]);

  const statusCounts = useMemo(() => {
    return {
      all: activeTasks.length,
      pending: activeTasks.filter((t) => t.status === 'pending').length,
      in_progress: activeTasks.filter((t) => t.status === 'in_progress').length,
      completed: activeTasks.filter((t) => t.status === 'completed').length,
      skipped: activeTasks.filter((t) => t.status === 'skipped').length,
    };
  }, [activeTasks]);

  const baseSourceList = showArchive ? archivedTasks : activeTasks;

  const filtered = useMemo(() => {
    const terms = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const list = baseSourceList.filter((t) => {
      const categoryLabel = CATEGORY_CONFIG[t.category]?.label?.toLowerCase() ?? '';
      const priorityLabel = PRIORITY_CONFIG[t.priority]?.label?.toLowerCase() ?? '';
      const statusLabel = STATUS_CONFIG[t.status]?.label?.toLowerCase() ?? '';

      const matchSearch =
        terms.length === 0 ||
        terms.every(
          (q) =>
            t.title.toLowerCase().includes(q) ||
            t.subject.toLowerCase().includes(q) ||
            (t.description ?? '').toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            categoryLabel.includes(q) ||
            t.priority.toLowerCase().includes(q) ||
            priorityLabel.includes(q) ||
            statusLabel.includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      const matchStatus =
        showArchive || filterStatus === 'all' || t.status === filterStatus;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    });

    return list.sort((a, b) => {
      if (showArchive) {
        const aTime = new Date(a.completedAt ?? a.updatedAt).getTime();
        const bTime = new Date(b.completedAt ?? b.updatedAt).getTime();
        return bTime - aTime;
      }
      if (sortBy === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'priority') {
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      }
      if (sortBy === 'estimatedHours') {
        return b.estimatedHours - a.estimatedHours;
      }
      if (sortBy === 'difficulty') {
        return b.difficulty - a.difficulty;
      }
      return 0;
    });
  }, [
    baseSourceList,
    showArchive,
    search,
    filterStatus,
    filterPriority,
    filterCategory,
    sortBy,
  ]);

  const activeCount = activeTasks.filter((t) => t.status !== 'completed').length;
  const totalEstimatedHours = filtered
    .filter((t) => t.status !== 'completed')
    .reduce((acc, t) => acc + t.estimatedHours, 0);

  async function handleStatusChange(task: Task, newStatus: TaskStatus) {
    if (newStatus === 'completed') {
      await completeTask(task._id);
    } else if (newStatus === 'skipped') {
      await skipTask(task._id);
    } else {
      await updateTask(task._id, { status: newStatus });
    }
  }

  return (
    <div className="page-shell space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{showArchive ? 'Archived Tasks' : 'Tasks'}</h1>
          <p className="page-subtitle">
            {showArchive ? (
              <>
                <span className="font-mono tabular-nums font-semibold text-black">
                  {archivedTasks.length}
                </span>{' '}
                archived task{archivedTasks.length !== 1 ? 's' : ''} · Automatically moved 24 hours after completion
              </>
            ) : (
              <>
                <span className="font-mono tabular-nums font-semibold text-black">
                  {activeCount}
                </span>{' '}
                active task{activeCount !== 1 ? 's' : ''} ·{' '}
                <span className="font-mono tabular-nums font-semibold text-black">
                  {hoursToReadable(totalEstimatedHours)}
                </span>{' '}
                remaining workload
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowArchive((prev) => !prev)}
            className={clsx(
              'btn-secondary',
              showArchive && 'bg-black text-white border-black hover:bg-purple-900 hover:text-white'
            )}
          >
            <Archive className="w-4 h-4 text-purple-700" />
            <span>{showArchive ? 'Back to Active Tasks' : 'Archive'}</span>
            <span
              className={clsx(
                'font-mono tabular-nums text-xs px-1.5 py-0.5 rounded font-bold',
                showArchive
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 text-purple-900'
              )}
            >
              {archivedTasks.length}
            </span>
          </button>

          <button onClick={() => setShowCreate(true)} className="btn-primary font-bold">
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Top Search Bar */}
      <div className="card p-2 sm:p-2.5 border border-purple-200">
        <div className="relative flex items-center">
          <Search
            className="absolute left-3.5 w-4 h-4 text-purple-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            aria-label="Search tasks"
            className="input pl-10 pr-28 py-2.5 bg-white border-purple-200 text-sm text-black placeholder-purple-400"
            placeholder={
              showArchive
                ? 'Search archived tasks by title, subject, category, or tag...'
                : 'Search tasks by title, subject, category, priority, tag, or notes...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (search) {
                  setSearch('');
                } else {
                  searchInputRef.current?.blur();
                }
              }
            }}
          />
          <div className="absolute right-2.5 flex items-center gap-2">
            {search.trim() ? (
              <>
                <span className="text-xs text-purple-900/60 font-mono tabular-nums font-semibold hidden sm:inline">
                  {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-200 transition-colors font-semibold"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            ) : (
              <kbd
                className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-mono text-purple-400 bg-purple-50 border border-purple-200 rounded-md pointer-events-none"
                title="Press / to search"
              >
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Status Segmented Tabs & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {!showArchive ? (
          <div className="flex items-center gap-1 p-1 bg-purple-100/70 border border-purple-200/80 rounded-xl overflow-x-auto w-full sm:w-fit">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed (<24h)' },
                { id: 'skipped', label: 'Skipped' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap flex items-center gap-1.5',
                  filterStatus === tab.id
                    ? 'bg-white text-black font-bold shadow-xs'
                    : 'text-purple-900/70 hover:text-black font-medium'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={clsx(
                    'tabular-nums text-[11px] font-mono',
                    filterStatus === tab.id ? 'text-black font-bold' : 'text-purple-400'
                  )}
                >
                  {statusCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="card px-4 py-3 bg-white border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-1">
            <div className="flex items-center gap-2.5 text-xs text-purple-900/70 font-medium">
              <Archive className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                Completed tasks are automatically moved to this hidden Archive list after{' '}
                <strong className="font-bold text-black">24 hours</strong> to keep your main task view clean.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowArchive(false)}
              className="text-xs font-bold text-purple-700 hover:text-black shrink-0 self-start sm:self-auto"
            >
              Return to main view →
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority Interactive Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-purple-100/70 rounded-xl border border-purple-200/80">
            {(['all', 'high', 'medium', 'low'] as const).map((p) => {
              const isSelected = filterPriority === p;
              const count =
                p === 'all'
                  ? baseSourceList.length
                  : baseSourceList.filter((t) => t.priority === p).length;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPriority(p)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs transition-colors whitespace-nowrap inline-flex items-center gap-1.5',
                    isSelected
                      ? 'bg-white text-black font-bold shadow-xs'
                      : 'text-purple-900/70 hover:text-black font-medium'
                  )}
                >
                  {p !== 'all' && (
                    <span
                      className={clsx(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        PRIORITY_CONFIG[p].dotClass
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span>{p === 'all' ? 'All Priority' : PRIORITY_CONFIG[p].label}</span>
                  <span
                    className={clsx(
                      'tabular-nums text-[11px] font-mono',
                      isSelected ? 'text-black font-bold' : 'text-purple-400'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {!showArchive && (
            <select
              className="input w-auto py-1.5 text-xs font-medium border-purple-200"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              aria-label="Sort tasks"
            >
              <option value="deadline">Sort: Due Date</option>
              <option value="priority">Sort: Priority</option>
              <option value="estimatedHours">Sort: Effort (Hours)</option>
              <option value="difficulty">Sort: Difficulty</option>
            </select>
          )}
        </div>
      </div>

      {/* Color-Coded Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={clsx(
            'px-2.5 py-1 rounded-md text-xs font-bold border transition-colors whitespace-nowrap shrink-0',
            filterCategory === 'all'
              ? 'bg-black text-white border-black'
              : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
          )}
        >
          All Categories
        </button>
        {(Object.keys(CATEGORY_CONFIG) as SubjectCategory[]).map((cat) => {
          const count = baseSourceList.filter((t) => t.category === cat).length;
          const isPrimary = cat === 'study' || cat === 'work' || cat === 'personal';
          if (!isPrimary && count === 0 && filterCategory !== cat) return null;
          return (
            <CategoryLabel
              key={cat}
              category={cat}
              size="sm"
              active={filterCategory === cat}
              onClick={() =>
                setFilterCategory((prev) => (prev === cat ? 'all' : cat))
              }
            />
          );
        })}
      </div>

      {/* Task List Container */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="text-sm font-bold text-black">
            {showArchive ? 'No archived tasks' : 'No matching tasks'}
          </div>
          <p className="text-xs text-purple-900/60 mt-1 max-w-sm font-medium">
            {showArchive
              ? 'Tasks that have been completed for more than 24 hours will automatically appear here.'
              : search ||
                filterStatus !== 'all' ||
                filterPriority !== 'all' ||
                filterCategory !== 'all'
              ? 'No tasks match your current filters. Reset filters or check the Archive.'
              : 'Add your first assignment, lab report, or exam prep task to build your schedule.'}
          </p>
          <div className="flex items-center gap-2.5 mt-4">
            {(search ||
              filterStatus !== 'all' ||
              filterPriority !== 'all' ||
              filterCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterPriority('all');
                  setFilterCategory('all');
                }}
                className="btn-ghost"
              >
                Reset Filters
              </button>
            )}
            {showArchive ? (
              <button
                type="button"
                onClick={() => setShowArchive(false)}
                className="btn-secondary"
              >
                Back to Active Tasks
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="card overflow-hidden divide-y divide-purple-100">
            {filtered.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                searchQuery={search}
                isArchiveView={showArchive}
                activePriorityFilter={filterPriority}
                onToggleComplete={() =>
                  task.status === 'completed'
                    ? updateTask(task._id, { status: 'pending' })
                    : completeTask(task._id)
                }
                onStatusChange={(status) => handleStatusChange(task, status)}
                onCategoryClick={(cat) =>
                  setFilterCategory((prev) => (prev === cat ? 'all' : cat))
                }
                onPriorityClick={(p) =>
                  setFilterPriority((prev) => (prev === p ? 'all' : p))
                }
                onEdit={() => setEditingTask(task)}
                onSkip={() => skipTask(task._id)}
                onArchive={() => archiveTask(task._id, true)}
                onRestore={() => archiveTask(task._id, false, false)}
                onReopen={() => archiveTask(task._id, false, true)}
                onDelete={() => deleteTask(task._id)}
                onOpenPlan={() => navigate(`/plan?taskId=${task._id}`)}
              />
            ))}
          </div>

          {/* Subtle Archive Footer Indicator when in Main Task View */}
          {!showArchive && archivedTasks.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-purple-50/80 border border-purple-200/70 text-xs text-purple-900/70">
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  <strong className="font-semibold text-black font-mono tabular-nums">
                    {archivedTasks.length}
                  </strong>{' '}
                  completed task{archivedTasks.length !== 1 ? 's' : ''} (&gt;24h old) automatically moved to Archive
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowArchive(true)}
                className="font-semibold text-purple-700 hover:text-black transition-colors"
              >
                View Archive →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Task"
      >
        <TaskForm
          onSubmit={async (f) => {
            await createTask(f);
            setShowCreate(false);
          }}
          onClose={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
      >
        {editingTask && (
          <TaskForm
            initial={editingTask}
            isEdit
            onSubmit={async (f) => {
              const updates: UpdateTaskForm = {
                title: f.title,
                subject: f.subject,
                category: f.category,
                description: f.description,
                deadline: f.deadline,
                estimatedHours: f.estimatedHours,
                priority: f.priority,
                difficulty: f.difficulty,
                tags: f.tags,
                status: f.status,
              };
              await updateTask(editingTask._id, updates);
              if (f.status === 'completed' && editingTask.status !== 'completed') {
                await completeTask(editingTask._id);
              }
              setEditingTask(null);
            }}
            onClose={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </div>
  );
}
