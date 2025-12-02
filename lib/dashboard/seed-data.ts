// BeyondFleet Roadmap Seed Data
// Run this file to populate the database with initial tasks

import { supabase } from '@/lib/supabase/client';
import type { Task, Subtask } from '@/types/dashboard';

interface SeedTask {
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  phase: string;
  estimated_hours: number;
  subtasks?: string[];
}

export const BEYONDFLEET_ROADMAP: SeedTask[] = [
  // Phase 1: Core Infrastructure
  {
    title: 'Set up Next.js 14 project with App Router',
    description: 'Initialize the project with TypeScript, Tailwind CSS, and proper folder structure',
    status: 'done',
    priority: 'high',
    phase: 'phase_1',
    estimated_hours: 4,
    subtasks: [
      'Create Next.js project',
      'Configure TypeScript',
      'Set up Tailwind CSS',
      'Create folder structure',
    ],
  },
  {
    title: 'Configure Supabase backend',
    description: 'Set up Supabase project with authentication and database tables',
    status: 'done',
    priority: 'high',
    phase: 'phase_1',
    estimated_hours: 6,
    subtasks: [
      'Create Supabase project',
      'Configure environment variables',
      'Set up database tables',
      'Configure RLS policies',
    ],
  },
  {
    title: 'Design and implement space theme',
    description: 'Create dark space theme with purple/cyan gradients, glass effects, and animations',
    status: 'done',
    priority: 'high',
    phase: 'phase_1',
    estimated_hours: 8,
    subtasks: [
      'Define color palette',
      'Create gradient utilities',
      'Implement glass effect components',
      'Add starfield background animation',
    ],
  },
  {
    title: 'Build reusable UI component library',
    description: 'Create Button, Input, Card, and other base components',
    status: 'done',
    priority: 'medium',
    phase: 'phase_1',
    estimated_hours: 10,
    subtasks: [
      'Button component with variants',
      'Input component with validation',
      'Card component',
      'Modal component',
    ],
  },

  // Phase 2: Authentication & Profiles
  {
    title: 'Implement email/password authentication',
    description: 'Set up Supabase Auth with email confirmation and password reset',
    status: 'done',
    priority: 'high',
    phase: 'phase_2',
    estimated_hours: 6,
    subtasks: [
      'Create login page',
      'Create signup page',
      'Implement email verification',
      'Add password reset flow',
    ],
  },
  {
    title: 'Build user profile system',
    description: 'Create profile page with avatar, username, and settings',
    status: 'done',
    priority: 'high',
    phase: 'phase_2',
    estimated_hours: 8,
    subtasks: [
      'Profile page UI',
      'Avatar upload functionality',
      'Username management',
      'Profile settings',
    ],
  },
  {
    title: 'Integrate Ethereum wallet connection',
    description: 'Add RainbowKit/Wagmi for Ethereum wallet support',
    status: 'done',
    priority: 'medium',
    phase: 'phase_2',
    estimated_hours: 6,
    subtasks: [
      'Install RainbowKit',
      'Configure Wagmi chains',
      'Create wallet connect button',
      'Link wallet to profile',
    ],
  },
  {
    title: 'Integrate Solana wallet connection',
    description: 'Add Solana wallet adapter for Phantom and other wallets',
    status: 'done',
    priority: 'medium',
    phase: 'phase_2',
    estimated_hours: 6,
    subtasks: [
      'Install Solana wallet adapter',
      'Configure supported wallets',
      'Create connection UI',
      'Link wallet to profile',
    ],
  },

  // Phase 3: Crypto Features
  {
    title: 'Build cryptocurrency price page',
    description: 'Display real-time crypto prices with search and pagination',
    status: 'done',
    priority: 'high',
    phase: 'phase_3',
    estimated_hours: 12,
    subtasks: [
      'Binance API integration',
      'Price table component',
      'Search functionality',
      'Pagination system',
    ],
  },
  {
    title: 'Implement watchlist feature',
    description: 'Allow users to save favorite cryptocurrencies',
    status: 'in_progress',
    priority: 'medium',
    phase: 'phase_3',
    estimated_hours: 6,
    subtasks: [
      'Watchlist database table',
      'Add to watchlist button',
      'Watchlist page',
      'Remove from watchlist',
    ],
  },
  {
    title: 'Add price alerts system',
    description: 'Set up price alert notifications for cryptocurrencies',
    status: 'backlog',
    priority: 'low',
    phase: 'phase_3',
    estimated_hours: 10,
    subtasks: [
      'Price alerts table',
      'Alert creation form',
      'Background price checking',
      'Email/push notifications',
    ],
  },

  // Phase 4: Membership System
  {
    title: 'Design membership tier system',
    description: 'Define 5 tiers: Cadet, Navigator, Pilot, Commander, Admiral',
    status: 'done',
    priority: 'high',
    phase: 'phase_4',
    estimated_hours: 4,
    subtasks: [
      'Define tier benefits',
      'Set voting power per tier',
      'Design tier badges/icons',
      'Document tier requirements',
    ],
  },
  {
    title: 'Build membership page',
    description: 'Create membership showcase page with tier comparisons',
    status: 'done',
    priority: 'high',
    phase: 'phase_4',
    estimated_hours: 8,
    subtasks: [
      'Tier comparison cards',
      'Benefits list per tier',
      'Upgrade CTA buttons',
      'Responsive design',
    ],
  },
  {
    title: 'Implement tier upgrade logic',
    description: 'Handle membership upgrades and payments',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_4',
    estimated_hours: 12,
  },

  // Phase 5: NFT Integration
  {
    title: 'Research NFT standards for memberships',
    description: 'Evaluate ERC-721 vs ERC-1155 for membership NFTs',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_5',
    estimated_hours: 4,
  },
  {
    title: 'Design membership NFT artwork',
    description: 'Create unique artwork for each membership tier NFT',
    status: 'backlog',
    priority: 'medium',
    phase: 'phase_5',
    estimated_hours: 20,
  },
  {
    title: 'Develop NFT smart contract',
    description: 'Create and deploy membership NFT contract',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_5',
    estimated_hours: 24,
    subtasks: [
      'Write Solidity contract',
      'Add tier metadata',
      'Implement minting logic',
      'Deploy to testnet',
      'Audit contract',
      'Deploy to mainnet',
    ],
  },
  {
    title: 'Build NFT minting interface',
    description: 'Create UI for purchasing/minting membership NFTs',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_5',
    estimated_hours: 16,
  },

  // Phase 6: Voting & Governance
  {
    title: 'Design voting system architecture',
    description: 'Plan voting mechanism with weighted votes based on tier',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_6',
    estimated_hours: 6,
  },
  {
    title: 'Build donation recipient voting page',
    description: 'Allow members to vote on charity recipients',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_6',
    estimated_hours: 16,
    subtasks: [
      'Voting page UI',
      'Candidate cards',
      'Vote submission',
      'Results display',
    ],
  },
  {
    title: 'Implement vote counting and results',
    description: 'Calculate weighted votes and display results',
    status: 'backlog',
    priority: 'medium',
    phase: 'phase_6',
    estimated_hours: 8,
  },

  // Phase 7: Charity Features
  {
    title: 'Build donation tracking system',
    description: 'Track and display all charitable donations',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_7',
    estimated_hours: 12,
    subtasks: [
      'Donations database',
      'Donation page UI',
      'Transaction tracking',
      'Impact statistics',
    ],
  },
  {
    title: 'Create giving page with active campaigns',
    description: 'Show current donation campaigns and progress',
    status: 'done',
    priority: 'high',
    phase: 'phase_7',
    estimated_hours: 10,
  },
  {
    title: 'Implement crypto donation flow',
    description: 'Allow donations in multiple cryptocurrencies',
    status: 'backlog',
    priority: 'medium',
    phase: 'phase_7',
    estimated_hours: 16,
  },

  // Phase 8: Learning Platform
  {
    title: 'Build education content system',
    description: 'Create database and UI for educational articles',
    status: 'in_progress',
    priority: 'high',
    phase: 'phase_8',
    estimated_hours: 12,
    subtasks: [
      'Education table schema',
      'Content editor',
      'Article display page',
      'Category filtering',
    ],
  },
  {
    title: 'Create tiered content access',
    description: 'Lock premium content behind membership tiers',
    status: 'backlog',
    priority: 'medium',
    phase: 'phase_8',
    estimated_hours: 6,
  },
  {
    title: 'Add interactive tutorials',
    description: 'Create step-by-step crypto learning tutorials',
    status: 'backlog',
    priority: 'low',
    phase: 'phase_8',
    estimated_hours: 20,
  },

  // Phase 9: Community Features
  {
    title: 'Build community news feed',
    description: 'Create cryptocurrency news aggregation system',
    status: 'backlog',
    priority: 'medium',
    phase: 'phase_9',
    estimated_hours: 14,
  },
  {
    title: 'Add discussion forum',
    description: 'Implement community discussion boards',
    status: 'backlog',
    priority: 'low',
    phase: 'phase_9',
    estimated_hours: 24,
    subtasks: [
      'Forum database schema',
      'Thread creation',
      'Reply system',
      'Moderation tools',
    ],
  },
  {
    title: 'Create member profiles showcase',
    description: 'Public profiles showing member activity and contributions',
    status: 'backlog',
    priority: 'low',
    phase: 'phase_9',
    estimated_hours: 10,
  },

  // Phase 10: Launch & Polish
  {
    title: 'Performance optimization',
    description: 'Optimize loading times, bundle size, and API calls',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_10',
    estimated_hours: 12,
    subtasks: [
      'Image optimization',
      'Code splitting',
      'API caching',
      'Lighthouse audit',
    ],
  },
  {
    title: 'Security audit',
    description: 'Review and fix all security vulnerabilities',
    status: 'backlog',
    priority: 'high',
    phase: 'phase_10',
    estimated_hours: 16,
    subtasks: [
      'RLS policy review',
      'Input validation audit',
      'Smart contract audit',
      'Penetration testing',
    ],
  },
  {
    title: 'Mobile responsiveness testing',
    description: 'Test and fix UI on all device sizes',
    status: 'backlog',
    priority: 'medium',
    phase: 'phase_10',
    estimated_hours: 8,
  },
  {
    title: 'Create landing page',
    description: 'Design and build marketing landing page',
    status: 'done',
    priority: 'high',
    phase: 'phase_10',
    estimated_hours: 12,
  },
  {
    title: 'Set up analytics and monitoring',
    description: 'Implement Vercel Analytics and error tracking',
    status: 'backlog',
    priority: 'medium',
    phase: 'phase_10',
    estimated_hours: 4,
  },
  {
    title: 'Documentation and README',
    description: 'Write comprehensive project documentation',
    status: 'backlog',
    priority: 'low',
    phase: 'phase_10',
    estimated_hours: 6,
  },
];

