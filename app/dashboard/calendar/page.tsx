'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, SlotInfo, Event } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Clock, X } from 'lucide-react';
import type { Task, CalendarEvent } from '@/types/dashboard';
import { PRIORITY_INFO, STATUS_INFO, PHASE_INFO } from '@/types/dashboard';
import { getTasksForCalendar, updateTaskDueDate, getTasks } from '@/lib/dashboard/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  ko: ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TaskEvent extends Event {
  resource: Task;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const start = startOfMonth(subMonths(currentDate, 1));
      const end = endOfMonth(addMonths(currentDate, 1));
      const fetchedTasks = await getTasksForCalendar(start, end);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const events: TaskEvent[] = useMemo(() => {
    return tasks
      .filter((task) => task.due_date)
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: new Date(task.due_date!),
        end: new Date(task.due_date!),
        allDay: true,
        resource: task,
      }));
  }, [tasks]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const date = slotInfo.start;
    setSelectedDate(date);
    const tasksOnDate = tasks.filter(
      (task) =>
        task.due_date &&
        format(new Date(task.due_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    setSelectedDateTasks(tasksOnDate);
    setShowSidebar(true);
  };

  const handleSelectEvent = (event: TaskEvent) => {
    if (event.resource.due_date) {
      const date = new Date(event.resource.due_date);
      setSelectedDate(date);
      const tasksOnDate = tasks.filter(
        (task) =>
          task.due_date &&
          format(new Date(task.due_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      setSelectedDateTasks(tasksOnDate);
      setShowSidebar(true);
    }
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleEventDrop = async ({ event, start }: { event: TaskEvent; start: Date }) => {
    try {
      await updateTaskDueDate(event.resource.id, start);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task due date:', error);
    }
  };

  const eventStyleGetter = (event: TaskEvent) => {
    const task = event.resource;
    const priorityInfo = PRIORITY_INFO[task.priority];
    const statusInfo = STATUS_INFO[task.status];

    let backgroundColor = '#8b5cf6';
    let opacity = 1;

    if (task.phase && PHASE_INFO[task.phase]) {
      backgroundColor = PHASE_INFO[task.phase].color;
    }

    if (task.status === 'done') {
      opacity = 0.5;
    }

    return {
      style: {
        backgroundColor,
        opacity,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  const dayPropGetter = (date: Date) => {
    const today = new Date();
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

    return {
      style: {
        backgroundColor: isSelected
          ? 'rgba(139, 92, 246, 0.2)'
          : isToday
          ? 'rgba(6, 182, 212, 0.1)'
          : 'transparent',
      },
    };
  };

  return (
    <div className="h-[calc(100vh-64px)] lg:h-screen flex">
      {/* Main Calendar */}
      <div className="flex-1 p-4 lg:p-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Calendar</h1>
            <p className="text-gray-400 mt-1">View and manage task deadlines</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 border border-purple-500/30 rounded-lg hover:bg-purple-500/10 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center bg-space-800/60 border border-purple-500/20 rounded-lg">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 text-white font-medium min-w-[140px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="h-[calc(100%-80px)] calendar-dark">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={currentDate}
              onNavigate={handleNavigate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayPropGetter}
              toolbar={false}
              popup
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              style={{ height: '100%' }}
            />
          </div>
        )}
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />

          {/* Sidebar Content */}
          <div className="fixed right-0 top-0 h-full w-80 bg-space-800 border-l border-purple-500/20 z-50 lg:relative lg:z-0">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-white">
                  {selectedDate && format(selectedDate, 'MMM d, yyyy')}
                </span>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 text-gray-400 hover:text-white lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
              {selectedDateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <List className="w-12 h-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">No tasks due on this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-space-700/50 border border-purple-500/20 rounded-lg"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-lg">{PRIORITY_INFO[task.priority].emoji}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-white line-clamp-2">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: `${STATUS_INFO[task.status].color}20`,
                            color: STATUS_INFO[task.status].color,
                          }}
                        >
                          {STATUS_INFO[task.status].name}
                        </span>
                        {task.phase && PHASE_INFO[task.phase] && (
                          <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{
                              backgroundColor: `${PHASE_INFO[task.phase].color}20`,
                              color: PHASE_INFO[task.phase].color,
                            }}
                          >
                            {PHASE_INFO[task.phase].name}
                          </span>
                        )}
                        {task.estimated_hours > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {task.estimated_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .calendar-dark .rbc-calendar {
          background: transparent;
          color: white;
        }

        .calendar-dark .rbc-header {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.2);
          padding: 8px;
          font-weight: 600;
          color: #a78bfa;
        }

        .calendar-dark .rbc-month-view,
        .calendar-dark .rbc-time-view {
          border-color: rgba(139, 92, 246, 0.2);
        }

        .calendar-dark .rbc-day-bg {
          background: transparent;
        }

        .calendar-dark .rbc-day-bg + .rbc-day-bg,
        .calendar-dark .rbc-month-row + .rbc-month-row {
          border-color: rgba(139, 92, 246, 0.1);
        }

        .calendar-dark .rbc-off-range-bg {
          background: rgba(0, 0, 0, 0.2);
        }

        .calendar-dark .rbc-today {
          background: rgba(6, 182, 212, 0.1);
        }

        .calendar-dark .rbc-date-cell {
          padding: 4px 8px;
        }

        .calendar-dark .rbc-date-cell > a {
          color: #d1d5db;
        }

        .calendar-dark .rbc-off-range .rbc-date-cell > a {
          color: #6b7280;
        }

        .calendar-dark .rbc-event {
          background: #8b5cf6;
          border: none;
        }

        .calendar-dark .rbc-event:focus {
          outline: 2px solid #06b6d4;
        }

        .calendar-dark .rbc-show-more {
          color: #a78bfa;
          background: transparent;
        }

        .calendar-dark .rbc-overlay {
          background: #1a1a25;
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .calendar-dark .rbc-overlay-header {
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          padding: 8px 12px;
          color: #a78bfa;
        }

        .calendar-dark .rbc-time-header-content,
        .calendar-dark .rbc-time-content {
          border-color: rgba(139, 92, 246, 0.1);
        }

        .calendar-dark .rbc-timeslot-group {
          border-color: rgba(139, 92, 246, 0.1);
        }

        .calendar-dark .rbc-time-slot {
          border-color: rgba(139, 92, 246, 0.05);
        }

        .calendar-dark .rbc-label {
          color: #9ca3af;
        }

        .calendar-dark .rbc-current-time-indicator {
          background: #06b6d4;
        }
      `}</style>
    </div>
  );
}
