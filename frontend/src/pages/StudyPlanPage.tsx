import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Check,
  Plus,
} from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { useTasks } from '@/hooks/useTasks';
import type { AIStudyPlan, Task } from '@/types';
import { PRIORITY_CONFIG } from '@/config/constants';
import { deadlineLabel, formatDate, hoursToReadable } from '@/utils/dateUtils';
import clsx from 'clsx';
import toast from 'react-hot-toast';

function PlanSectionCard({
  section,
  index,
}: {
  section: AIStudyPlan['breakdown'][0];
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-purple-50/70 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono tabular-nums font-bold text-purple-700 shrink-0">
            0{index + 1}.
          </span>
          <span className="text-sm font-bold text-black truncate">
            {section.title}
          </span>
          <span className="text-xs font-mono tabular-nums text-purple-900/60 shrink-0 font-medium">
            · {section.duration}
          </span>
        </div>
        <div className="text-purple-400 shrink-0 ml-2">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 pt-2 space-y-3 border-t border-purple-100">
          {section.topics.length > 0 && (
            <div>
              <div className="text-xs font-bold text-black mb-1">Key Topics</div>
              <div className="text-xs text-purple-950/80 font-medium">
                {section.topics.join(' · ')}
              </div>
            </div>
          )}
          {section.activities.length > 0 && (
            <div>
              <div className="text-xs font-bold text-black mb-1.5">
                Action Steps
              </div>
              <ul className="space-y-1.5">
                {section.activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-black">
                    <span className="text-purple-400 font-mono tabular-nums text-xs mt-0.5 font-semibold">
                      {i + 1}.
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskSelectorItem({
  task,
  selected,
  onSelect,
}: {
  task: Task;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'w-full text-left px-4 py-3.5 transition-colors flex items-start gap-3',
        selected ? 'bg-purple-100/70' : 'hover:bg-purple-50'
      )}
    >
      <div
        className={clsx(
          'mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
          selected ? 'border-purple-700 bg-purple-700' : 'border-purple-200'
        )}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={clsx(
            'text-sm font-semibold truncate',
            selected ? 'text-purple-950 font-bold' : 'text-black'
          )}
        >
          {task.title}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-purple-900/60 mt-1 font-medium">
          <span>{task.subject}</span>
          <span aria-hidden="true">·</span>
          <span
            className={clsx(
              'font-semibold',
              task.priority === 'high'
                ? 'text-purple-900 font-bold'
                : task.priority === 'medium'
                ? 'text-purple-700'
                : 'text-black'
            )}
          >
            {PRIORITY_CONFIG[task.priority].label}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{deadlineLabel(task.deadline)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums font-semibold text-black">
            {hoursToReadable(task.estimatedHours)}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function StudyPlanPage() {
  const { tasks } = useTasks();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [checkedGoals, setCheckedGoals] = useState<Record<string, boolean>>({});

  // Initialize selectedTaskId from URL param or first pending task
  useEffect(() => {
    const paramId = searchParams.get('taskId');
    if (paramId && tasks.some((t) => t._id === paramId)) {
      setSelectedTaskId(paramId);
      return;
    }
    if (!selectedTaskId && pendingTasks.length > 0) {
      setSelectedTaskId(pendingTasks[0]._id);
    }
  }, [searchParams, tasks, pendingTasks, selectedTaskId]);

  const { data: existingPlan, isLoading: planLoading } = useQuery<AIStudyPlan | null>({
    queryKey: ['study-plan', selectedTaskId],
    queryFn: async () => {
      if (!selectedTaskId) return null;
      try {
        const { data } = await apiClient.get(`/ai/plan/${selectedTaskId}`);
        return data.data;
      } catch {
        return null;
      }
    },
    enabled: Boolean(selectedTaskId),
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (taskId: string) =>
      (await apiClient.post<{ data: AIStudyPlan }>('/ai/generate-plan', { taskId }))
        .data.data,
    onSuccess: (newPlan) => {
      qc.setQueryData(['study-plan', selectedTaskId], newPlan);
      toast.success('Study plan generated');
    },
    onError: () => toast.error('Could not generate study plan'),
  });

  const plan = existingPlan;
  const isGenerating = generatePlanMutation.isPending;
  const selectedTask = tasks.find((t) => t._id === selectedTaskId);

  return (
    <div className="page-shell space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Study Plan</h1>
          <p className="page-subtitle">
            Structured phase-by-phase breakdown, daily milestones, and course resources
          </p>
        </div>
        {selectedTaskId && (
          <button
            type="button"
            onClick={() => generatePlanMutation.mutate(selectedTaskId)}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Plan...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{plan ? 'Regenerate Plan' : 'Generate Study Plan'}</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Task Selector */}
        <div className="lg:col-span-2 space-y-3">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-purple-100 bg-white flex items-center justify-between">
              <span className="text-xs font-bold text-black">
                Active Tasks ({pendingTasks.length})
              </span>
              <button
                type="button"
                onClick={() => navigate('/tasks?new=1')}
                className="text-xs font-bold text-purple-700 hover:text-black inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-black">No active tasks</div>
                <p className="text-xs text-purple-900/60 mt-1 font-medium">
                  Create a task first to generate a tailored study roadmap.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-purple-100">
                {pendingTasks.map((task) => (
                  <TaskSelectorItem
                    key={task._id}
                    task={task}
                    selected={selectedTaskId === task._id}
                    onSelect={() => setSelectedTaskId(task._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Study Plan Content */}
        <div className="lg:col-span-3">
          {!selectedTaskId ? (
            <div className="empty-state py-16">
              <BookOpen className="w-6 h-6 text-purple-400 mb-2.5" />
              <div className="text-sm font-bold text-black">
                Select a task to view its study plan
              </div>
              <p className="text-xs text-purple-900/60 mt-1 max-w-xs font-medium">
                Choose any active assignment from the left panel to generate a phase-by-phase breakdown.
              </p>
            </div>
          ) : planLoading || isGenerating ? (
            <div className="card flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-purple-700 animate-spin mb-3" />
              <div className="text-sm font-bold text-black">
                {isGenerating ? 'Building your personalized study roadmap...' : 'Loading study plan...'}
              </div>
              <div className="text-xs text-purple-900/60 mt-1 font-medium">
                Structuring milestones and time allocations
              </div>
            </div>
          ) : plan ? (
            <div className="space-y-5">
              {/* Plan Summary Header */}
              <div className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-bold text-purple-700">
                    {selectedTask?.subject ?? 'Study Roadmap'}
                  </div>
                  <div className="text-xs text-purple-900/60 font-mono tabular-nums font-semibold">
                    {plan.estimatedDays} day plan · {plan.breakdown.length} phases · Updated{' '}
                    {formatDate(plan.generatedAt, 'MMM d')}
                  </div>
                </div>
                {selectedTask && (
                  <h2 className="text-base sm:text-lg font-bold text-black mb-2">
                    {selectedTask.title}
                  </h2>
                )}
                <p className="text-xs sm:text-sm text-purple-950 leading-relaxed font-normal">
                  {plan.planText}
                </p>
              </div>

              {/* Checkable Daily Goals */}
              {plan.dailyGoals.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-purple-100 bg-white">
                    <h3 className="text-xs font-bold text-black">
                      Daily Milestones
                    </h3>
                  </div>
                  <div className="divide-y divide-purple-100">
                    {plan.dailyGoals.map((goal, i) => {
                      const key = `${selectedTaskId}-goal-${i}`;
                      const isDone = Boolean(checkedGoals[key]);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setCheckedGoals((prev) => ({ ...prev, [key]: !prev[key] }))
                          }
                          className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-purple-50/70 transition-colors text-left"
                        >
                          <div
                            className={clsx(
                              'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                              isDone
                                ? 'bg-purple-700 border-purple-700 text-white'
                                : 'border-purple-300 bg-white'
                            )}
                          >
                            {isDone && <Check className="w-3 h-3" />}
                          </div>
                          <span
                            className={clsx(
                              'text-xs sm:text-sm',
                              isDone ? 'line-through text-purple-400' : 'text-black font-medium'
                            )}
                          >
                            {goal}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Phase Breakdown */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-black px-1">
                  Execution Phases
                </div>
                {plan.breakdown.map((section, i) => (
                  <PlanSectionCard key={i} section={section} index={i} />
                ))}
              </div>

              {/* Recommended Resources */}
              {plan.resources.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-xs font-bold text-black mb-3">
                    Recommended Reference Material
                  </h3>
                  <ul className="space-y-2">
                    {plan.resources.map((r, i) => (
                      <li
                        key={i}
                        className="text-xs sm:text-sm text-purple-950 flex items-start gap-2"
                      >
                        <span className="font-mono tabular-nums text-purple-400 text-xs mt-0.5 font-bold">
                          0{i + 1}.
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state py-16">
              <BookOpen className="w-6 h-6 text-purple-400 mb-2.5" />
              <div className="text-sm font-bold text-black">
                No study plan generated for this task yet
              </div>
              <p className="text-xs text-purple-900/60 mt-1 max-w-sm font-medium">
                Generate a tailored multi-phase breakdown with daily milestones and recommended study resources.
              </p>
              <button
                type="button"
                onClick={() => generatePlanMutation.mutate(selectedTaskId)}
                disabled={isGenerating}
                className="btn-primary mt-4 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Study Plan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
