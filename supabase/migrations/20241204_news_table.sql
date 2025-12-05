-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  source VARCHAR(255),
  source_url TEXT,
  image_url TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for published news
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);

-- Enable RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Anyone can read published news
CREATE POLICY "Anyone can view published news" ON news
  FOR SELECT
  USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage news" ON news
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
