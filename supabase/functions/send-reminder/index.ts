// Supabase Edge Function: Send Task Reminder Emails
// Runs daily at 9:00 AM via Supabase Cron

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'BeyondFleet <noreply@beyondfleet.io>';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  phase: string | null;
  user_id: string;
}

interface NotificationPrefs {
  email_reminders: boolean;
  days_before_due: number;
}

interface UserWithTasks {
  email: string;
  tasks: Task[];
}

const priorityEmoji: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

serve(async (req: Request) => {
  try {
    // Verify authorization (for manual invocations)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader && req.method !== 'POST') {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get users with email reminders enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, email_reminders, days_before_due')
      .eq('email_reminders', true);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    if (!preferences || preferences.length === 0) {
      console.log('No users with email reminders enabled');
      return new Response(JSON.stringify({ message: 'No users to notify' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userIds = preferences.map((p) => p.user_id);

    // Get user profiles with emails
    const { data: profiles, error: profileError } = await supabase.auth.admin.listUsers();

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    const userEmailMap = new Map<string, string>();
    profiles.users.forEach((user) => {
      if (user.email && userIds.includes(user.id)) {
        userEmailMap.set(user.id, user.email);
      }
    });

    // Get tasks due today or tomorrow (not completed)
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .in('user_id', userIds)
      .neq('status', 'done')
      .or(`due_date.eq.${todayStr},due_date.eq.${tomorrowStr}`);

    if (taskError) {
      console.error('Error fetching tasks:', taskError);
      throw taskError;
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks due today or tomorrow');
      return new Response(JSON.stringify({ message: 'No tasks to remind' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group tasks by user
    const userTasks = new Map<string, { todayTasks: Task[]; tomorrowTasks: Task[] }>();

    tasks.forEach((task) => {
      const existing = userTasks.get(task.user_id) || { todayTasks: [], tomorrowTasks: [] };
      if (task.due_date === todayStr) {
        existing.todayTasks.push(task);
      } else {
        existing.tomorrowTasks.push(task);
      }
      userTasks.set(task.user_id, existing);
    });

    // Send emails
    const emailResults = [];

    for (const [userId, { todayTasks, tomorrowTasks }] of userTasks.entries()) {
      const email = userEmailMap.get(userId);
      if (!email) continue;

      const emailHtml = generateEmailHtml(todayTasks, tomorrowTasks);
      const emailSubject = generateEmailSubject(todayTasks, tomorrowTasks);

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        const result = await response.json();
        emailResults.push({ email, success: response.ok, result });

        if (!response.ok) {
          console.error(`Failed to send email to ${email}:`, result);
        } else {
          console.log(`Email sent to ${email}`);
        }
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        emailResults.push({ email, success: false, error: emailError });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Reminder emails processed',
        results: emailResults,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateEmailSubject(todayTasks: Task[], tomorrowTasks: Task[]): string {
  if (todayTasks.length > 0 && tomorrowTasks.length > 0) {
    return `⚠️ ${todayTasks.length} task(s) due today, ${tomorrowTasks.length} tomorrow`;
  } else if (todayTasks.length > 0) {
    return `⚠️ ${todayTasks.length} task(s) due TODAY`;
  } else {
    return `📅 ${tomorrowTasks.length} task(s) due tomorrow`;
  }
}

function generateEmailHtml(todayTasks: Task[], tomorrowTasks: Task[]): string {
  const taskListHtml = (tasks: Task[]) =>
    tasks
      .map(
        (task) => `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #2d2d3d;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${priorityEmoji[task.priority]}</span>
                <div>
                  <div style="font-weight: 600; color: #ffffff;">${escapeHtml(task.title)}</div>
                  ${task.description ? `<div style="color: #9ca3af; font-size: 14px; margin-top: 4px;">${escapeHtml(task.description.substring(0, 100))}${task.description.length > 100 ? '...' : ''}</div>` : ''}
                  ${task.phase ? `<span style="display: inline-block; margin-top: 4px; padding: 2px 8px; background: rgba(139, 92, 246, 0.2); color: #a78bfa; border-radius: 12px; font-size: 12px;">Phase ${task.phase.replace('phase_', '')}</span>` : ''}
                </div>
              </div>
            </td>
          </tr>
        `
      )
      .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0;">
            <div style="display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 12px;"></div>
            <h1 style="color: #ffffff; font-size: 24px; margin: 16px 0 8px;">BeyondFleet</h1>
            <p style="color: #9ca3af; margin: 0;">Task Reminder</p>
          </div>

          <!-- Main Content -->
          <div style="background: #12121a; border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; overflow: hidden;">
            ${
              todayTasks.length > 0
                ? `
              <!-- Today's Tasks -->
              <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
                <h2 style="color: #ef4444; font-size: 18px; margin: 0;">⚠️ Due Today</h2>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                ${taskListHtml(todayTasks)}
              </table>
            `
                : ''
            }

            ${
              tomorrowTasks.length > 0
                ? `
              <!-- Tomorrow's Tasks -->
              <div style="padding: 16px; background: rgba(234, 179, 8, 0.1); border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
                <h2 style="color: #eab308; font-size: 18px; margin: 0;">📅 Due Tomorrow</h2>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                ${taskListHtml(tomorrowTasks)}
              </table>
            `
                : ''
            }

            <!-- CTA -->
            <div style="padding: 24px; text-align: center;">
              <a href="${Deno.env.get('SITE_URL') || 'https://beyondfleet.io'}/dashboard"
                 style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                View Dashboard
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 24px 0; color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 8px;">You're receiving this because you have email reminders enabled.</p>
            <p style="margin: 0;">
              <a href="${Deno.env.get('SITE_URL') || 'https://beyondfleet.io'}/dashboard/settings" style="color: #8b5cf6; text-decoration: none;">
                Manage notification settings
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
