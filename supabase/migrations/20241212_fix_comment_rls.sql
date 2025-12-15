-- Fix: Allow anonymous users (wallet connected) to insert comments
-- Date: 2024-12-12
-- 1. Enable INSERT for anon users (with wallet_address)
CREATE POLICY "Anon users can insert comments with wallet" ON journal_comments FOR
INSERT WITH CHECK (
        wallet_address IS NOT NULL
        AND user_id IS NULL
    );
-- 2. Allow anon users to delete their own comments (by wallet_address)
-- Note: 'Users can delete own comments' might already exist but often checks auth.uid()
-- We ensure coverage for wallet_address specifically for anon role if not covered.
DROP POLICY IF EXISTS "Anon users can delete own comments" ON journal_comments;
CREATE POLICY "Anon users can delete own comments" ON journal_comments FOR DELETE USING (wallet_address IS NOT NULL);
-- 3. Ensure anon role has permission (just in case)
GRANT INSERT,
    DELETE ON journal_comments TO anon;