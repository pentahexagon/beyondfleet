'use client';

import { Search, Filter, X } from 'lucide-react';
import type { TaskFilters as TaskFiltersType, Phase, TaskPriority } from '@/types/dashboard';
import { PHASE_INFO, PRIORITY_INFO } from '@/types/dashboard';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
}

export default function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.phase !== 'all' ||
    filters.priority !== 'all' ||
    filters.dueDate !== 'all';

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      phase: 'all',
      priority: 'all',
      dueDate: 'all',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2 bg-space-800/60 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        {filters.search && (
          <button
            onClick={() => onFiltersChange({ ...filters, search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Phase Filter */}
      <select
        value={filters.phase}
        onChange={(e) =>
          onFiltersChange({ ...filters, phase: e.target.value as Phase | 'all' })
        }
        className="px-3 py-2 bg-space-800/60 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
      >
        <option value="all">All Phases</option>
        {Object.entries(PHASE_INFO).map(([key, info]) => (
          <option key={key} value={key}>
            {info.name}
          </option>
        ))}
      </select>

      {/* Priority Filter */}
      <select
        value={filters.priority}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            priority: e.target.value as TaskPriority | 'all',
          })
        }
        className="px-3 py-2 bg-space-800/60 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
      >
        <option value="all">All Priorities</option>
        {Object.entries(PRIORITY_INFO).map(([key, info]) => (
          <option key={key} value={key}>
            {info.emoji} {info.name}
          </option>
        ))}
      </select>

      {/* Due Date Filter */}
      <select
        value={filters.dueDate}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            dueDate: e.target.value as TaskFiltersType['dueDate'],
          })
        }
        className="px-3 py-2 bg-space-800/60 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
      >
        <option value="all">All Dates</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due Today</option>
        <option value="this_week">This Week</option>
        <option value="this_month">This Month</option>
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-3 py-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  );
}
