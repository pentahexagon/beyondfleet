'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart2,
  Target,
  Calendar,
} from 'lucide-react';
import type { DashboardStats, PhaseProgress, BurndownData, Phase } from '@/types/dashboard';
import { PHASE_INFO, STATUS_INFO, PRIORITY_INFO } from '@/types/dashboard';
import { getDashboardStats, getPhaseProgress, getBurndownData, getTaskHistory } from '@/lib/dashboard/api';
import { format, subDays } from 'date-fns';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress[]>([]);
  const [burndownData, setBurndownData] = useState<BurndownData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<Phase | 'all'>('all');
  const [timeRange, setTimeRange] = useState<number>(30);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedStats, fetchedProgress, fetchedHistory] = await Promise.all([
        getDashboardStats(),
        getPhaseProgress(),
        getTaskHistory(timeRange, selectedPhase === 'all' ? undefined : selectedPhase),
      ]);

      setStats(fetchedStats);
      setPhaseProgress(fetchedProgress);

      // Transform history to burndown data
      const burndown: BurndownData[] = fetchedHistory.map((h, index) => ({
        date: format(new Date(h.date), 'MMM d'),
        totalTasks: h.total_tasks,
        completedTasks: h.completed_tasks,
        remainingTasks: h.total_tasks - h.completed_tasks,
        idealBurndown: Math.max(0, fetchedHistory[0]?.total_tasks - (fetchedHistory[0]?.total_tasks / fetchedHistory.length) * index),
      }));

      setBurndownData(burndown);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedPhase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusChartData = stats
    ? [
        { name: 'Backlog', value: stats.tasksByStatus.backlog, color: STATUS_INFO.backlog.color },
        { name: 'In Progress', value: stats.tasksByStatus.in_progress, color: STATUS_INFO.in_progress.color },
        { name: 'Review', value: stats.tasksByStatus.review, color: STATUS_INFO.review.color },
        { name: 'Done', value: stats.tasksByStatus.done, color: STATUS_INFO.done.color },
      ]
    : [];

  const priorityChartData = stats
    ? [
        { name: 'High', value: stats.tasksByPriority.high, color: PRIORITY_INFO.high.color },
        { name: 'Medium', value: stats.tasksByPriority.medium, color: PRIORITY_INFO.medium.color },
        { name: 'Low', value: stats.tasksByPriority.low, color: PRIORITY_INFO.low.color },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Track your project progress and metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 bg-space-800/60 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          {/* Phase Filter */}
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value as Phase | 'all')}
            className="px-3 py-2 bg-space-800/60 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="all">All Phases</option>
            {Object.entries(PHASE_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          icon={<BarChart2 className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Completed"
          value={stats?.completedTasks || 0}
          subtitle={`${stats?.completionRate.toFixed(1) || 0}% completion rate`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
          trend={stats?.completionRate && stats.completionRate > 50 ? 'up' : 'down'}
        />
        <StatCard
          title="Avg. Completion Time"
          value={`${stats?.avgCompletionTime || 0}h`}
          icon={<Clock className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats?.overdueCount || 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats?.overdueCount && stats.overdueCount > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <div className="bg-space-800/60 border border-purple-500/20 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Burndown Chart
          </h3>
          {burndownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={burndownData}>
                <defs>
                  <linearGradient id="remainingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a25',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#a78bfa' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="remainingTasks"
                  name="Remaining Tasks"
                  stroke="#8b5cf6"
                  fill="url(#remainingGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="idealBurndown"
                  name="Ideal Burndown"
                  stroke="#06b6d4"
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>

        {/* Completion Trend */}
        <div className="bg-space-800/60 border border-purple-500/20 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Completion Trend
          </h3>
          {burndownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a25',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#a78bfa' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completedTasks"
                  name="Completed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalTasks"
                  name="Total"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks by Status */}
        <div className="bg-space-800/60 border border-purple-500/20 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a25',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-space-800/60 border border-purple-500/20 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a25',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-space-800/60 border border-purple-500/20 rounded-xl p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            Upcoming Deadlines
          </h3>
          {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 bg-space-700/50 rounded-lg"
                >
                  <span className="text-lg">{PRIORITY_INFO[task.priority].emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      Due {format(new Date(task.due_date!), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              No upcoming deadlines
            </div>
          )}
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-space-800/60 border border-purple-500/20 rounded-xl p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Phase Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={phaseProgress}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
            <XAxis dataKey="phaseName" stroke="#9ca3af" fontSize={10} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a25',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [value, name === 'completed' ? 'Completed' : 'Total']}
            />
            <Legend />
            <Bar dataKey="total" name="Total" fill="#8b5cf640" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'purple' | 'green' | 'cyan' | 'red' | 'gray';
  trend?: 'up' | 'down';
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
    gray: 'from-gray-500/20 to-gray-600/10 border-gray-500/30 text-gray-400',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl lg:text-3xl font-bold text-white">{value}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-green-400' : 'text-red-400'}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
