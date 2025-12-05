-- Content Ideas table for admin memo feature
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  source_url TEXT,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'idea' CHECK (status IN ('idea', 'in_progress', 'completed', 'archived')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_tags ON content_ideas USING GIN(tags);

-- Enable RLS
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;

-- Only admins can access content ideas
CREATE POLICY "Admins can manage content ideas" ON content_ideas
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
