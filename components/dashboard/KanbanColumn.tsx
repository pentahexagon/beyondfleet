'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '@/types/dashboard';
import { STATUS_INFO } from '@/types/dashboard';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (subtaskId: string, completed: boolean) => void;
}

export default function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleSubtask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const statusInfo = STATUS_INFO[status];

  return (
    <div
      className={`flex flex-col bg-space-800/30 rounded-xl border transition-colors ${
        isOver ? 'border-purple-500/50 bg-purple-500/5' : 'border-purple-500/10'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-purple-500/10">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: statusInfo.color }}
          />
          <h3 className="font-semibold text-white">{statusInfo.name}</h3>
          <span className="px-2 py-0.5 text-xs font-medium text-gray-400 bg-space-700 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tasks List */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto custom-scrollbar"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggleSubtask={onToggleSubtask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <p className="text-sm">No tasks</p>
            <button
              onClick={() => onAddTask(status)}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              + Add a task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
