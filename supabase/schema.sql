-- Quiniela Mundial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  group_letter CHAR(1) NOT NULL CHECK (group_letter IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  flag_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teamA_id UUID NOT NULL REFERENCES teams(id),
  teamB_id UUID NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  group_letter CHAR(1) NOT NULL CHECK (group_letter IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'finished')),
  scoreA INTEGER,
  scoreB INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  match_id UUID NOT NULL REFERENCES matches(id),
  goalsA INTEGER CHECK (goalsA >= 0),
  goalsB INTEGER CHECK (goalsB >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_matches_group ON matches(group_letter);
CREATE INDEX idx_matches_datetime ON matches(datetime);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_teams_group ON teams(group_letter);

-- Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Teams: public read
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);

-- Matches: public read
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);

-- Predictions: users can only access their own
CREATE POLICY "Users read own predictions" ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own predictions" ON predictions FOR UPDATE USING (auth.uid() = user_id);

-- User profiles: public read, own write
CREATE POLICY "Public read profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Sample data for teams (World Cup 2026 format - 48 teams, 8 groups of 6)
INSERT INTO teams (name, group_letter, flag_url, description) VALUES
-- Group A
('Mexico', 'A', '/flags/mx.svg', 'Host nation'),
('Argentina', 'A', '/flags/ar.svg', ''),
('Poland', 'A', '/flags/pl.svg', ''),
('Saudi Arabia', 'A', '/flags/sa.svg', ''),
('France', 'A', '/flags/fr.svg', ''),
('Peru', 'A', '/flags/pe.svg', ''),
-- Group B
('Spain', 'B', '/flags/es.svg', ''),
('England', 'B', '/flags/eng.svg', ''),
('Germany', 'B', '/flags/de.svg', ''),
('Japan', 'B', '/flags/jp.svg', ''),
('USA', 'B', '/flags/us.svg', ''),
('South Korea', 'B', '/flags/kr.svg', ''),
-- Group C
('Brazil', 'C', '/flags/br.svg', ''),
('Portugal', 'C', '/flags/pt.svg', ''),
('Netherlands', 'C', '/flags/nl.svg', ''),
('Belgium', 'C', '/flags/be.svg', ''),
('Uruguay', 'C', '/flags/uy.svg', ''),
('Colombia', 'C', '/flags/co.svg', ''),
-- Group D
('Italy', 'D', '/flags/it.svg', ''),
('Croatia', 'D', '/flags/hr.svg', ''),
('Denmark', 'D', '/flags/dk.svg', ''),
('Sweden', 'D', '/flags/se.svg', ''),
('Switzerland', 'D', '/flags/ch.svg', ''),
('Wales', 'D', '/flags/wa.svg', ''),
-- Group E
('Nigereria', 'E', '/flags/ng.svg', ''),
('Senegal', 'E', '/flags/sn.svg', ''),
('Ghana', 'E', '/flags/gh.svg', ''),
('Cameroon', 'E', '/flags/cm.svg', ''),
('Ivory Coast', 'E', '/flags/ci.svg', ''),
('Morocco', 'E', '/flags/ma.svg', ''),
-- Group F
('Australia', 'F', '/flags/au.svg', ''),
('New Zealand', 'F', '/flags/nz.svg', ''),
('China', 'F', '/flags/cn.svg', ''),
('Qatar', 'F', '/flags/qa.svg', ''),
('UAE', 'F', '/flags/ae.svg', ''),
('Iran', 'F', '/flags/ir.svg', ''),
-- Group G
('Egypt', 'G', '/flags/eg.svg', ''),
('Algeria', 'G', '/flags/dz.svg', ''),
('Tunisia', 'G', '/flags/tn.svg', ''),
('DR Congo', 'G', '/flags/cd.svg', ''),
('South Africa', 'G', '/flags/za.svg', ''),
('Kenya', 'G', '/flags/ke.svg', ''),
-- Group H
('Canada', 'H', '/flags/ca.svg', ''),
('Chile', 'H', '/flags/cl.svg', ''),
('Ecuador', 'H', '/flags/ec.svg', ''),
('Paraguay', 'H', '/flags/py.svg', ''),
('Venezuela', 'H', '/flags/ve.svg', ''),
('Bolivia', 'H', '/flags/bo.svg', '');