export async function seedTasks(): Promise<{ success: boolean; message: string; count?: number }> {

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Not authenticated. Please log in first.' };
  }

  // Check if tasks already exist
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (existingTasks && existingTasks.length > 0) {
    return {
      success: false,
      message: 'Tasks already exist. Delete existing tasks first to re-seed.'
    };
  }

  let taskCount = 0;

  for (const seedTask of BEYONDFLEET_ROADMAP) {
    // Create task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: seedTask.title,
        description: seedTask.description,
        status: seedTask.status,
        priority: seedTask.priority,
        phase: seedTask.phase,
        estimated_hours: seedTask.estimated_hours,
        order_index: taskCount,
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      continue;
    }

    taskCount++;

    // Create subtasks if any
    if (seedTask.subtasks && seedTask.subtasks.length > 0) {
      for (let i = 0; i < seedTask.subtasks.length; i++) {
        const subtaskTitle = seedTask.subtasks[i];
        const completed = seedTask.status === 'done';

        await supabase.from('subtasks').insert({
          task_id: task.id,
          title: subtaskTitle,
          completed,
          order_index: i,
        });
      }
    }
  }

  return {
    success: true,
    message: `Successfully created ${taskCount} tasks with subtasks.`,
    count: taskCount,
  };
}

export async function clearAllTasks(): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'All tasks deleted successfully' };
}
