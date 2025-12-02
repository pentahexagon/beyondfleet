'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus, RefreshCw, Database, Trash2 } from 'lucide-react';
import type { Task, TaskStatus, TaskFilters as TaskFiltersType, Subtask, PhaseProgress as PhaseProgressType } from '@/types/dashboard';
import { DEFAULT_FILTERS } from '@/types/dashboard';
import { getTasks, createTask, updateTask, deleteTask, reorderTasks, createSubtask, toggleSubtask, getPhaseProgress } from '@/lib/dashboard/api';
import { seedTasks, clearAllTasks } from '@/lib/dashboard/seed-data';
import KanbanColumn from '@/components/dashboard/KanbanColumn';
import TaskCard from '@/components/dashboard/TaskCard';
import TaskModal from '@/components/dashboard/TaskModal';
import TaskFilters from '@/components/dashboard/TaskFilters';
import PhaseProgress from '@/components/dashboard/PhaseProgress';

const COLUMNS: TaskStatus[] = ['backlog', 'in_progress', 'review', 'done'];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFiltersType>(DEFAULT_FILTERS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialStatus, setModalInitialStatus] = useState<TaskStatus>('backlog');
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgressType[]>([]);
  const [showProgress, setShowProgress] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedTasks, progress] = await Promise.all([
        getTasks(filters),
        getPhaseProgress(),
      ]);
      setTasks(fetchedTasks);
      setPhaseProgress(progress);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropping over a column
    const overColumnId = COLUMNS.includes(over.id as TaskStatus)
      ? (over.id as TaskStatus)
      : tasks.find((t) => t.id === over.id)?.status;

    if (overColumnId && activeTask.status !== overColumnId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, status: overColumnId } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    const overColumnId = COLUMNS.includes(over.id as TaskStatus)
      ? (over.id as TaskStatus)
      : tasks.find((t) => t.id === over.id)?.status;

    if (!overColumnId) return;

    // Find new index
    const columnTasks = getTasksByStatus(overColumnId);
    const overTaskIndex = columnTasks.findIndex((t) => t.id === over.id);
    const newIndex = overTaskIndex >= 0 ? overTaskIndex : columnTasks.length;

    try {
      await reorderTasks(active.id as string, overColumnId, newIndex);
      if (activeTaskData.status !== overColumnId) {
        await updateTask(active.id as string, { status: overColumnId });
      }
      fetchTasks();
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      fetchTasks();
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setEditingTask(null);
    setModalInitialStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>, subtasks?: Partial<Subtask>[]) => {
    try {
      if (taskData.id) {
        // Update existing task
        await updateTask(taskData.id, taskData);
      } else {
        // Create new task
        const newTask = await createTask(taskData);

        // Create subtasks if any
        if (subtasks && subtasks.length > 0) {
          for (const subtask of subtasks) {
            await createSubtask({
              task_id: newTask.id,
              title: subtask.title,
              completed: subtask.completed || false,
              order_index: subtask.order_index || 0,
            });
          }
        }
      }
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await toggleSubtask(subtaskId, completed);
      fetchTasks();
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const handleSeedData = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const result = await seedTasks();
      if (result.success) {
        alert(result.message);
        fetchTasks();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to seed data:', error);
      alert('Failed to seed data. Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) return;
    try {
      const result = await clearAllTasks();
      if (result.success) {
        fetchTasks();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to clear tasks:', error);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Project Board</h1>
          <p className="text-gray-400 mt-1">Manage your BeyondFleet development tasks</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => handleAddTask('backlog')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <TaskFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Phase Progress Toggle & Display */}
      <div className="mb-6">
        <button
          onClick={() => setShowProgress(!showProgress)}
          className="text-sm text-purple-400 hover:text-purple-300 mb-2"
        >
          {showProgress ? 'Hide' : 'Show'} Phase Progress
        </button>
        {showProgress && <PhaseProgress progress={phaseProgress} />}
      </div>

      {/* Kanban Board */}
      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={getTasksByStatus(status)}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleSubtask={() => {}}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Empty State */}
      {!loading && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
          <p className="text-gray-400 mb-4">Get started by creating your first task or load the BeyondFleet roadmap</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleAddTask('backlog')}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Task
            </button>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="flex items-center justify-center gap-2 px-6 py-2 border border-purple-500/50 text-purple-400 font-medium rounded-lg hover:bg-purple-500/10 transition-colors disabled:opacity-50"
            >
              <Database className="w-5 h-5" />
              {seeding ? 'Loading...' : 'Load Roadmap'}
            </button>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        task={editingTask}
        initialStatus={modalInitialStatus}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
