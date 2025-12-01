-- BeyondFleet Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- Users Profile Table
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique,
  avatar_url text,
  membership_tier text default 'cadet' check (membership_tier in ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  vote_power integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Watchlist Table
-- ============================================
create table public.watchlist (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  coin_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, coin_id)
);

-- ============================================
-- Price Alerts Table
-- ============================================
create table public.price_alerts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  coin_id text not null,
  target_price decimal not null,
  direction text not null check (direction in ('above', 'below')),
  is_active boolean default true,
  triggered_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- News Table
-- ============================================
create table public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  summary text,
  category text check (category in ('bitcoin', 'ethereum', 'defi', 'nft', 'regulation', 'general')),
  source_url text,
  image_url text,
  published_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Education Content Table
-- ============================================
create table public.education (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  content text,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  required_tier text default 'cadet' check (required_tier in ('cadet', 'navigator', 'pilot', 'commander', 'admiral')),
  lessons_count integer default 0,
  duration text,
  icon text,
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Donations Table
-- ============================================
create table public.donations (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  amount decimal not null,
  currency text default 'SOL',
  status text default 'pending' check (status in ('pending', 'voting', 'completed', 'cancelled')),
  proof_url text,
  recipient_name text,
  recipient_info text,
  voting_ends_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- Votes Table
-- ============================================
create table public.votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  donation_id uuid references public.donations(id) on delete cascade not null,
  vote_power integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, donation_id)
);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Watchlist
alter table public.watchlist enable row level security;

create policy "Users can view their own watchlist"
  on watchlist for select
  using (auth.uid() = user_id);

create policy "Users can manage their own watchlist"
  on watchlist for all
  using (auth.uid() = user_id);

-- Price Alerts
alter table public.price_alerts enable row level security;

create policy "Users can view their own alerts"
  on price_alerts for select
  using (auth.uid() = user_id);

create policy "Users can manage their own alerts"
  on price_alerts for all
  using (auth.uid() = user_id);

-- News
alter table public.news enable row level security;

create policy "News is viewable by everyone"
  on news for select
  using (true);

-- Education
alter table public.education enable row level security;

create policy "Published education content is viewable by everyone"
  on education for select
  using (is_published = true);

-- Donations
alter table public.donations enable row level security;

create policy "Donations are viewable by everyone"
  on donations for select
  using (true);

-- Votes
alter table public.votes enable row level security;

create policy "Users can view their own votes"
  on votes for select
  using (auth.uid() = user_id);

create policy "Users can cast their own votes"
  on votes for insert
  with check (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, membership_tier, vote_power)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'membership_tier', 'cadet'),
    coalesce((new.raw_user_meta_data->>'vote_power')::integer, 1)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_education_updated_at
  before update on education
  for each row execute procedure update_updated_at_column();
