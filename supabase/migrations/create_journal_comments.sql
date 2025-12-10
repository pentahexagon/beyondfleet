-- journal_comments 테이블 생성
CREATE TABLE IF NOT EXISTS journal_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address TEXT,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_journal_comments_journal_id ON journal_comments(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_user_id ON journal_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_created_at ON journal_comments(created_at);

-- RLS 활성화
ALTER TABLE journal_comments ENABLE ROW LEVEL SECURITY;

-- 정책: 모든 사람이 댓글 조회 가능
CREATE POLICY "Anyone can view comments"
  ON journal_comments
  FOR SELECT
  USING (true);

-- 정책: 인증된 사용자가 댓글 작성 가능
CREATE POLICY "Authenticated users can insert comments"
  ON journal_comments
  FOR INSERT
  WITH CHECK (true);

-- 정책: 본인이 작성한 댓글만 삭제 가능
CREATE POLICY "Users can delete own comments"
  ON journal_comments
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR wallet_address IS NOT NULL
  );

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_journal_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journal_comments_updated_at
  BEFORE UPDATE ON journal_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_comments_updated_at();
