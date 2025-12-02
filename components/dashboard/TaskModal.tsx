'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority, Phase, Subtask } from '@/types/dashboard';
import { PRIORITY_INFO, PHASE_INFO, STATUS_INFO } from '@/types/dashboard';
import { format } from 'date-fns';

interface TaskModalProps {
  task?: Task | null;
  initialStatus?: TaskStatus;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>, subtasks?: Partial<Subtask>[]) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskModal({
  task,
  initialStatus = 'backlog',
  isOpen,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [phase, setPhase] = useState<Phase | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [subtasks, setSubtasks] = useState<Partial<Subtask>[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const isEdit = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setPhase(task.phase || '');
      setDueDate(task.due_date || '');
      setEstimatedHours(task.estimated_hours || 0);
      setSubtasks(task.subtasks || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
      setPriority('medium');
      setPhase('');
      setDueDate('');
      setEstimatedHours(0);
      setSubtasks([]);
    }
  }, [task, initialStatus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      phase: phase || null,
      due_date: dueDate || null,
      estimated_hours: estimatedHours,
    };

    if (task) {
      taskData.id = task.id;
    }

    onSave(taskData, subtasks);
    onClose();
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        title: newSubtask.trim(),
        completed: false,
        order_index: subtasks.length,
      },
    ]);
    setNewSubtask('');
  };

  const handleToggleSubtask = (index: number) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], completed: !updated[index].completed };
    setSubtasks(updated);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-space-800 border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Enter task title..."
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                placeholder="Enter task description..."
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {Object.entries(STATUS_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {Object.entries(PRIORITY_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.emoji} {info.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phase */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                <Tag className="w-4 h-4 inline mr-1" />
                Phase
              </label>
              <select
                value={phase}
                onChange={(e) => setPhase(e.target.value as Phase | '')}
                className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="">No phase</option>
                {Object.entries(PHASE_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name} - {info.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date & Estimated Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <CheckSquare className="w-4 h-4 inline mr-1" />
                Subtasks
              </label>

              {/* Existing subtasks */}
              <div className="space-y-2 mb-2">
                {subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(index)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {subtask.completed ? (
                        <CheckSquare className="w-4 h-4 text-green-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        subtask.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-300'
                      }`}
                    >
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(index)}
                      className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  className="flex-1 px-3 py-2 bg-space-700 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  placeholder="Add a subtask..."
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-purple-500/20 bg-space-800/50">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(task!.id);
                  onClose();
                }}
                className="px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Delete Task
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                {isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
