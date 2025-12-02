'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  Clock,
  MoreHorizontal,
  CheckSquare,
  Square,
  Trash2,
  Edit2,
  GripVertical,
} from 'lucide-react';
import type { Task, Subtask } from '@/types/dashboard';
import { PRIORITY_INFO, PHASE_INFO } from '@/types/dashboard';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleSubtask: (subtaskId: string, completed: boolean) => void;
  isDragging?: boolean;
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleSubtask,
  isDragging,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [expandSubtasks, setExpandSubtasks] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = PRIORITY_INFO[task.priority];
  const phaseInfo = task.phase ? PHASE_INFO[task.phase] : null;

  const isOverdue =
    task.due_date &&
    isPast(new Date(task.due_date)) &&
    !isToday(new Date(task.due_date)) &&
    task.status !== 'done';

  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-space-800/60 backdrop-blur-sm rounded-lg border transition-all duration-200 ${
        isSortableDragging || isDragging
          ? 'border-purple-500 shadow-lg shadow-purple-500/20 opacity-90 scale-105'
          : 'border-purple-500/20 hover:border-purple-500/40'
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>

      <div className="p-3 pl-6">
        {/* Header with priority and menu */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg" title={priorityInfo.name}>
              {priorityInfo.emoji}
            </span>
            {phaseInfo && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${phaseInfo.color}20`,
                  color: phaseInfo.color,
                }}
              >
                {phaseInfo.name}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-500 hover:text-white rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-space-700 border border-purple-500/30 rounded-lg shadow-xl z-20 py-1">
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-purple-500/20 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(task.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-medium text-white mb-1 line-clamp-2">{task.title}</h3>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Subtasks progress */}
        {totalSubtasks > 0 && (
          <div className="mb-2">
            <button
              onClick={() => setExpandSubtasks(!expandSubtasks)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span>
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            </button>

            {/* Progress bar */}
            <div className="mt-1 h-1.5 bg-space-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
                style={{
                  width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                }}
              />
            </div>

            {/* Expanded subtasks */}
            {expandSubtasks && (
              <div className="mt-2 space-y-1">
                {task.subtasks?.map((subtask) => (
                  <button
                    key={subtask.id}
                    onClick={() => onToggleSubtask(subtask.id, !subtask.completed)}
                    className="w-full flex items-center gap-2 text-sm text-left"
                  >
                    {subtask.completed ? (
                      <CheckSquare className="w-4 h-4 text-green-500" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500" />
                    )}
                    <span
                      className={
                        subtask.completed
                          ? 'text-gray-500 line-through'
                          : 'text-gray-300'
                      }
                    >
                      {subtask.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-purple-500/10">
          {/* Due date */}
          {task.due_date && (
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? 'text-red-400'
                  : isDueToday
                  ? 'text-yellow-400'
                  : 'text-gray-500'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.due_date), 'MMM d')}</span>
            </div>
          )}

          {/* Estimated hours */}
          {task.estimated_hours > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}
        </div>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.map((label) => (
              <span
                key={label.id}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
