-- BeyondFleet Wallet Fields Update
-- Run this in Supabase SQL Editor to add wallet support

-- Add wallet address columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS eth_wallet text,
ADD COLUMN IF NOT EXISTS sol_wallet text;

-- Create indexes for wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_eth_wallet ON public.profiles(eth_wallet);
CREATE INDEX IF NOT EXISTS idx_profiles_sol_wallet ON public.profiles(sol_wallet);

-- Add unique constraints (optional - uncomment if you want one wallet per account)
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_eth_wallet UNIQUE (eth_wallet);
-- ALTER TABLE public.profiles ADD CONSTRAINT unique_sol_wallet UNIQUE (sol_wallet);

-- Update handle_new_user function to include wallet fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, membership_tier, vote_power, eth_wallet, sol_wallet)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'membership_tier', 'cadet'),
    COALESCE((new.raw_user_meta_data->>'vote_power')::integer, 1),
    new.raw_user_meta_data->>'eth_wallet',
    new.raw_user_meta_data->>'sol_wallet'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for wallet updates
CREATE POLICY "Users can update own wallet" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
